// =============================================
//  Récupération des données sur TheSportsDB
// =============================================
// "123" est la clé gratuite de l'API.
// Elle limite le nombre de demandes par minute, donc on garde
// les réponses en mémoire (localStorage) pendant 30 minutes.

const ADRESSE_API = "https://www.thesportsdb.com/api/v1/json/123/";
const DUREE_CACHE = 30 * 60 * 1000; // 30 minutes en millisecondes

// Télécharge une adresse de l'API et renvoie le résultat (objet JSON)
async function chargerDonnees(chemin: string): Promise<any> {
  const cle = "cache-" + chemin;

  // 1. Si on a déjà la réponse récente en mémoire, on la réutilise
  const enMemoire = lireMemoire(cle);
  if (enMemoire && Date.now() - enMemoire.date < DUREE_CACHE) {
    return enMemoire.donnees;
  }

  // 2. Sinon on demande à l'API
  try {
    const reponse = await fetch(ADRESSE_API + chemin);
    const donnees = await reponse.json();
    ecrireMemoire(cle, { date: Date.now(), donnees: donnees });
    return donnees;
  } catch (erreur) {
    // 3. Si l'API ne répond pas, on prend l'ancienne réponse si on en a une
    if (enMemoire) {
      return enMemoire.donnees;
    }
    throw erreur;
  }
}

// Petites fonctions pour le localStorage (il peut être bloqué, d'où le try)
function lireMemoire(cle: string): any {
  try {
    const texte = localStorage.getItem(cle);
    return texte ? JSON.parse(texte) : null;
  } catch (e) {
    return null;
  }
}

function ecrireMemoire(cle: string, valeur: any): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch (e) {
    // pas grave si ça ne marche pas
  }
}

// ---------- Les 4 demandes utilisées par le site ----------

// Cherche des joueurs par leur nom
async function chercherJoueurs(nom: string): Promise<any[]> {
  const donnees = await chargerDonnees("searchplayers.php?p=" + encodeURIComponent(nom));
  const liste = donnees.player || [];
  // On garde seulement les footballeurs (l'API contient aussi d'autres sports)
  return liste.filter((joueur: any) => joueur.strSport === "Soccer");
}

// Toutes les infos d'un joueur
async function infosJoueur(id: string): Promise<any> {
  const donnees = await chargerDonnees("lookupplayer.php?id=" + id);
  const liste = donnees.players || [];
  return liste[0] || null;
}

// Derniers matchs d'une équipe
async function derniersMatchs(idEquipe: string): Promise<any[]> {
  const donnees = await chargerDonnees("eventslast.php?id=" + idEquipe);
  return donnees.results || [];
}

// Prochains matchs d'une équipe
async function prochainsMatchs(idEquipe: string): Promise<any[]> {
  const donnees = await chargerDonnees("eventsnext.php?id=" + idEquipe);
  return donnees.events || [];
}

// Vide le cache d'une équipe (pour le bouton "Actualiser")
function oublierMatchs(idEquipe: string): void {
  try {
    localStorage.removeItem("cache-eventslast.php?id=" + idEquipe);
    localStorage.removeItem("cache-eventsnext.php?id=" + idEquipe);
  } catch (e) {
    // rien
  }
}
