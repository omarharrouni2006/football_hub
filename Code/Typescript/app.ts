// =============================================
//  foot.status : fonctionnement du site
// =============================================
// Le site n'a qu'une seule page (index.html).
// On change le contenu de <main> selon l'adresse après le # :
//   #                   -> page d'accueil
//   #recherche-mbappe   -> résultats de recherche
//   #joueur-34162098    -> fiche d'un joueur

// Langue et thème choisis (on les retrouve au prochain passage)
let langue: string = lirePreference("langue", "fr");
let theme: string = lirePreference("theme", "auto");

// Pour arrêter l'horloge quand on quitte l'accueil
let horloge: number = 0;


// ---------- Petites fonctions utiles ----------

// Renvoie le texte dans la bonne langue
function texte(cle: string): string {
  return TEXTES[langue][cle] || TEXTES.fr[cle] || cle;
}

// Empêche un texte venant de l'API d'être lu comme du HTML
function proteger(valeur: any): string {
  if (valeur === null || valeur === undefined) return "";
  return String(valeur)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lirePreference(nom: string, parDefaut: string): string {
  try {
    return localStorage.getItem(nom) || parDefaut;
  } catch (e) {
    return parDefaut;
  }
}

function sauverPreference(nom: string, valeur: string): void {
  try {
    localStorage.setItem(nom, valeur);
  } catch (e) {
    // pas grave
  }
}

function formatLangue(): string {
  return langue === "fr" ? "fr-FR" : "en-GB";
}

// Âge à partir de la date de naissance (et de la date de décès si besoin)
function calculerAge(naissance: string, deces?: string): number | null {
  if (!naissance) return null;
  const debut = new Date(naissance);
  const fin = deces ? new Date(deces) : new Date();
  let age = fin.getFullYear() - debut.getFullYear();
  // Si l'anniversaire n'est pas encore passé cette année, on enlève 1
  const anniversairePasse =
    fin.getMonth() > debut.getMonth() ||
    (fin.getMonth() === debut.getMonth() && fin.getDate() >= debut.getDate());
  if (!anniversairePasse) age = age - 1;
  return age;
}

// "1998-12-20" -> "20 décembre 1998"
function formaterDate(date: string): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(formatLangue(), { day: "numeric", month: "long", year: "numeric" });
}

// Date et heure d'un match (l'API donne l'heure en temps universel)
function dateDuMatch(match: any): string {
  let date: Date;
  if (match.strTimestamp) {
    date = new Date(match.strTimestamp + "Z");
  } else {
    date = new Date(match.dateEvent);
  }
  const jour = date.toLocaleDateString(formatLangue(), { weekday: "short", day: "numeric", month: "short" });
  const heure = date.toLocaleTimeString(formatLangue(), { hour: "2-digit", minute: "2-digit" });
  return jour + " · " + heure;
}

function nomPays(pays: string): string {
  if (!pays) return "—";
  const infos = PAYS[pays];
  if (!infos) return pays;
  const nom = langue === "fr" ? infos[0] : pays.replace("The ", "");
  return infos[1] + " " + nom;
}

function nomPoste(poste: string): string {
  if (!poste) return "—";
  if (langue === "fr" && POSTES[poste]) return POSTES[poste];
  return poste;
}

// Statut du joueur : en activité, retraité, décédé...
function statutJoueur(joueur: any): string {
  const statut = joueur.strStatus || "";
  if (statut === "Active") return texte("actif");
  if (statut === "Retired") return texte("retraite");
  if (statut === "Deceased") return texte("decede");
  if (statut === "Free Agent") return texte("libre");
  if (statut === "Coaching") return texte("entraineur");
  return statut || "—";
}

// Un joueur a-t-il un vrai club ? (l'API met "_Retired Soccer" pour les retraités)
function aUnClub(joueur: any): boolean {
  return Boolean(joueur.strTeam && joueur.strTeam.charAt(0) !== "_" && joueur.idTeam);
}

function nomEquipe(joueur: any): string {
  return aUnClub(joueur) ? joueur.strTeam : statutJoueur(joueur);
}

function piedFort(cote: string): string {
  if (cote === "Right") return texte("droit");
  if (cote === "Left") return texte("gauche");
  if (cote === "Both") return texte("lesDeux");
  return cote || "—";
}

// "163 lb (74 kg)" -> "74 kg"   et   "148 lbs" -> "67 kg"
function poidsEnKg(poids: string): string {
  if (!poids) return "—";
  const kg = poids.match(/(\d+)\s*kg/);
  if (kg) return kg[1] + " kg";
  const livres = poids.match(/(\d+)\s*lb/);
  if (livres) return Math.round(Number(livres[1]) * 0.4536) + " kg";
  return poids;
}

