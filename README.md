# ⚽ Planète Foot

**Planète Foot** est un site qui regroupe les infos et l'actualité des footballeurs du monde entier, d'aujourd'hui et d'hier.
Il marche sur ordinateur **et** sur téléphone.

🔗 **Voir le site en ligne : https://omarharrouni2006.github.io/football_hub/**

---

## ✨ Ce que fait le site

- 🔎 **Recherche** : on tape le nom de n'importe quel joueur (actuel ou ancien).
- 🧾 **Fiche joueur** : club, sélection, nationalité, poste, âge, taille, poids, pied fort, biographie.
- 📰 **Actualité** : prochain match et derniers résultats du club du joueur.
- ⭐ **À la une** : les joueurs actuels les plus suivis.
- 🏆 **Légendes** : les anciens joueurs (Zidane, Maradona, Henry, Cruyff…).
- 🎲 **Au hasard** : un bouton pour découvrir un joueur au hasard.
- 🌗 **Thème** : Clair, Sombre ou Auto.
- 🌍 **Langue** : Français ou English.
- 📱 **Téléphone** : la page s'adapte à la taille de l'écran.
- ✉️ **Contact** : les deux adresses mail en bas de page.

---

## 🗂️ Organisation des fichiers

```
Planete_Foot/
├── index.html              la page du site (une seule page)
├── Styles/
│   └── main_style.css      les couleurs et la mise en page
├── Code/
│   ├── Typescript/         le code qu'on écrit
│   │   ├── traductions.ts  les textes en français et en anglais
│   │   ├── donnees.ts      les joueurs de la page d'accueil
│   │   ├── api.ts          la récupération des données sur Internet
│   │   └── app.ts          le fonctionnement des pages
│   └── Javascript/         créé automatiquement à partir du TypeScript
├── Images/                 l'icône du site et l'image par défaut
├── package.json            pour installer TypeScript
└── tsconfig.json           réglages de TypeScript
```

---

## 🎤 Comment ça marche (pour la présentation)

1. **Une seule page HTML.** `index.html` contient la barre du haut, le pied de page et la fenêtre des paramètres.
   Le milieu (`<main id="contenu">`) est rempli par le code TypeScript.

2. **Le `#` dans l'adresse décide de la page affichée** (fonction `afficherPage()` dans `app.ts`) :
   - `index.html` → page d'accueil
   - `index.html#recherche-messi` → résultats de recherche
   - `index.html#joueur-34146370` → fiche de Messi

3. **Les données viennent d'Internet** grâce à l'API gratuite **TheSportsDB** (`api.ts`) :
   - on utilise `fetch()` avec `async` / `await` pour attendre la réponse ;
   - les réponses sont gardées 30 minutes dans le `localStorage`, car l'API gratuite limite le nombre de demandes.

4. **Les joueurs de l'accueil sont écrits à la main** dans `donnees.ts`, pour que l'accueil s'affiche tout de suite.

5. **Thème clair / sombre** : les couleurs sont des variables CSS (`--texte`, `--fond-page`…).
   Le thème sombre change seulement la valeur de ces variables (`main_style.css`).

6. **Deux langues** : tous les textes sont dans `traductions.ts`. La fonction `texte("cle")` renvoie le texte dans la langue choisie.

7. **Les choix sont retenus** : le thème et la langue sont enregistrés dans le `localStorage`.

---

## 🚀 Ouvrir le site sur son ordinateur

- Double-cliquer sur **`index.html`**.
- Ou dans VS Code : installer l'extension **Live Server**, puis clic droit sur `index.html` → **Open with Live Server**.

---

## 🛠️ Modifier le code

Le code s'écrit en **TypeScript** dans `Code/Typescript/`, puis il est transformé en JavaScript dans `Code/Javascript/`.

```bash
npm install      # une seule fois : installe TypeScript
npm run build    # transforme le TypeScript en JavaScript
npm run watch    # le refait automatiquement à chaque sauvegarde
```

Dans VS Code : **`Cmd + Shift + B`** (Mac) ou **`Ctrl + Shift + B`** (Windows).

> ⚠️ Ne pas modifier les fichiers de `Code/Javascript/` : ils sont remplacés à chaque compilation.

Exemples :
- **Ajouter un joueur sur l'accueil** : ajouter une ligne dans `JOUEURS_A_LA_UNE` ou `LEGENDES` (`donnees.ts`).
- **Changer un texte** : dans `traductions.ts`.
- **Changer les couleurs** : les variables en haut de `main_style.css`.

---

## 📡 Données

Les données viennent de **[TheSportsDB](https://www.thesportsdb.com)** (clé gratuite `123`).
La clé gratuite limite le nombre de demandes par minute : si un message d'erreur s'affiche, il suffit d'attendre une minute.

---

## ✉️ Contact

- samar.ochi@epitech.eu
- omar.harrouni2006@gmail.com
