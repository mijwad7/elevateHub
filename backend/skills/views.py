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

class SkillProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        if id is not None:
            try:
                profile = SkillProfile.objects.get(id=id)
                serializer = SkillProfileSerializer(profile)
                return Response(serializer.data)
            except SkillProfile.DoesNotExist:
                logger.error(f"SkillProfile {id} not found")
                return Response({"error": "Skill profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        skill = request.query_params.get('skill')
        is_mentor = request.query_params.get('is_mentor')
        profiles = SkillProfile.objects.all()
        if skill:
            profiles = profiles.filter(skill__icontains=skill)
        if is_mentor is not None:
            profiles = profiles.filter(is_mentor=json.loads(is_mentor.lower()))
        serializer = SkillProfileSerializer(profiles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SkillProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MentorshipView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            mentorship = Mentorship.objects.get(id=id)
            # Ensure the user is either the learner or mentor
            if request.user not in [mentorship.learner, mentorship.mentor]:
                logger.warning(f"User {request.user.username} unauthorized for mentorship {id}")
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            serializer = MentorshipSerializer(mentorship)
            return Response(serializer.data)
        except Mentorship.DoesNotExist:
            logger.error(f"Mentorship {id} not found")
            return Response({"error": "Mentorship not found"}, status=status.HTTP_404_NOT_FOUND)

class MentorshipRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skill_profile_id = request.data.get('skill_profile_id')
        try:
            skill_profile = SkillProfile.objects.get(id=skill_profile_id, is_mentor=True)
            if skill_profile.user == request.user:
                logger.warning(f"User {request.user.username} attempted to request mentorship from self")
                return Response({"error": "Cannot request mentorship from yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
            learner_credits = request.user.credits
            if learner_credits.balance < 15:
                logger.warning(f"User {request.user.username} has insufficient credits for mentorship request")
                return Response({"error": "Insufficient credits"}, status=status.HTTP_400_BAD_REQUEST)

            mentorship = Mentorship.objects.create(
                learner=request.user,
                mentor=skill_profile.user,
                skill=skill_profile,
                status='pending'
            )
            serializer = MentorshipSerializer(mentorship)

            learner_credits.spend_credits(15, f"Mentorship request for {skill_profile.skill}")
            logger.info(f"Deducted 15 credits from {request.user.username} for mentorship request")

            Notification.objects.create(
                user=skill_profile.user,
                message=f"{request.user.username} requested mentorship in {skill_profile.skill}",
                notification_type='info',
                link=f"/mentorships/{mentorship.id}"
            )
            logger.info(f"Created notification for mentor {skill_profile.user.username}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except SkillProfile.DoesNotExist:
            logger.error(f"SkillProfile {skill_profile_id} not found")
            return Response({"error": "Skill profile not found"}, status=status.HTTP_404_NOT_FOUND)

class MentorshipAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        try:
            mentorship = Mentorship.objects.get(id=id, mentor=request.user, status='pending')
            mentorship.status = 'active'
            mentorship.auto_complete_date = timezone.now() + timedelta(days=30)
            mentorship.save()

            mentor_credits = request.user.credits
            mentor_credits.add_credits(10, f"Mentorship accepted for {mentorship.skill.skill}")
            logger.info(f"Awarded 10 credits to {request.user.username} for accepting mentorship")

            Notification.objects.create(
                user=mentorship.learner,
                message=f"{request.user.username} accepted your mentorship request in {mentorship.skill.skill}",
                notification_type='success',
                link=f"/mentorships/{mentorship.id}"
            )
            logger.info(f"Created notification for learner {mentorship.learner.username}")

            serializer = MentorshipSerializer(mentorship)
            return Response(serializer.data)
        except Mentorship.DoesNotExist:
            logger.error(f"Mentorship {id} not found or unauthorized for user {request.user.username}")
            return Response({"error": "Mentorship not found or not authorized"}, status=status.HTTP_404_NOT_FOUND)

class MentorshipCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        try:
            mentorship = Mentorship.objects.get(id=id, learner=request.user, status='active')
            feedback = request.data.get('feedback')
            rating = request.data.get('rating')
            
            if rating is not None:
                rating = int(rating)
                if not 1 <= rating <= 5:
                    logger.warning(f"Invalid rating {rating} submitted by {request.user.username}")
                    return Response({"error": "Rating must be between 1 and 5"}, status=status.HTTP_400_BAD_REQUEST)
            
            mentorship.status = 'completed'
            mentorship.feedback = feedback
            mentorship.rating = rating
            mentorship.save()

            if rating and rating >= 4:
                mentor_credits = mentorship.mentor.credits
                mentor_credits.add_credits(20, f"Mentorship completed with high rating in {mentorship.skill.skill}")
                logger.info(f"Awarded 20 credits to {mentorship.mentor.username} for high-rated mentorship")

            Notification.objects.create(
                user=mentorship.mentor,
                message=f"{request.user.username} completed mentorship with rating {rating or 'N/A'}",
                notification_type='success',
                link=f"/mentorships/{mentorship.id}"
            )
            logger.info(f"Created notification for mentor {mentorship.mentor.username}")

            serializer = MentorshipSerializer(mentorship)
            return Response(serializer.data)
        except Mentorship.DoesNotExist:
            logger.error(f"Mentorship {id} not found or unauthorized for user {request.user.username}")
            return Response({"error": "Mentorship not found or not authorized"}, status=status.HTTP_404_NOT_FOUND)

class UserMentorshipsListView(generics.ListAPIView):
    """List mentorships where the requesting user is either the mentor or mentee."""
    serializer_class = MentorshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Fetch mentorships where the user is mentor OR learner
        # You might want to filter by status (e.g., 'active') depending on requirements
        # return Mentorship.objects.filter(Q(mentor=user) | Q(learner=user), status='active').select_related('mentor', 'learner', 'skill').order_by('-created_at')
        return Mentorship.objects.filter(Q(mentor=user) | Q(learner=user)).select_related('mentor', 'learner', 'skill').order_by('-created_at')