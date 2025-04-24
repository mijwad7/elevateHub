from django.urls import path
from . import views
from .views import UserMentorshipsListView

urlpatterns = [
    path('skill-profiles/', views.SkillProfileView.as_view(), name='skill-profiles'),
    path('skill-profiles/<int:id>/', views.SkillProfileView.as_view(), name='skill-profile-detail'),
    path('mentorships/<int:id>/', views.MentorshipView.as_view(), name='mentorship-detail'),
    path('mentorship-request/', views.MentorshipRequestView.as_view(), name='mentorship-request'),
    path('mentorship-accept/<int:id>/', views.MentorshipAcceptView.as_view(), name='mentorship-accept'),
    path('mentorship-complete/<int:id>/', views.MentorshipCompleteView.as_view(), name='mentorship-complete'),
    path('user/mentorships/', UserMentorshipsListView.as_view(), name='user_mentorships_list'),
]
