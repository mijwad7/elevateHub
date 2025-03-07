from django.urls import path
from .views import ResourceListCreateView, ResourceDetailView, toggle_vote, download_resource

urlpatterns = [
    path('resources/', ResourceListCreateView.as_view(), name='resource-list'),
    path('resources/<int:id>/', ResourceDetailView.as_view(), name='resource-detail'),
    path('resources/<int:resource_id>/vote/', toggle_vote, name='toggle-vote'),
    path('resources/<int:resource_id>/download/', download_resource, name='download-resource'),
]