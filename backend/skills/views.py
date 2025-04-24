from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import SkillProfile, Mentorship
from .serializers import SkillProfileSerializer, MentorshipSerializer
from api.models import CustomUser
from credits.models import Credit
from projects.models import Notification
from django.utils import timezone
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
import logging
from rest_framework import generics, permissions
from django.db.models import Q

logger = logging.getLogger(__name__)

# --- Public Skill Profile Views ---

class SkillProfileListView(generics.ListAPIView):
    """List public skill profiles, filterable by skill, mentor status, category."""
    serializer_class = SkillProfileSerializer
    permission_classes = [permissions.AllowAny] # Allow anyone to browse

    def get_queryset(self):
        queryset = SkillProfile.objects.select_related('user', 'category').all()
        skill = self.request.query_params.get('skill')
        is_mentor = self.request.query_params.get('is_mentor')
        category_id = self.request.query_params.get('category_id')

        if skill:
            queryset = queryset.filter(skill__icontains=skill)
        if is_mentor is not None:
            try:
                is_mentor_bool = json.loads(is_mentor.lower())
                queryset = queryset.filter(is_mentor=is_mentor_bool)
            except json.JSONDecodeError:
                logger.warning(f"Invalid boolean value for is_mentor: {is_mentor}")
                # Potentially return empty or ignore filter based on requirements
                queryset = queryset.none() 
        if category_id is not None:
            try:
                queryset = queryset.filter(category_id=int(category_id))
            except ValueError:
                logger.warning(f"Invalid integer value for category_id: {category_id}")
                # Potentially return empty or ignore filter based on requirements
                queryset = queryset.none()
        
        return queryset.order_by('-created_at')

class SkillProfileDetailView(generics.RetrieveAPIView):
    """Retrieve a specific public skill profile."""
    queryset = SkillProfile.objects.select_related('user', 'category').all()
    serializer_class = SkillProfileSerializer
    permission_classes = [permissions.AllowAny]


# --- User-Specific Skill Profile Management Views ---

