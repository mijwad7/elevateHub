from django.urls import path, include
from .views import (
    CreateUserView, CustomTokenObtainPairView, UserListView, UserDeleteView,
    ProfileImageUploadView, UserListCreateView, UserRetrieveUpdateDestroyView,
    PasswordResetRequestView, PasswordResetConfirmView, auth_status, LogoutView,
    GenerateOTPView, VerifyOTPView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("user/register/", CreateUserView.as_view(), name="register"),
    path("token/", CustomTokenObtainPairView.as_view(), name="get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api-auth/", include("rest_framework.urls")),
    path("users/", UserListCreateView.as_view(), name="user_list_create"),
    path("users/<int:pk>/", UserRetrieveUpdateDestroyView.as_view(), name="user_detail"),
    path("users/<int:user_id>/upload-profile/", ProfileImageUploadView.as_view(), name="upload-profile"),
    path("reset-password/", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("reset-password/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("generate-otp/", GenerateOTPView.as_view(), name="generate_otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify_otp"),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)