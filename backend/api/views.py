from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import generics, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.views import APIView
from .models import CustomUser
from .serializers import UserSerializer, PasswordResetRequestSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth import get_user_model, logout
from django.http import JsonResponse
from credits.models import Credit
from rest_framework.decorators import api_view
from rest_framework import status
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings


User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "profile_image": self.user.profile_image.url if self.user.profile_image else None,
            "is_staff": self.user.is_staff
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

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
    authentication_classes = [SessionAuthentication, TokenAuthentication]  # Explicitly support both

    def put(self, request, user_id):
        # Ensure the user can only update their own profile
        # if request.user.id != int(user_id):
        #     return Response(
        #         {"error": "You can only update your own profile"},
        #         status=status.HTTP_403_FORBIDDEN
        #     )

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if a file was provided
        profile_image = request.FILES.get('profile_image')
        if not profile_image:
            return Response(
                {"error": "No profile image provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update profile image
        user.profile_image = profile_image
        user.save()

        # Return updated user data
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

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