class UserSkillProfileListView(generics.ListCreateAPIView):
    """List and create skill profiles for the currently authenticated user."""
    serializer_class = SkillProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Only return profiles belonging to the requesting user."""
        return SkillProfile.objects.filter(user=self.request.user).select_related('category').order_by('skill')

    def perform_create(self, serializer):
        """Ensure the created profile is associated with the requesting user."""
        serializer.save(user=self.request.user)
        logger.info(f"User {self.request.user.username} created skill profile for skill: {serializer.validated_data.get('skill')}")

class UserSkillProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific skill profile owned by the user."""
    serializer_class = SkillProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Only allow operations on profiles belonging to the requesting user."""
        return SkillProfile.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(user=self.request.user) # Ensure user is not changed
        logger.info(f"User {self.request.user.username} updated skill profile ID: {self.get_object().id}")

    def perform_destroy(self, instance):
        logger.warning(f"User {self.request.user.username} deleted skill profile ID: {instance.id} for skill: {instance.skill}")
        instance.delete()

# --- Mentorship Views ---

class MentorshipRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skill_profile_id = request.data.get('skill_profile_id')
        if not skill_profile_id:
            return Response({"error": "skill_profile_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            skill_profile = SkillProfile.objects.select_related('user').get(id=skill_profile_id, is_mentor=True)
            if skill_profile.user == request.user:
                logger.warning(f"User {request.user.username} attempted to request mentorship from self")
                return Response({"error": "Cannot request mentorship from yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for existing pending/active mentorship for the same skill
            existing_mentorship = Mentorship.objects.filter(
                learner=request.user, 
                skill=skill_profile, 
                status__in=['pending', 'active']
            ).exists()
            if existing_mentorship:
                logger.warning(f"User {request.user.username} already has a pending/active mentorship for skill {skill_profile.skill}")
                return Response({"error": "You already have a pending or active mentorship for this skill."}, status=status.HTTP_400_BAD_REQUEST)

            # Check credits
            learner_credits = request.user.get_credits()
            if learner_credits.balance < 15:
                logger.warning(f"User {request.user.username} has insufficient credits ({learner_credits.balance}) for mentorship request")
                return Response({"error": "Insufficient credits (15 required)"}, status=status.HTTP_400_BAD_REQUEST)

            mentorship = Mentorship.objects.create(
                learner=request.user,
                mentor=skill_profile.user,
                skill=skill_profile,
                status='pending'
            )
            serializer = MentorshipSerializer(mentorship)

            learner_credits.spend_credits(15, f"Mentorship request to {skill_profile.user.username} for {skill_profile.skill}")
            logger.info(f"Deducted 15 credits from {request.user.username} for mentorship request {mentorship.id}")

            Notification.objects.create(
                user=skill_profile.user,
                message=f"{request.user.username} requested mentorship in {skill_profile.skill}",
                notification_type='mentorship_request',
                link=f"/mentorships/{mentorship.id}" # Link to the specific mentorship details
            )
            logger.info(f"Created mentorship request notification for mentor {skill_profile.user.username}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except SkillProfile.DoesNotExist:
            logger.error(f"SkillProfile {skill_profile_id} not found or is not a mentor profile")
            return Response({"error": "Mentor skill profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Error creating mentorship request for user {request.user.username}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MentorshipAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        try:
            mentorship = Mentorship.objects.select_related('learner', 'skill').get(id=id, mentor=request.user, status='pending')
            mentorship.status = 'active'
            mentorship.auto_complete_date = timezone.now() + timedelta(days=30)
            mentorship.save()

            mentor_credits = request.user.get_credits()
            mentor_credits.add_credits(10, f"Accepted mentorship for {mentorship.skill.skill} with {mentorship.learner.username}")
            logger.info(f"Awarded 10 credits to {request.user.username} for accepting mentorship {mentorship.id}")

            Notification.objects.create(
                user=mentorship.learner,
                message=f"{request.user.username} accepted your mentorship request in {mentorship.skill.skill}",
                notification_type='mentorship_accepted',
                link=f"/mentorships/{mentorship.id}"
            )
            logger.info(f"Created mentorship accepted notification for learner {mentorship.learner.username}")

            serializer = MentorshipSerializer(mentorship)
            return Response(serializer.data)
        except Mentorship.DoesNotExist:
            logger.error(f"Mentorship {id} not found, not pending, or user {request.user.username} is not the mentor")
            return Response({"error": "Mentorship not found, already accepted/rejected, or you are not the mentor."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Error accepting mentorship {id} by user {request.user.username}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MentorshipRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        try:
            mentorship = Mentorship.objects.select_related('learner', 'skill').get(id=id, mentor=request.user, status='pending')
            mentorship.status = 'rejected' # Add a rejected status if you want to track this
            # Alternatively, just delete it:
            mentorship_skill = mentorship.skill.skill
            learner_user = mentorship.learner
            mentorship.delete()
            logger.info(f"Mentor {request.user.username} rejected and deleted mentorship request {id}")

            # Refund credits to the learner
            learner_credits = learner_user.get_credits()
            learner_credits.add_credits(15, f"Refund for rejected mentorship request for {mentorship_skill}")
            logger.info(f"Refunded 15 credits to learner {learner_user.username} for rejected mentorship {id}")

            Notification.objects.create(
                user=learner_user,
                message=f"{request.user.username} rejected your mentorship request in {mentorship_skill}",
                notification_type='mentorship_rejected'
                # No link needed if it's deleted
            )
            logger.info(f"Created mentorship rejected notification for learner {learner_user.username}")

            return Response({"message": "Mentorship request rejected successfully."}, status=status.HTTP_200_OK)
        except Mentorship.DoesNotExist:
            logger.error(f"Mentorship {id} not found, not pending, or user {request.user.username} is not the mentor for rejection")
            return Response({"error": "Mentorship not found, already accepted/rejected, or you are not the mentor."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Error rejecting mentorship {id} by user {request.user.username}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MentorshipCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        feedback = request.data.get('feedback')
        rating_str = request.data.get('rating')
        rating = None

        if rating_str:
            try:
                rating = int(rating_str)
                if not 1 <= rating <= 5:
                    logger.warning(f"Invalid rating {rating} submitted by {request.user.username} for mentorship {id}")
                    return Response({"error": "Rating must be between 1 and 5"}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                 logger.warning(f"Invalid rating format '{rating_str}' submitted by {request.user.username} for mentorship {id}")
                 return Response({"error": "Invalid rating format. Please provide an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            mentorship = Mentorship.objects.select_related('mentor', 'skill').get(id=id, learner=request.user, status='active')
            
            mentorship.status = 'completed'
            mentorship.feedback = feedback
            mentorship.rating = rating
            mentorship.save()
            logger.info(f"Mentorship {id} completed by learner {request.user.username} with rating {rating or 'N/A'}")

            # Award credits only if rating is high
            if rating and rating >= 4:
                mentor_credits = mentorship.mentor.get_credits()
                mentor_credits.add_credits(20, f"High rating ({rating}) for mentorship in {mentorship.skill.skill} with {request.user.username}")
                logger.info(f"Awarded 20 credits to mentor {mentorship.mentor.username} for high-rated mentorship {id}")

            Notification.objects.create(
                user=mentorship.mentor,
                message=f"{request.user.username} completed the mentorship in {mentorship.skill.skill} (Rating: {rating or 'N/A'})",
                notification_type='mentorship_completed',
                link=f"/mentorships/{mentorship.id}" # Link to see feedback
            )
            logger.info(f"Created mentorship completed notification for mentor {mentorship.mentor.username}")

            serializer = MentorshipSerializer(mentorship)
            return Response(serializer.data)
        except Mentorship.DoesNotExist:
            logger.error(f"Mentorship {id} not found, not active, or user {request.user.username} is not the learner")
            return Response({"error": "Mentorship not found, not active, or you are not the learner."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Error completing mentorship {id} by user {request.user.username}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserMentorshipsListView(generics.ListAPIView):
    """List mentorships where the requesting user is either the mentor or mentee."""
    serializer_class = MentorshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('status')
        queryset = Mentorship.objects.filter(Q(mentor=user) | Q(learner=user))
        
        if status_filter:
            statuses = [s.strip() for s in status_filter.split(',') if s.strip()]
            queryset = queryset.filter(status__in=statuses)
            
        return queryset.select_related('mentor', 'learner', 'skill', 'skill__category').order_by('-created_at')

class MentorshipDetailView(generics.RetrieveAPIView):
    """ Retrieve details of a specific mentorship if user is mentor or learner. """
    serializer_class = MentorshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Mentorship.objects.all()

    def get_queryset(self):
        user = self.request.user
        # Filter to only mentorships the user is part of
        return Mentorship.objects.filter(Q(mentor=user) | Q(learner=user)).select_related('mentor', 'learner', 'skill', 'skill__category')