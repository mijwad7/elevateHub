from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from .models import Resource, ResourceVote, ResourceDownload, ResourceFile
from .serializers import ResourceSerializer
import logging
import zipfile
import io
from django.http import StreamingHttpResponse
from urllib.parse import quote

logger = logging.getLogger(__name__)

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
        logger.info(f"Retrieving resources with filters: category={self.request.query_params.get('category')}, file_type={self.request.query_params.get('file_type')}")
        queryset = Resource.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        file_type = self.request.query_params.get('file_type')
        if file_type:
            queryset = queryset.filter(files__file__endswith=f'.{file_type.lower()}').distinct()
        return queryset

    def perform_create(self, serializer):
        logger.info(f"Creating new resource for user {self.request.user.username}")
        # Save the resource
        resource = serializer.save(uploaded_by=self.request.user)
        # Handle multiple file uploads
        files = self.request.FILES.getlist('files')  # Expect multiple files
        for file in files:
            file_type = file.content_type.split('/')[0]  # e.g., "image", "video", "application"
            ResourceFile.objects.create(resource=resource, file=file, file_type=file_type)
            logger.info(f"Added file {file.name} of type {file_type} to resource {resource.id}")

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
    logger.info(f"User {request.user.username} toggling vote on resource {resource_id}")
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
    Download all files of a resource as a ZIP archive and record a single download event.
    """
    resource = get_object_or_404(Resource, id=resource_id)
    logger.info(f"User {request.user.username} downloading resource {resource_id}")
    
    # Record the download (triggers credit awarding via signal)
    ResourceDownload.objects.get_or_create(user=request.user, resource=resource)
    
    # Get all files for the resource
    files = resource.files.all()
    
    if not files:
        logger.warning(f"No files found for resource {resource_id}")
        return Response({"error": "No files available for this resource"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create an in-memory ZIP file
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for resource_file in files:
            # Read the file content
            file_path = resource_file.file.path
            file_name = resource_file.file.name.split('/')[-1]  # Extract filename
            logger.info(f"Adding file {file_name} to zip for resource {resource_id}")
            with open(file_path, 'rb') as f:
                zip_file.writestr(file_name, f.read())
    
    buffer.seek(0)
    
    # Create a streaming response
    response = StreamingHttpResponse(
        buffer,
        content_type='application/zip'
    )
    # Safe filename for download
    zip_filename = quote(f"{resource.title}_files.zip")
    response['Content-Disposition'] = f'attachment; filename="{zip_filename}"'
    response['Content-Length'] = buffer.getbuffer().nbytes
    
    return response