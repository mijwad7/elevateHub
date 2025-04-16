from django.urls import path, include
from .views import (
    CreateUserView, CustomTokenObtainPairView, UserListView, UserDeleteView,
    ProfileImageUploadView, UserListCreateView, UserRetrieveUpdateDestroyView,
    PasswordResetRequestView, PasswordResetConfirmView, auth_status, LogoutView,
    GenerateOTPView, VerifyOTPView, UserUpdateView, create_session, get_csrf,
    user_contributions, edit_contribution, delete_contribution, logout_session
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
    path("logout-session/", logout_session, name="logout_session"),
    path("generate-otp/", GenerateOTPView.as_view(), name="generate_otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify_otp"),
    path("users/<int:user_id>/update/", UserUpdateView.as_view(), name="user_update"),
    path("create-session/", create_session, name="create_session"),
    path("get-csrf/", get_csrf, name="get_csrf"),
    path("auth/status/", auth_status, name="auth_status"),
    path('users/<int:pk>/update/', UserUpdateView.as_view(), name='user-update'),
    path('users/<int:user_id>/upload-profile/', ProfileImageUploadView.as_view(), name='upload-profile'),
    path('user/contributions/', user_contributions, name='user-contributions'),
    path('contributions/<str:contribution_type>/<int:contribution_id>/edit/', edit_contribution, name='edit-contribution'),
    path('contributions/<str:contribution_type>/<int:contribution_id>/delete/', delete_contribution, name='delete-contribution'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)