// "1.78 m (5 ft 10 in)" -> "1.78 m"
function tailleEnMetres(taille: string): string {
  if (!taille) return "—";
  return taille.split("(")[0].trim();
}

function chargement(): string {
  return '<p class="chargement"><span class="rond"></span>' + texte("chargement") + "</p>";
}


// ---------- Carte d'un joueur (accueil et recherche) ----------

function carteJoueur(joueur: JoueurCarte, estLegende: boolean): string {
  let detail = nomPoste(joueur.poste);
  if (estLegende) {
    detail += " · " + joueur.naissance.substring(0, 4);
  } else {
    const age = calculerAge(joueur.naissance);
    if (age !== null) detail += " · " + age + " " + texte("ans");
  }

  let equipe = joueur.equipe;
  if (estLegende && equipe === "") equipe = "⭐ " + texte("legende");

  return `
    <li>
      <a class="carte" href="#joueur-${proteger(joueur.id)}">
        <img src="${proteger(joueur.photo || "Images/joueur.svg")}" alt="${proteger(joueur.nom)}"
             loading="lazy" onerror="this.src='Images/joueur.svg'">
        <span class="carte-texte">
          <strong>${proteger(joueur.nom)}</strong>
          <span class="carte-equipe">${proteger(equipe)}</span>
          <span class="carte-detail">${proteger(nomPays(joueur.pays))}</span>
          <span class="carte-detail">${proteger(detail)}</span>
        </span>
      </a>
    </li>`;
}


// ---------- Page d'accueil ----------

function afficherAccueil(): void {
  document.body.classList.add("accueil");
  document.title = texte("marque");

  let cartesUne = "";
  for (const joueur of JOUEURS_A_LA_UNE) {
    cartesUne += carteJoueur(joueur, false);
  }

  let cartesLegendes = "";
  for (const joueur of LEGENDES) {
    cartesLegendes += carteJoueur(joueur, true);
  }

  contenu().innerHTML = `
    <section class="bandeau">
      <div class="bandeau-haut">
        <span class="surtitre">${texte("surtitre")}</span>
        <span id="horloge" class="horloge"></span>
      </div>
      <h1>${texte("titre")}</h1>
      <p>${texte("soustitre")}</p>
      <form class="grande-recherche" id="rechercheAccueil">
        <input type="search" name="nom" placeholder="${texte("placeholder")}" aria-label="${texte("rechercher")}">
        <button type="submit">${texte("rechercher")}</button>
      </form>
      <a href="#" class="lien-hasard" id="lienHasard">${texte("hasard")} ↗</a>
    </section>

    <section class="section">
      <h2>${texte("aLaUne")}</h2>
      <p class="sous-titre">${texte("aLaUneTexte")}</p>
      <ul class="grille">${cartesUne}</ul>
    </section>

    <section class="section">
      <h2>${texte("legendes")}</h2>
      <p class="sous-titre">${texte("legendesTexte")}</p>
      <ul class="grille">${cartesLegendes}</ul>
    </section>`;

  activerRecherche("rechercheAccueil");

  // Joueur au hasard parmi tous ceux de l'accueil
  document.getElementById("lienHasard")!.addEventListener("click", function (e) {
    e.preventDefault();
    const tous = JOUEURS_A_LA_UNE.concat(LEGENDES);
    const auHasard = tous[Math.floor(Math.random() * tous.length)];
    location.hash = "joueur-" + auHasard.id;
  });

  // Horloge mise à jour toutes les secondes
  mettreAJourHorloge();
  horloge = setInterval(mettreAJourHorloge, 1000);
}

function mettreAJourHorloge(): void {
  const zone = document.getElementById("horloge");
  if (!zone) return;
  const maintenant = new Date();
  const date = maintenant.toLocaleDateString(formatLangue(), { weekday: "long", day: "numeric", month: "long" });
  const heure = maintenant.toLocaleTimeString(formatLangue(), { hour: "2-digit", minute: "2-digit" });
  zone.textContent = date.charAt(0).toUpperCase() + date.slice(1) + " · " + heure;
}


// ---------- Recherche ----------

