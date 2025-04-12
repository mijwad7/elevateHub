"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from api.views import CreateUserView, CustomTokenObtainPairView, UserListView, UserDeleteView, ProfileImageUploadView, UserListCreateView, get_csrf, UserRetrieveUpdateDestroyView, auth_status, direct_logout, LogoutView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static
from allauth.account.views import LogoutView
from django.views.decorators.csrf import csrf_exempt
urlpatterns = [
    path("admin/", admin.site.urls),
    path("admin-panel/", include("admin_panel.urls")),
    path("api/", include("api.urls")),
    path("api/", include("discussions.urls")),  # Include discussions URLs
    path('api/', include('credits.urls')),
    path('api/', include('resources.urls')),
    path('api/', include('projects.urls')),
    path("accounts/", include("allauth.urls")),
    path("accounts/logout/", csrf_exempt(LogoutView.as_view()), name="account_logout"),  # Override with CSRF exemption
    path("api/get-csrf/", get_csrf, name="get_csrf"),
    path("csrf/", get_csrf, name="csrf_fallback"),  # Fallback for old URLs

    # path("api/user/register/", CreateUserView.as_view(), name="register"),
    # path("api/token/", CustomTokenObtainPairView.as_view(), name="get_token"),
    # path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    # path("api-auth/", include("rest_framework.urls")),
    # path("api/users/", UserListCreateView.as_view(), name="user_list_create"),
    # path("api/users/<int:pk>/", UserRetrieveUpdateDestroyView.as_view(), name="user_detail"),
    # path("api/users/<int:user_id>/upload-profile/", ProfileImageUploadView.as_view(), name="upload-profile"),
]
urlpatterns += [path("auth/status/", auth_status)]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)