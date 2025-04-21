from django.urls import path
from . import views

urlpatterns = [
    path('skill-profiles/', views.SkillProfileView.as_view(), name='skill-profiles'),
    path('skill-profiles/<int:id>/', views.SkillProfileView.as_view(), name='skill-profile-detail'),
    path('mentorship-request/', views.MentorshipRequestView.as_view(), name='mentorship-request'),
    path('mentorship-accept/<int:id>/', views.MentorshipAcceptView.as_view(), name='mentorship-accept'),
    path('mentorship-complete/<int:id>/', views.MentorshipCompleteView.as_view(), name='mentorship-complete'),
]