// Branche un formulaire de recherche (celui de l'accueil ou celui du haut)
function activerRecherche(idFormulaire: string): void {
  const formulaire = document.getElementById(idFormulaire) as HTMLFormElement;
  formulaire.addEventListener("submit", function (e) {
    e.preventDefault();
    const champ = formulaire.querySelector("input") as HTMLInputElement;
    const nom = champ.value.trim();
    if (nom.length >= 2) {
      location.hash = "recherche-" + encodeURIComponent(nom);
      champ.blur();
    }
  });
}

async function afficherRecherche(nom: string): Promise<void> {
  document.title = nom + " · " + texte("marque");
  (document.querySelector("#rechercheHaut input") as HTMLInputElement).value = nom;

  contenu().innerHTML = `
    <div class="page">
      <a class="retour" href="#">← ${texte("retour")}</a>
      <h1 class="titre-page">${texte("resultatsPour")} « ${proteger(nom)} »</h1>
      <div id="resultats">${chargement()}</div>
    </div>`;

  try {
    // L'API préfère les espaces remplacés par des "_"
    const joueurs = await chercherJoueurs(nom.split(" ").join("_"));
    const zone = document.getElementById("resultats");
    if (!zone) return; // on a changé de page entre-temps

    if (joueurs.length === 0) {
      zone.innerHTML = '<p class="discret">' + texte("aucunResultat") + "</p>";
      return;
    }

    let cartes = "";
    for (const j of joueurs) {
      const estAncien = j.strStatus === "Retired" || j.strStatus === "Deceased";
      cartes += carteJoueur({
        id: j.idPlayer,
        nom: j.strPlayer,
        equipe: nomEquipe(j),
        pays: j.strNationality,
        poste: j.strPosition,
        naissance: j.dateBorn || "",
        photo: j.strThumb
      }, estAncien);
    }
    zone.innerHTML = '<ul class="grille">' + cartes + "</ul>";
  } catch (erreur) {
    afficherErreur(function () { afficherRecherche(nom); });
  }
}


// ---------- Fiche d'un joueur ----------

async function afficherJoueur(id: string): Promise<void> {
  contenu().innerHTML = '<div class="page">' + chargement() + "</div>";

  let joueur: any;
  try {
    joueur = await infosJoueur(id);
  } catch (erreur) {
    afficherErreur(function () { afficherJoueur(id); });
    return;
  }

  if (!joueur) {
    contenu().innerHTML = '<div class="page vide"><h1>' + texte("introuvable") + '</h1><a class="bouton" href="#">' + texte("accueil") + "</a></div>";
    return;
  }

  document.title = joueur.strPlayer + " · " + texte("marque");

  const age = calculerAge(joueur.dateBorn, joueur.dateDied);
  const photo = joueur.strCutout || joueur.strRender || joueur.strThumb || "Images/joueur.svg";

  // Tableau des informations : [titre, valeur]
  const infos: string[][] = [
    [texte("club"), nomEquipe(joueur)],
    [texte("nationalite"), nomPays(joueur.strNationality)],
    [texte("poste"), nomPoste(joueur.strPosition)],
    [texte("age"), age !== null ? age + " " + texte("ans") : "—"],
    [texte("naissance"), formaterDate(joueur.dateBorn)],
    [texte("lieuNaissance"), joueur.strBirthLocation || "—"],
    [texte("taille"), tailleEnMetres(joueur.strHeight)],
    [texte("poids"), poidsEnKg(joueur.strWeight)],
    [texte("pied"), piedFort(joueur.strSide)],
    [texte("statut"), statutJoueur(joueur)]
  ];
  if (joueur.dateDied) {
    infos.splice(5, 0, [texte("deces"), formaterDate(joueur.dateDied)]);
  }
  if (joueur.strTeam2 && joueur.strTeam2 !== joueur.strTeam && joueur.strTeam2.charAt(0) !== "_") {
    infos.splice(1, 0, [texte("selection"), joueur.strTeam2]);
  }

  let lignesInfos = "";
  for (const info of infos) {
    lignesInfos += "<div><dt>" + info[0] + "</dt><dd>" + proteger(info[1]) + "</dd></div>";
  }

  // Biographie en français si elle existe, sinon en anglais
  let bio = joueur.strDescriptionEN || "";
  let noteBio = "";
  if (langue === "fr") {
    if (joueur.strDescriptionFR) {
      bio = joueur.strDescriptionFR;
    } else if (bio) {
      noteBio = '<p class="note">' + texte("bioEnAnglais") + "</p>";
    }
  }
  let paragraphes = "";
  for (const morceau of bio.split("\n")) {
    if (morceau.trim() !== "") paragraphes += "<p>" + proteger(morceau) + "</p>";
  }

  contenu().innerHTML = `
    <div class="page">
      <a class="retour" href="#">← ${texte("retour")}</a>

      <section class="profil">
        <img class="profil-photo" src="${proteger(photo)}" alt="${proteger(joueur.strPlayer)}" onerror="this.src='Images/joueur.svg'">
        <div>
          <p class="surtitre">${proteger(nomEquipe(joueur))}${joueur.strNumber ? " · #" + proteger(joueur.strNumber) : ""}</p>
          <h1>${proteger(joueur.strPlayer)}</h1>
          <div class="etiquettes">
            <span>${proteger(nomPoste(joueur.strPosition))}</span>
            <span>${proteger(nomPays(joueur.strNationality))}</span>
            ${age !== null ? "<span>" + age + " " + texte("ans") + "</span>" : ""}
          </div>
        </div>
      </section>

      <section class="bloc">
        <h2>${texte("actualite")}</h2>
        <div id="actualite">${chargement()}</div>
      </section>

      <section class="bloc">
        <dl class="infos">${lignesInfos}</dl>
      </section>

      ${bio ? `
      <section class="bloc">
        <h2>${texte("biographie")}</h2>
        ${noteBio}
        <div class="bio" id="bio">${paragraphes}</div>
        <button class="bouton petit" type="button" id="boutonBio">${texte("lireSuite")}</button>
      </section>` : ""}
    </div>`;

  // Bouton "Lire la suite" / "Réduire"
  const boutonBio = document.getElementById("boutonBio");
  if (boutonBio) {
    boutonBio.addEventListener("click", function () {
      const zoneBio = document.getElementById("bio")!;
      zoneBio.classList.toggle("ouverte");
      boutonBio.textContent = zoneBio.classList.contains("ouverte") ? texte("reduire") : texte("lireSuite");
    });
  }

  afficherActualite(joueur);
}

