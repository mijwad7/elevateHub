from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import generics, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from django.contrib.auth import login
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import CustomUser
from discussions.models import DiscussionPost
from resources.models import Resource
from projects.models import HelpRequest
from .models import Category
from .serializers import UserSerializer, PasswordResetRequestSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth import get_user_model, logout
from django.http import JsonResponse
from credits.models import Credit
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
import os
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "profile_image": self.user.profile_image.url if self.user.profile_image else None,
            "is_staff": self.user.is_staff,
            "credits": self.user.get_credits().balance,
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        login(request, user)  # Create session before response
        response = Response(serializer.validated_data, status=200)
        return response

@api_view(['POST'])
def create_session(request):
    # Authenticate using JWT
    jwt_auth = JWTAuthentication()
    try:
        user, _ = jwt_auth.authenticate(request)
        if user:
            login(request, user)  # Create session
            return Response({"message": "Session created"}, status=200)
        return Response({"error": "Invalid token"}, status=401)
    except Exception as e:
        return Response({"error": str(e)}, status=401)

@api_view(['POST'])
def logout_session(request):
    if request.user.is_authenticated:
        logout(request)  # Clears the session
        return Response({"message": "Session logged out successfully"}, status=status.HTTP_200_OK)
    return Response({"message": "No active session"}, status=status.HTTP_200_OK)

class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        query = self.request.query_params.get("q", "")
        return self.queryset.filter(username__icontains=query)

