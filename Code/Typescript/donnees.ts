// =============================================
//  Joueurs affichés sur la page d'accueil
// =============================================

// Ce qu'on garde pour afficher une carte de joueur
interface JoueurCarte {
  id: string;        // identifiant du joueur dans TheSportsDB
  nom: string;
  equipe: string;
  pays: string;      // en anglais, comme dans l'API
  poste: string;     // en anglais, comme dans l'API
  naissance: string; // format AAAA-MM-JJ
  photo: string;
}

const PHOTOS = "https://r2.thesportsdb.com/images/media/player/thumb/";

// Les joueurs actuels les plus suivis
const JOUEURS_A_LA_UNE: JoueurCarte[] = [
  { id: "34162098", nom: "Kylian Mbappé", equipe: "Real Madrid", pays: "France", poste: "Centre-Forward", naissance: "1998-12-20", photo: PHOTOS + "v08cj31778816426.jpg" },
  { id: "34219490", nom: "Lamine Yamal", equipe: "Barcelona", pays: "Spain", poste: "Right Winger", naissance: "2007-07-13", photo: PHOTOS + "cdjnqt1786385175.jpg" },
  { id: "34146370", nom: "Lionel Messi", equipe: "Inter Miami", pays: "Argentina", poste: "Right Winger", naissance: "1987-06-24", photo: PHOTOS + "kpfsvp1725295651.jpg" },
  { id: "34146304", nom: "Cristiano Ronaldo", equipe: "Al-Nassr", pays: "Portugal", poste: "Centre-Forward", naissance: "1985-02-05", photo: PHOTOS + "bkre241600892282.jpg" },
  { id: "34169116", nom: "Erling Haaland", equipe: "Manchester City", pays: "Norway", poste: "Centre-Forward", naissance: "2000-07-21", photo: PHOTOS + "bb1agj1727415216.jpg" },
  { id: "34161324", nom: "Vinícius Júnior", equipe: "Real Madrid", pays: "Brazil", poste: "Left Wing", naissance: "2000-07-12", photo: PHOTOS + "lxf1he1771264845.jpg" },
  { id: "34146220", nom: "Harry Kane", equipe: "Bayern Munich", pays: "England", poste: "Centre-Forward", naissance: "1993-07-28", photo: PHOTOS + "0w9up71770542636.jpg" },
  { id: "34161947", nom: "Achraf Hakimi", equipe: "Paris SG", pays: "Morocco", poste: "Right-Back", naissance: "1998-11-04", photo: PHOTOS + "lwhwh71770216476.jpg" },
  { id: "34171882", nom: "Jude Bellingham", equipe: "Real Madrid", pays: "England", poste: "Attacking Midfield", naissance: "2003-06-29", photo: PHOTOS + "rfg8xd1771263826.jpg" }
];

// Les anciens joueurs (retraités ou décédés)
const LEGENDES: JoueurCarte[] = [
  { id: "34161049", nom: "Zinedine Zidane", equipe: "", pays: "France", poste: "Attacking Midfield", naissance: "1972-06-23", photo: PHOTOS + "trvvrs1474915622.jpg" },
  { id: "34162040", nom: "Diego Maradona", equipe: "", pays: "Argentina", poste: "Attacking Midfield", naissance: "1960-10-30", photo: PHOTOS + "z4v3ox1515072958.jpg" },
  { id: "34161137", nom: "Thierry Henry", equipe: "", pays: "France", poste: "Forward", naissance: "1977-08-17", photo: PHOTOS + "vflsaf1698248867.jpg" },
  { id: "34159850", nom: "Ronaldinho", equipe: "", pays: "Brazil", poste: "Attacking Midfield", naissance: "1980-03-21", photo: PHOTOS + "2dyq4u1533490608.jpg" },
  { id: "34163559", nom: "Johan Cruyff", equipe: "", pays: "The Netherlands", poste: "Forward", naissance: "1947-04-25", photo: PHOTOS + "3ur2pq1546353399.jpg" },
  { id: "34163558", nom: "Franz Beckenbauer", equipe: "", pays: "Germany", poste: "Defender", naissance: "1945-09-11", photo: PHOTOS + "9icj4c1704740643.jpg" }
];