// Prochain match et derniers résultats du club du joueur
async function afficherActualite(joueur: any): Promise<void> {
  const zone = document.getElementById("actualite");
  if (!zone) return;

  // Un joueur retraité n'a pas de club, donc pas de matchs
  if (!aUnClub(joueur)) {
    zone.innerHTML = '<p class="discret">' + texte("pasDActualite") + "</p>";
    return;
  }

  try {
    const passes = await derniersMatchs(joueur.idTeam);
    const aVenir = await prochainsMatchs(joueur.idTeam);

    // Prochain match
    let htmlProchain = '<p class="discret">' + texte("aucunMatch") + "</p>";
    if (aVenir.length > 0) {
      const m = aVenir[0];
      htmlProchain = `
        <div class="prochain">
          <p><strong>${proteger(m.strHomeTeam)}</strong> ${texte("contre")} <strong>${proteger(m.strAwayTeam)}</strong></p>
          <p class="prochain-date">${dateDuMatch(m)}</p>
          <p class="discret">${proteger(m.strLeague)}${m.strVenue ? " · " + proteger(m.strVenue) : ""}</p>
        </div>`;
    }

    // Derniers matchs (5 maximum)
    let htmlPasses = "";
    for (const m of passes.slice(0, 5)) {
      htmlPasses += ligneMatch(m, joueur.idTeam);
    }
    if (htmlPasses === "") {
      htmlPasses = '<p class="discret">' + texte("aucunResultatMatch") + "</p>";
    } else {
      htmlPasses = '<ul class="matchs">' + htmlPasses + "</ul>";
    }

    const heure = new Date().toLocaleTimeString(formatLangue(), { hour: "2-digit", minute: "2-digit" });

    zone.innerHTML = `
      <div class="colonnes">
        <div>
          <h3>${texte("prochainMatch")}</h3>
          ${htmlProchain}
        </div>
        <div>
          <h3>${texte("derniersMatchs")}</h3>
          ${htmlPasses}
        </div>
      </div>
      <div class="pied-actualite">
        <span class="discret">${texte("misAJour")} ${heure}</span>
        <button class="bouton petit" type="button" id="boutonActualiser">↻ ${texte("actualiser")}</button>
      </div>`;

    document.getElementById("boutonActualiser")!.addEventListener("click", function () {
      oublierMatchs(joueur.idTeam);
      zone.innerHTML = chargement();
      afficherActualite(joueur);
    });
  } catch (erreur) {
    zone.innerHTML = '<p class="discret">' + texte("erreurTexte") + "</p>";
  }
}

