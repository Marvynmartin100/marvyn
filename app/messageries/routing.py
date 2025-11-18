# messagerie/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # ws://.../ws/conversation/<conversation_id>/
    re_path(r'ws/conversation/(?P<conversation_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
]


