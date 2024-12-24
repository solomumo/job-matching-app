from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ['id', 'job_title', 'company', 'location', 'date_posted', 
                 'url', 'description', 'scraped_at', 'is_bookmarked', 'bookmarked_by']

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarked_by.filter(id=request.user.id).exists()
        return False
