# ⚽ Planète Foot

**Planète Foot** regroupe les infos et l'actualité des footballeurs du monde entier, de façon simple et tranquille.
Il marche sur ordinateur **et** sur téléphone.

---

## ✨ Fonctionnalités

| | |
|---|---|
| 🔎 **Recherche** | Trouve n'importe quel joueur, de n'importe quel championnat |
| 🧾 **Fiche joueur** | Club, sélection, nationalité, poste, âge, taille, poids, pied fort, biographie |
| 📰 **Actualité** | Prochain match et derniers résultats de son club, mis à jour automatiquement |
| ⭐ **À la une** | Les joueurs les plus suivis du moment, sur la page d'accueil |
| 🎲 **Au hasard** | Un bouton pour découvrir un joueur au hasard |
| 🌗 **Thème** | Clair, Sombre ou Auto (suit le réglage du téléphone ou de l'ordinateur) |
| 🌍 **Langue** | Français ou English |
| 📱 **Mobile** | Mise en page adaptée au téléphone, installable sur l'écran d'accueil |
| ✉️ **Contact** | Les deux adresses mail en bas de chaque page |

Le site retient le thème et la langue choisis.

---

## 🚀 Ouvrir le site

### Sur l'ordinateur
Double-clique sur **`index.html`**. Le site s'ouvre dans le navigateur.

### Depuis VS Code
1. Ouvre le dossier `Planete_Foot` dans VS Code.
2. Installe l'extension **Live Server** (VS Code la propose automatiquement).
3. Clic droit sur `index.html` → **Open with Live Server**.

### Sur le téléphone
1. L'ordinateur et le téléphone doivent être sur le **même Wi-Fi**.
2. Dans le terminal, lance :
   ```bash
   cd ~/Desktop/Planete_Foot
   python3 -m http.server 5500
   ```
3. Sur le téléphone, ouvre `http://<adresse-IP-de-l-ordinateur>:5500`
   (sur Mac, l'adresse IP se trouve avec `ipconfig getifaddr en0`).
4. Sur iPhone : **Partager → Sur l'écran d'accueil**.
   Sur Android : **⋮ → Ajouter à l'écran d'accueil**.
5. Pour arrêter le serveur : `Ctrl + C` dans le terminal.

---

## ⚙️ Paramètres

Clique sur la roue ⚙️ en haut à droite :

- **Thème** : ☀️ Clair · 🌙 Sombre · ⚙️ Auto
- **Langue** : 🇫🇷 Français · 🇬🇧 English

Sur téléphone, le panneau monte depuis le bas de l'écran.

---

## 🗂️ Organisation du projet

```
Planete_Foot/
├── index.html               page unique du site
├── manifest.webmanifest     installation sur téléphone
├── Styles/
│   └── main_style.css       thème clair / sombre, adapté au mobile
├── Code/
│   ├── Typescript/          ✏️ code source (à modifier ici)
│   │   ├── i18n.ts          textes FR / EN, postes, pays
│   │   ├── api.ts           accès aux données (cache + file d'attente)
│   │   └── app.ts           pages, recherche, paramètres
│   └── Javascript/          ⚙️ généré automatiquement (ne pas modifier)
├── Images/
│   └── icon.svg             icône du site
├── package.json             scripts npm
├── tsconfig.json            configuration TypeScript
└── .vscode/                 réglages VS Code (compilation, extensions)
```

---

## 🛠️ Modifier le code (TypeScript)

Le code est écrit en **TypeScript** dans `Code/Typescript/`, puis compilé en JavaScript dans `Code/Javascript/`.

```bash
npm install        # une seule fois, installe TypeScript
npm run build      # compile une fois
npm run watch      # recompile à chaque sauvegarde
```

Dans VS Code : **`Cmd + Shift + B`** (Mac) ou **`Ctrl + Shift + B`** (Windows) lance la compilation.

> ⚠️ Ne modifie pas les fichiers de `Code/Javascript/` : ils sont écrasés à chaque compilation.

### Exemples de modifications
- **Changer les joueurs à la une** : liste `FEATURED` dans `Code/Typescript/app.ts`.
- **Changer un texte** : dictionnaires `fr` et `en` dans `Code/Typescript/i18n.ts`.
- **Changer les couleurs** : variables en haut de `Styles/main_style.css`
  (`--accent`, `--paper`…, une fois pour le clair et une fois pour le sombre).

---

## 📡 Données

Les données des joueurs et des matchs viennent de **[TheSportsDB](https://www.thesportsdb.com)** (clé gratuite).

- La clé gratuite limite le nombre de requêtes par minute. Le site garde donc les réponses en mémoire et espace ses appels.
- Si la limite est atteinte, un petit message s'affiche et le site réessaie tout seul.
- La biographie s'affiche en français quand elle existe en français, sinon en anglais.
- Une connexion Internet est nécessaire pour charger les données.

---

## ✉️ Contact

- samar.ochi@epitech.eu
- omar.harrouni2006@gmail.com
