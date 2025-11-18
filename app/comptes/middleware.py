

from django.contrib.auth import get_user_model
from django.contrib.auth import logout

User = get_user_model()

class CheckDeletedUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user_id = request.session.get('_auth_user_id')
        if user_id:
            try:
                User.objects.get(id=user_id)
            except User.DoesNotExist:
                logout(request)
        return self.get_response(request)

