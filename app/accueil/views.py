from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import ContactForm
# Create your views here.

from django.http import JsonResponse
from django.contrib import messages


from django.http import JsonResponse
from django.shortcuts import render
from .forms import ContactForm

def accueil(request):
    form = ContactForm(request.POST or None)

    if request.method == "POST" and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        if form.is_valid():
            form.save()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    "success": True,
                    "html": '<p class="success">Votre message a été envoyé avec succès !</p>'
                })
        else:
            # Générer les erreurs pour chaque champ si besoin
            errors_html = ''.join([f'<p class="error">{field}: {", ".join(errs)}</p>'
                                   for field, errs in form.errors.items()])
            return JsonResponse({
                "success": False,
                "html": f'<p class="error">Veuillez corriger les erreurs ci-dessous.</p>{errors_html}'
            })

    return render(request, "accueil/accueil.html", {"form": form})

# views.py