// Une ligne de résultat : V / N / D + score
function ligneMatch(match: any, idEquipe: string): string {
  const butsDomicile = Number(match.intHomeScore);
  const butsExterieur = Number(match.intAwayScore);
  const aDomicile = match.idHomeTeam === idEquipe;
  const nosButs = aDomicile ? butsDomicile : butsExterieur;
  const leursButs = aDomicile ? butsExterieur : butsDomicile;

  let lettre = texte("nul");
  let classe = "nul";
  if (nosButs > leursButs) { lettre = texte("victoire"); classe = "victoire"; }
  if (nosButs < leursButs) { lettre = texte("defaite"); classe = "defaite"; }

  return `
    <li>
      <span class="resultat ${classe}">${lettre}</span>
      <span>
        <strong>${proteger(match.strHomeTeam)} ${butsDomicile} – ${butsExterieur} ${proteger(match.strAwayTeam)}</strong>
        <small class="discret">${proteger(match.strLeague)} · ${dateDuMatch(match)}</small>
      </span>
    </li>`;
}


// ---------- Message d'erreur ----------

function afficherErreur(reessayer: () => void): void {
  contenu().innerHTML = `
    <div class="page vide">
      <h1>${texte("erreur")}</h1>
      <p class="discret">${texte("erreurTexte")}</p>
      <button class="bouton" type="button" id="boutonReessayer">${texte("reessayer")}</button>
    </div>`;
  document.getElementById("boutonReessayer")!.addEventListener("click", reessayer);
}


// ---------- Paramètres : thème et langue ----------

function appliquerTheme(choix: string): void {
  theme = choix;
  sauverPreference("theme", choix);
  if (choix === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", choix);
  }
}

function appliquerLangue(choix: string): void {
  langue = choix;
  sauverPreference("langue", choix);
  document.documentElement.lang = choix;

  // Tous les éléments fixes qui ont un attribut data-texte="cle"
  const elements = document.querySelectorAll("[data-texte]");
  for (const element of Array.from(elements)) {
    element.textContent = texte(element.getAttribute("data-texte")!);
  }
  const champHaut = document.querySelector("#rechercheHaut input") as HTMLInputElement;
  champHaut.placeholder = texte("placeholder");
}

function ouvrirParametres(): void {
  // On coche les bons boutons avant d'ouvrir
  (document.querySelector('input[name="theme"][value="' + theme + '"]') as HTMLInputElement).checked = true;
  (document.querySelector('input[name="langue"][value="' + langue + '"]') as HTMLInputElement).checked = true;
  document.getElementById("parametres")!.classList.add("ouvert");
  document.getElementById("fond")!.classList.add("ouvert");
}

function fermerParametres(): void {
  document.getElementById("parametres")!.classList.remove("ouvert");
  document.getElementById("fond")!.classList.remove("ouvert");
}

function activerParametres(): void {
  document.getElementById("boutonParametres")!.addEventListener("click", ouvrirParametres);
  document.getElementById("boutonFermer")!.addEventListener("click", fermerParametres);
  document.getElementById("fond")!.addEventListener("click", fermerParametres);

  // Quand on clique sur un choix de thème
  const choixTheme = document.querySelectorAll('input[name="theme"]');
  for (const choix of Array.from(choixTheme)) {
    choix.addEventListener("change", function () {
      appliquerTheme((choix as HTMLInputElement).value);
    });
  }

  // Quand on clique sur un choix de langue
  const choixLangue = document.querySelectorAll('input[name="langue"]');
  for (const choix of Array.from(choixLangue)) {
    choix.addEventListener("change", function () {
      appliquerLangue((choix as HTMLInputElement).value);
      afficherPage(); // on réaffiche la page dans la nouvelle langue
    });
  }
}


// ---------- Choix de la page à afficher ----------

function contenu(): HTMLElement {
  return document.getElementById("contenu")!;
}

function afficherPage(): void {
  clearInterval(horloge);
  document.body.classList.remove("accueil");
  window.scrollTo(0, 0);

  const adresse = decodeURIComponent(location.hash);

  if (adresse.startsWith("#joueur-")) {
    afficherJoueur(adresse.replace("#joueur-", ""));
  } else if (adresse.startsWith("#recherche-")) {
    afficherRecherche(adresse.replace("#recherche-", ""));
  } else {
    afficherAccueil();
  }
}


// ---------- Démarrage du site ----------

document.addEventListener("DOMContentLoaded", function () {
  appliquerTheme(theme);
  appliquerLangue(langue);
  activerParametres();
  activerRecherche("rechercheHaut");
  afficherPage();
});

// Quand l'adresse change (clic sur un lien #...), on change de page
window.addEventListener("hashchange", afficherPage);
