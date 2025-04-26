from django.urls import path
from .views import (
    SkillProfileListView, 
    SkillProfileDetailView,
    UserSkillProfileListView,
    UserSkillProfileDetailView,
    MentorshipRequestView, 
    MentorshipAcceptView, 
    MentorshipRejectView,
    MentorshipCompleteView,
    UserMentorshipsListView,
    MentorshipDetailView,
    AdminMentorshipListCreateView,
    AdminMentorshipDetailView
)

urlpatterns = [
    # Public Skill Profile Browsing
    path('skill-profiles/', SkillProfileListView.as_view(), name='skill-profile-list'),
    path('skill-profiles/<int:pk>/', SkillProfileDetailView.as_view(), name='skill-profile-detail'),

    # User-Specific Skill Profile Management
    path('user/skill-profiles/', UserSkillProfileListView.as_view(), name='user-skill-profile-list'),
    path('user/skill-profiles/<int:pk>/', UserSkillProfileDetailView.as_view(), name='user-skill-profile-detail'),

    # Mentorship Actions
    path('mentorships/request/', MentorshipRequestView.as_view(), name='mentorship-request'),
    path('mentorships/<int:id>/accept/', MentorshipAcceptView.as_view(), name='mentorship-accept'),
    path('mentorships/<int:id>/reject/', MentorshipRejectView.as_view(), name='mentorship-reject'),
    path('mentorships/<int:id>/complete/', MentorshipCompleteView.as_view(), name='mentorship-complete'),
    path('mentorships/', UserMentorshipsListView.as_view(), name='user-mentorships-list'),
    path('mentorships/<int:pk>/', MentorshipDetailView.as_view(), name='mentorship-detail'),
    path('user/mentorships/', UserMentorshipsListView.as_view(), name='user-mentorships-list'),
    path('admin/mentorships/', AdminMentorshipListCreateView.as_view(), name='admin-mentorships-list-create'),
    path('admin/mentorships/<int:pk>/', AdminMentorshipDetailView.as_view(), name='admin-mentorship-detail'),
]
