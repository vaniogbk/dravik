#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Genere le visuel d'une reference Dravik avec Gemini, au format du catalogue.

Les 48 visuels d'origine ont ete produits avec Gemini a partir de
DRAVIK/catalogue/prompts-gemini.json : fond blanc pur, lumiere diffuse, ombre
de contact, produit entier dans le cadre, carre 1:1, WebP 1000x1000 pour la
fiche et 500x500 pour les cartes. Ce script reprend exactement ce gabarit pour
les references ajoutees ensuite, afin qu'une nouvelle fiche ne detonne pas a
cote des autres.

Usage :
    GEMINI_API_KEY=... python scripts/generer-visuel-gemini.py DRV-049

Options :
    --modele <nom>   modele d'image (defaut : gemini-2.5-flash-image)
    --essais <n>     nombre de tentatives (defaut : 3)
    --apercu         ecrit aussi le PNG brut, pour inspection

Le visuel part dans scripts/dravik-extras-images/<slug>.webp, la ou le
generateur de catalogue va le chercher. Relancer ensuite :
    node scripts/build-dravik-catalogue.mjs
"""
import argparse
import base64
import io
import json
import os
import sys
import urllib.error
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMPTS = os.path.join(ROOT, 'scripts', 'dravik-extras-prompts.json')
EXTRAS = os.path.join(ROOT, 'scripts', 'dravik-extras.json')
OUT_DIR = os.path.join(ROOT, 'scripts', 'dravik-extras-images')

ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'


def charger(chemin):
    with io.open(chemin, encoding='utf-8') as f:
        return json.load(f)


def appeler_gemini(prompt, model, cle):
    """Renvoie les octets de la premiere image rendue par le modele."""
    corps = json.dumps({
        'contents': [{'parts': [{'text': prompt}]}],
        # Certains modeles rendent du texte en plus de l'image : on demande
        # explicitement les deux modalites, sinon l'image est omise.
        'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']},
    }).encode('utf-8')

    requete = urllib.request.Request(
        ENDPOINT.format(model=model),
        data=corps,
        headers={'Content-Type': 'application/json', 'x-goog-api-key': cle},
        method='POST',
    )

    try:
        with urllib.request.urlopen(requete, timeout=180) as reponse:
            donnees = json.loads(reponse.read().decode('utf-8'))
    except urllib.error.HTTPError as err:
        detail = err.read().decode('utf-8', 'replace')[:600]
        raise SystemExit(
            'Gemini a refuse la requete (HTTP %s).\n%s\n\n'
            "Si le modele est inconnu, passez-en un autre avec --modele."
            % (err.code, detail)
        )

    for candidat in donnees.get('candidates', []):
        for part in candidat.get('content', {}).get('parts', []):
            inline = part.get('inlineData') or part.get('inline_data')
            if inline and inline.get('data'):
                return base64.b64decode(inline['data'])

    raise RuntimeError(
        'Aucune image dans la reponse : ' + json.dumps(donnees)[:500]
    )


def en_webp(octets, slug, apercu):
    """Carre l'image, puis ecrit le 1000 et le 500, comme le catalogue."""
    im = Image.open(io.BytesIO(octets)).convert('RGB')

    # Un modele peut rendre un format legerement different du carre demande :
    # on recadre au centre plutot que de deformer le produit.
    cote = min(im.size)
    gauche = (im.width - cote) // 2
    haut = (im.height - cote) // 2
    im = im.crop((gauche, haut, gauche + cote, haut + cote))

    os.makedirs(OUT_DIR, exist_ok=True)
    if apercu:
        chemin = os.path.join(OUT_DIR, slug + '.png')
        im.save(chemin, 'PNG')
        print('  apercu   ' + chemin)

    ecrits = []
    for taille in (1000, 500):
        nom = slug + '.webp' if taille == 1000 else slug + '-500.webp'
        chemin = os.path.join(OUT_DIR, nom)
        im.resize((taille, taille), Image.LANCZOS).save(
            chemin, 'WEBP', quality=90, method=6
        )
        ecrits.append((chemin, os.path.getsize(chemin)))
    return ecrits


def main():
    parseur = argparse.ArgumentParser(description=__doc__)
    parseur.add_argument('reference', help='identifiant, ex. DRV-049')
    parseur.add_argument('--modele', default='gemini-2.5-flash-image')
    parseur.add_argument('--essais', type=int, default=3)
    parseur.add_argument('--apercu', action='store_true')
    args = parseur.parse_args()

    cle = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not cle:
        raise SystemExit(
            'GEMINI_API_KEY est absente. Une cle se cree sur '
            'https://aistudio.google.com/apikey, puis :\n'
            '    GEMINI_API_KEY=... python scripts/generer-visuel-gemini.py '
            + args.reference
        )

    prompts = charger(PROMPTS)
    if args.reference not in prompts:
        raise SystemExit(
            'Aucun prompt pour %s dans %s' % (args.reference, PROMPTS)
        )

    slug = None
    for produit in charger(EXTRAS):
        if produit['id'] == args.reference:
            slug = produit['slug']
            break
    if not slug:
        raise SystemExit(
            'Aucune reference %s dans %s' % (args.reference, EXTRAS)
        )

    print('%s -> %s  (modele %s)' % (args.reference, slug, args.modele))

    derniere = None
    for essai in range(1, args.essais + 1):
        try:
            octets = appeler_gemini(prompts[args.reference], args.modele, cle)
            break
        except RuntimeError as err:
            derniere = err
            print('  essai %d/%d : %s' % (essai, args.essais, err))
    else:
        raise SystemExit('Echec apres %d essais : %s' % (args.essais, derniere))

    for chemin, taille in en_webp(octets, slug, args.apercu):
        print('  ecrit    %s  (%d ko)' % (chemin, taille // 1024))

    print(
        "\nRegardez le visuel avant de publier : un rendu qui ne correspond pas\n"
        "au produit est pire que pas de visuel du tout. Puis :\n"
        '    node scripts/build-dravik-catalogue.mjs'
    )


if __name__ == '__main__':
    sys.exit(main())
