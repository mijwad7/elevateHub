from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Resource, ResourceVote, ResourceDownload
from .serializers import ResourceSerializer

class ResourceListCreateView(generics.ListCreateAPIView):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_vote(request, resource_id):
    resource = Resource.objects.get(id=resource_id)
    vote, created = ResourceVote.objects.get_or_create(user=request.user, resource=resource)
    if not created:  # If upvote exists, remove it
        vote.delete()
        resource.upvotes -= 1  # Decrement on removal
        resource.save()
        message = "Upvote removed"
    else:
        message = "Upvote added"  # Increment handled by signal
    return Response({"message": message, "upvotes": resource.upvotes})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def download_resource(request, resource_id):
    resource = Resource.objects.get(id=resource_id)
    ResourceDownload.objects.get_or_create(user=request.user, resource=resource)
    return Response({"download_count": resource.download_count})