class UserDeleteView(generics.DestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class ProfileImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication, TokenAuthentication]

    def put(self, request, user_id):
        try:
            # Ensure the user can only update their own profile
            if request.user.id != int(user_id):
                return Response(
                    {"error": "You can only update your own profile"},
                    status=status.HTTP_403_FORBIDDEN
                )

            try:
                user = CustomUser.objects.get(id=user_id)
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if a file was provided
            profile_image = request.FILES.get('profile_image')
            if not profile_image:
                return Response(
                    {"error": "No profile image provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate file type
            if not profile_image.content_type.startswith('image/'):
                return Response(
                    {"error": "File must be an image"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate file size (5MB max)
            if profile_image.size > 5 * 1024 * 1024:
                return Response(
                    {"error": "File size must be less than 5MB"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Delete old profile image if exists
            if user.profile_image:
                try:
                    if os.path.isfile(user.profile_image.path):
                        os.remove(user.profile_image.path)
                except Exception as e:
                    print(f"Error deleting old profile image: {e}")

            # Update profile image
            user.profile_image = profile_image
            user.save()

            # Return updated user data
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request, user_id):
        # This method is added to handle CSRF token generation
        return Response({"detail": "CSRF token will be set in cookie"}, status=status.HTTP_200_OK)

class UserListCreateView(generics.ListCreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        query = self.request.query_params.get("q", "")
        return self.queryset.filter(username__icontains=query)

class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.send_reset_email()
            return Response({"message": "Password reset email sent."}, status=200)
        return Response(serializer.errors, status=400)

class PasswordResetConfirmView(APIView):
    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid token"}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token"}, status=400)

        new_password = request.data.get("password")
        if not new_password:
            return Response({"error": "Password is required"}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password reset successful."}, status=200)

from django.middleware.csrf import get_token

@api_view(['GET'])
@ensure_csrf_cookie
def get_csrf(request):
    csrf_token = get_token(request)  # Generates or retrieves CSRF token
    response = JsonResponse({'csrftoken': csrf_token})
    response.set_cookie('csrftoken', csrf_token, samesite='Lax')  # Ensure cookie is set
    return response

@api_view(['GET'])
@ensure_csrf_cookie
def auth_status(request):
    if request.user.is_authenticated:
        credit = request.user.get_credits()
        user_data = {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'profile_image': request.user.profile_image.url if request.user.profile_image else None,
            'credits': credit.balance,
        }
        return Response({'is_authenticated': True, 'user': user_data})
    return Response({'is_authenticated': False})

@csrf_exempt
def direct_logout(request):
    if request.method == "POST" or request.method == "GET":
        logout(request)
        return JsonResponse({"status": "logged out"})
    return JsonResponse({"error": "Method not allowed"}, status=405)

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"status": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class GenerateOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not email or not username or not password:
            return Response({'error': 'Email, username and password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if user already exists
            user = User.objects.get(email=email)
            if user.is_active:
                return Response({'error': 'User already exists'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            # Create inactive user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_active=False
            )

        try:
            otp_code = user.generate_otp()
            
            # Send OTP via email
            send_mail(
                'Your OTP Code',
                f'Your OTP code is: {otp_code}',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            
            return Response({'message': 'OTP sent successfully'}, 
                          status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        
        if not email or not otp_code:
            return Response({'error': 'Email and OTP code are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.verify_otp(otp_code):
                # Generate tokens for the now active user
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': 'OTP verified successfully',
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'profile_image': user.profile_image.url if user.profile_image else None,
                        'is_staff': user.is_staff
                    }
                }, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid or expired OTP'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, 
                          status=status.HTTP_404_NOT_FOUND)

class UserUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication, TokenAuthentication]

    def put(self, request, user_id):
        try:
            # Ensure the user can only update their own profile
            if str(request.user.id) != str(user_id):
                return Response(
                    {"error": "You can only update your own profile"},
                    status=status.HTTP_403_FORBIDDEN
                )

            try:
                user = CustomUser.objects.get(id=user_id)
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Update user data
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                # Only update the fields that were provided
                updated_user = serializer.save()
                return Response(UserSerializer(updated_user).data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_contributions(request):
    user = request.user
    
    # Get discussion posts
    discussion_posts = DiscussionPost.objects.filter(user=user).select_related('discussion').order_by('-created_at')
    discussion_data = [{
        'id': post.discussion.id,
        'post_id': post.id,
        'type': 'discussion',
        'title': post.discussion.title,
        'content': post.content,
        'upvotes': post.upvotes,
        'created_at': post.created_at.isoformat()
    } for post in discussion_posts]
    
    # Get resources
    resources = Resource.objects.filter(uploaded_by=user).order_by('-created_at')
    resource_data = [{
        'id': resource.id,
        'type': 'resource',
        'title': resource.title,
        'description': resource.description,
        'upvotes': resource.upvotes,
        'download_count': resource.download_count,
        'created_at': resource.created_at.isoformat()
    } for resource in resources]
    
    # Combine and sort by creation date
    contributions = discussion_data + resource_data
    contributions.sort(key=lambda x: x['created_at'], reverse=True)
    
    return Response(contributions)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_contribution(request, contribution_type, contribution_id):
    user = request.user
    
    try:
        if contribution_type == 'discussion':
            # For discussions, contribution_id is actually the post_id
            post = DiscussionPost.objects.get(id=contribution_id)
            if post.user != user:
                return Response({"error": "You can only edit your own contributions"}, status=status.HTTP_403_FORBIDDEN)
            post.content = request.data.get('content', post.content)
            post.save()
            return Response({
                'id': post.discussion.id,
                'post_id': post.id,
                'type': 'discussion',
                'title': post.discussion.title,
                'content': post.content,
                'upvotes': post.upvotes,
                'created_at': post.created_at.isoformat()
            })
        elif contribution_type == 'resource':
            resource = Resource.objects.get(id=contribution_id)
            if resource.uploaded_by != user:
                return Response({"error": "You can only edit your own contributions"}, status=status.HTTP_403_FORBIDDEN)
            resource.title = request.data.get('title', resource.title)
            resource.description = request.data.get('description', resource.description)
            resource.save()
            return Response({
                'id': resource.id,
                'type': 'resource',
                'title': resource.title,
                'description': resource.description,
                'upvotes': resource.upvotes,
                'download_count': resource.download_count,
                'created_at': resource.created_at.isoformat()
            })
        else:
            return Response({"error": "Invalid contribution type"}, status=status.HTTP_400_BAD_REQUEST)
    except (DiscussionPost.DoesNotExist, Resource.DoesNotExist):
        return Response({"error": "Contribution not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_contribution(request, contribution_type, contribution_id):
    user = request.user
    
    try:
        if contribution_type == 'discussion':
            post = DiscussionPost.objects.get(id=contribution_id)
            if post.user != user:
                return Response({"error": "You can only delete your own contributions"}, status=status.HTTP_403_FORBIDDEN)
            post.delete()
            return Response({"message": "Discussion post deleted successfully"})
        elif contribution_type == 'resource':
            resource = Resource.objects.get(id=contribution_id)
            if resource.uploaded_by != user:
                return Response({"error": "You can only delete your own contributions"}, status=status.HTTP_403_FORBIDDEN)
            resource.delete()
            return Response({"message": "Resource deleted successfully"})
        else:
            return Response({"error": "Invalid contribution type"}, status=status.HTTP_400_BAD_REQUEST)
    except (DiscussionPost.DoesNotExist, Resource.DoesNotExist):
        return Response({"error": "Contribution not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_help_requests(request):
    user = request.user
    
    # Get help requests
    help_requests = HelpRequest.objects.filter(created_by=user).select_related('category').order_by('-created_at')
    help_request_data = [{
        'id': help_request.id,
        'type': 'help_request',
        'title': help_request.title,
        'description': help_request.description,
        'category': help_request.category.name if help_request.category else None,
        'status': help_request.status,
        'credit_offer_chat': help_request.credit_offer_chat,
        'credit_offer_video': help_request.credit_offer_video,
        'created_at': help_request.created_at.isoformat()
    } for help_request in help_requests]
    
    return Response(help_request_data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_help_request(request, help_request_id):
    user = request.user
    
    try:
        help_request = HelpRequest.objects.get(id=help_request_id)
        if help_request.created_by != user:
            return Response({"error": "You can only edit your own help requests"}, status=status.HTTP_403_FORBIDDEN)
        
        help_request.title = request.data.get('title', help_request.title)
        help_request.description = request.data.get('description', help_request.description)
        help_request.status = request.data.get('status', help_request.status)
        help_request.credit_offer_chat = request.data.get('credit_offer_chat', help_request.credit_offer_chat)
        help_request.credit_offer_video = request.data.get('credit_offer_video', help_request.credit_offer_video)
        # Update category if provided
        if 'category' in request.data:
            try:
                category = Category.objects.get(name=request.data['category'])
                help_request.category = category
            except Category.DoesNotExist:
                return Response({"error": "Invalid category"}, status=status.HTTP_400_BAD_REQUEST)
        
        help_request.save()
        return Response({
            'id': help_request.id,
            'type': 'help_request',
            'title': help_request.title,
            'description': help_request.description,
            'category': help_request.category.name if help_request.category else None,
            'status': help_request.status,
            'credit_offer_chat': help_request.credit_offer_chat,
            'credit_offer_video': help_request.credit_offer_video,
            'created_at': help_request.created_at.isoformat()
        })
    except HelpRequest.DoesNotExist:
        return Response({"error": "Help request not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_help_request(request, help_request_id):
    user = request.user
    
    try:
        help_request = HelpRequest.objects.get(id=help_request_id)
        if help_request.created_by != user:
            return Response({"error": "You can only delete your own help requests"}, status=status.HTTP_403_FORBIDDEN)
        help_request.delete()
        return Response({"message": "Help request deleted successfully"})
    except HelpRequest.DoesNotExist:
        return Response({"error": "Help request not found"}, status=status.HTTP_404_NOT_FOUND)