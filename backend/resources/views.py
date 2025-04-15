from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from .models import Resource, ResourceVote, ResourceDownload, ResourceFile
from .serializers import ResourceSerializer

class ResourceListCreateView(generics.ListCreateAPIView):
    """
    List all resources or create a new one.
    Supports filtering by category and searching by title/description.
    """
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Allow read for all, write for authenticated
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'upvotes', 'download_count']  # Fields to sort by
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Resource.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        file_type = self.request.query_params.get('file_type')
        if file_type:
            queryset = queryset.filter(file__endswith=f'.{file_type.lower()}')
        return queryset

    def perform_create(self, serializer):
        # Save the resource
        resource = serializer.save(uploaded_by=self.request.user)
        # Handle multiple file uploads
        files = self.request.FILES.getlist('files')  # Expect multiple files
        for file in files:
            file_type = file.content_type.split('/')[0]  # e.g., "image", "video", "application"
            ResourceFile.objects.create(resource=resource, file=file, file_type=file_type)

class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific resource.
    """
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Read for all, write for authenticated
    lookup_field = 'id'

@api_view(['POST'])
def toggle_vote(request, resource_id):
    """
    Toggle upvote for a resource.
    """
    resource = get_object_or_404(Resource, id=resource_id)
    vote, created = ResourceVote.objects.get_or_create(user=request.user, resource=resource)
    if not created:  # If upvote exists, remove it
        vote.delete()
        resource.upvotes -= 1
        resource.save()
        message = "Upvote removed"
    else:
        message = "Upvote added"  # Increment handled by signal
    return Response({"message": message, "upvotes": resource.upvotes}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def download_resource(request, resource_id):
    """
    Record a download for a resource.
    """
    resource = get_object_or_404(Resource, id=resource_id)
    ResourceDownload.objects.get_or_create(user=request.user, resource=resource)
    return Response({"download_count": resource.download_count}, status=status.HTTP_200_OK)