from django import forms
from .models import Contact

class ContactForm(forms.ModelForm):
    class Meta:
        model = Contact
        fields = ["nom", "email", "sujet", "message"]
        widgets = {
            "nom": forms.TextInput(attrs={"placeholder": "Votre nom"}),
            "email": forms.EmailInput(attrs={"placeholder": "Votre adresse email"}),
            "sujet": forms.TextInput(attrs={"placeholder": "Sujet du message"}),
            "message": forms.Textarea(attrs={"rows": 5, "placeholder": "Écrivez votre message ici..."}),
        }
