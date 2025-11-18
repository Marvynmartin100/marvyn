# messagerie/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.core.exceptions import PermissionDenied

from .models import Conversation, Message

MAX_MESSAGE_LENGTH = 5000

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Connexion WebSocket : vérifier l'utilisateur et son droit d'accès à la conversation.
        """
        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')
        if not self.conversation_id:
            await self.close()
            return

        # Nom du groupe (évite caractères ambigus)
        self.group_name = f"conversation_{self.conversation_id}"

        # Vérifier participation (opération DB sync)
        try:
            await self._verify_participant()
        except PermissionDenied:
            await self.close()
            return

        # Joindre le groupe
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Quitter le groupe
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """
        Réception d'un message provenant du client.
        Format attendu JSON: {"type": "message", "contenu": "Bonjour"}
        """
        if text_data is None:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')

        if msg_type == 'message':
            contenu = (data.get('contenu') or "").strip()
            if not contenu:
                # ignore message vide
                return
            if len(contenu) > MAX_MESSAGE_LENGTH:
                # Optionnel: envoyer une erreur au client
                await self.send_json({"type": "error", "message": "Message trop long."})
                return

            # Sauvegarder le message en DB (sync->async)
            message_obj = await self._save_message(contenu)

            # Construire l'objet à broadcast (utilise format simple)
            payload = {
                "type": "chat.message",  # handler name below
                "message": {
                    "id": message_obj.id,
                    "contenu": message_obj.contenu,
                    "expediteur": message_obj.expediteur.username,
                    "expediteur_id": message_obj.expediteur.id,
                    "date_envoi": message_obj.date_envoi.isoformat(),
                    "conversation_id": self.conversation_id,
                    "lu": message_obj.lu,
                }
            }

            # Broadcast au groupe
            await self.channel_layer.group_send(self.group_name, payload)

        elif msg_type == 'mark_read':
            # Optionnel : marquer message(s) lu(s)
            message_id = data.get('message_id')
            if message_id:
                await self._mark_message_read(message_id)

    async def chat_message(self, event):
        """
        Handler pour l'événement group_send (nommé 'chat.message' via type).
        Envoie le message à tous les WebSocket clients du groupe.
        """
        message = event.get('message')
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": message
        }))

    # -----------------------
    # Fonctions DB (sync wrappers)
    # -----------------------
    @database_sync_to_async
    def _verify_participant(self):
        """
        Vérifie que self.scope['user'] est un participant de la conversation.
        Lève PermissionDenied si non autorisé.
        """
        user = self.scope["user"]
        if not user.is_authenticated:
            raise PermissionDenied

        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
        except Conversation.DoesNotExist:
            raise PermissionDenied

        if user != conversation.utilisateur1 and user != conversation.utilisateur2:
            raise PermissionDenied

        # OK
        return True

    @database_sync_to_async
    def _save_message(self, contenu):
        """
        Crée et enregistre le message dans la DB, retourne l'instance Message.
        """
        user = self.scope["user"]
        conversation = Conversation.objects.get(id=self.conversation_id)
        msg = Message.objects.create(
            contenu=contenu,
            expediteur=user,
            conversation=conversation
        )
        return msg

    @database_sync_to_async
    def _mark_message_read(self, message_id):
        """
        Marque un message comme lu si le scope user est destinataire.
        (Logique simple : si expéditeur != user, on met lu=True)
        """
        user = self.scope["user"]
        try:
            m = Message.objects.get(id=message_id, conversation_id=self.conversation_id)
        except Message.DoesNotExist:
            return False

        if m.expediteur == user:
            # L'expéditeur ne peut pas marquer son propre message comme lu
            return False

        m.lu = True
        m.date_lecture = timezone.now()
        m.save()
        return True
