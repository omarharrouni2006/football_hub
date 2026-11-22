/* Planète Foot — application principale (TypeScript)
   Routes : #            -> accueil
            #recherche/q -> résultats de recherche
            #joueur/id   -> fiche d'un joueur */

type ThemeChoice = "light" | "dark" | "auto";

interface FeaturedPlayer {
  id: string;
  name: string;
  team: string;
  nat: string;
  pos: string;
  born: string;
  thumb: string;
}

const IMG = "https://r2.thesportsdb.com/images/media/player/thumb/";

/* Instantané local : la page d'accueil s'affiche tout de suite, puis
   chaque carte est mise à jour avec les données en ligne. */
const FEATURED: FeaturedPlayer[] = [
  { id: "34162098", name: "Kylian Mbappé", team: "Real Madrid", nat: "France", pos: "Centre-Forward", born: "1998-12-20", thumb: IMG + "v08cj31778816426.jpg" },
  { id: "34219490", name: "Lamine Yamal", team: "Barcelona", nat: "Spain", pos: "Right Winger", born: "2007-07-13", thumb: IMG + "cdjnqt1786385175.jpg" },
  { id: "34146370", name: "Lionel Messi", team: "Inter Miami", nat: "Argentina", pos: "Right Winger", born: "1987-06-24", thumb: IMG + "kpfsvp1725295651.jpg" },
  { id: "34146304", name: "Cristiano Ronaldo", team: "Al-Nassr", nat: "Portugal", pos: "Centre-Forward", born: "1985-02-05", thumb: IMG + "bkre241600892282.jpg" },
  { id: "34169116", name: "Erling Haaland", team: "Manchester City", nat: "Norway", pos: "Centre-Forward", born: "2000-07-21", thumb: IMG + "bb1agj1727415216.jpg" },
  { id: "34161324", name: "Vinícius Júnior", team: "Real Madrid", nat: "Brazil", pos: "Left Wing", born: "2000-07-12", thumb: IMG + "lxf1he1771264845.jpg" },
  { id: "34146220", name: "Harry Kane", team: "Bayern Munich", nat: "England", pos: "Centre-Forward", born: "1993-07-28", thumb: IMG + "0w9up71770542636.jpg" },
  { id: "34161947", name: "Achraf Hakimi", team: "Paris SG", nat: "Morocco", pos: "Right-Back", born: "1998-11-04", thumb: IMG + "lwhwh71770216476.jpg" }
];

const RANDOM_POOL: string[] = FEATURED.map((p) => p.id).concat([
  "34171882", // Jude Bellingham
  "34161375", // Ousmane Dembélé
  "34178205"  // Khvicha Kvaratskhelia
]);

/* ---------- État et préférences ---------- */

const store = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }
};

let lang: Lang = store.get("pf-lang") === "en" ? "en" : "fr";
let theme: ThemeChoice = (store.get("pf-theme") as ThemeChoice) || "auto";
let clockTimer: number | undefined;

/* ---------- Outils ---------- */

function t(key: string, vars?: Record<string, string | number>): string {
  let s = I18N[lang][key] ?? I18N.fr[key] ?? key;
  if (vars) Object.keys(vars).forEach((k) => { s = s.replace("{" + k + "}", String(vars[k])); });
  return s;
}

function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);
}

function $(sel: string, root: ParentNode = document): HTMLElement | null {
  return root.querySelector(sel) as HTMLElement | null;
}

function locale(): string { return lang === "fr" ? "fr-FR" : "en-GB"; }

function weightLabel(w?: string | null): string {
  if (!w) return "—";
  const kg = w.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
  if (kg) return kg[1] + " kg";
  const lb = w.match(/(\d+(?:[.,]\d+)?)\s*lb/i);
  if (lb) return Math.round(parseFloat(lb[1].replace(",", ".")) * 0.4536) + " kg";
  return w;
}

function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function ageFrom(date?: string | null): number | null {
  if (!date) return null;
  const b = new Date(date + "T00:00:00");
  if (isNaN(b.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

function formatDate(date?: string | null): string {
  if (!date) return "—";
  const d = new Date(date + "T00:00:00");
  return isNaN(d.getTime()) ? date : new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function eventDate(e: MatchEvent): Date | null {
  const raw = e.strTimestamp
    ? e.strTimestamp.replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(e.strTimestamp) ? "" : "Z")
    : e.dateEvent ? e.dateEvent + "T" + (e.strTime || "00:00:00") + "Z" : "";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function formatEventDate(e: MatchEvent, withTime: boolean): string {
  const d = eventDate(e);
  if (!d) return e.dateEvent || "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  const time = new Intl.DateTimeFormat(locale(), { hour: "2-digit", minute: "2-digit" }).format(d);
  let label: string;
  if (diff === 0) label = t("today");
  else if (diff === 1) label = t("tomorrow");
  else label = new Intl.DateTimeFormat(locale(), { weekday: "short", day: "numeric", month: "short" }).format(d);
  label = capitalize(label);
  return withTime ? label + " · " + time : label;
}

function relativeTime(ts: number): string {
  const sec = Math.round((Date.now() - ts) / 1000);
  if (sec < 45) return t("justNow");
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: "auto" });
  if (sec < 3600) return rtf.format(-Math.round(sec / 60), "minute");
  if (sec < 86400) return rtf.format(-Math.round(sec / 3600), "hour");
  return rtf.format(-Math.round(sec / 86400), "day");
}

function positionLabel(pos?: string | null): string {
  if (!pos) return "—";
  return lang === "fr" ? (POSITIONS_FR[pos] || pos) : pos;
}

function flag(country?: string | null): string {
  if (!country) return "";
  if (COUNTRY_FLAG_EXTRA[country]) return COUNTRY_FLAG_EXTRA[country];
  const code = COUNTRY_CODES[country];
  if (!code) return "";
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function countryLabel(country?: string | null): string {
  if (!country) return "—";
  if (lang === "fr" && COUNTRY_FR_EXTRA[country]) return COUNTRY_FR_EXTRA[country];
  const code = COUNTRY_CODES[country];
  if (code && typeof Intl !== "undefined" && "DisplayNames" in Intl) {
    try {
      const dn = new Intl.DisplayNames([locale()], { type: "region" });
      return dn.of(code) || country;
    } catch (e) { /* ignore */ }
  }
  return country;
}

function footLabel(side?: string | null): string {
  if (!side) return "—";
  const s = side.toLowerCase();
  if (s.indexOf("right") === 0) return t("right");
  if (s.indexOf("left") === 0) return t("left");
  if (s.indexOf("both") === 0) return t("both");
  return side;
}

function statusLabel(st?: string | null): string {
  if (!st) return "—";
  const s = st.toLowerCase();
  if (s === "active") return t("active");
  if (s === "retired") return t("retired");
  if (s.indexOf("free") === 0) return t("freeAgent");
  return st;
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w.charAt(0)).slice(0, 2).join("").toUpperCase();
}

function small(url?: string | null): string {
  return url ? url + "/small" : "";
}

function photoHTML(url: string | null | undefined, name: string, cls: string): string {
  if (!url) return `<span class="${cls} avatar-fallback" aria-hidden="true">${esc(initials(name))}</span>`;
  return `<img class="${cls}" src="${esc(small(url))}" data-full="${esc(url)}" alt="${esc(name)}" loading="lazy" width="250" height="250">`;
}

/* Si la miniature "/small" n'existe pas, on charge l'image complète, sinon les initiales. */
document.addEventListener("error", (ev) => {
  const img = ev.target as HTMLImageElement;
  if (!(img instanceof HTMLImageElement)) return;
  const full = img.getAttribute("data-full");
  if (full && img.src !== full) { img.src = full; img.removeAttribute("data-full"); return; }
  if (img.classList.contains("badge")) { img.remove(); return; }
  const span = document.createElement("span");
  span.className = img.className + " avatar-fallback";
  span.textContent = initials(img.alt || "?");
  img.replaceWith(span);
}, true);

/* ---------- Thème et langue ---------- */

function applyTheme(choice: ThemeChoice): void {
  theme = choice;
  store.set("pf-theme", choice);
  const root = document.documentElement;
  if (choice === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  const dark = choice === "dark" || (choice === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0b0f16" : "#101827");
}

function applyLang(l: Lang): void {
  lang = l;
  store.set("pf-lang", l);
  document.documentElement.lang = l;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n") as string);
  });
  document.querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder") as string);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria") as string));
  });
}

/* ---------- Panneau des paramètres ---------- */

function setupSettings(): void {
  const sheet = $("#settings") as HTMLElement;
  const backdrop = $("#settingsBackdrop") as HTMLElement;
  const openBtn = $("#openSettings") as HTMLButtonElement;

  const open = (): void => {
    (sheet.querySelector(`input[name="theme"][value="${theme}"]`) as HTMLInputElement).checked = true;
    (sheet.querySelector(`input[name="lang"][value="${lang}"]`) as HTMLInputElement).checked = true;
    sheet.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => { sheet.classList.add("open"); backdrop.classList.add("open"); });
    ($("#closeSettings") as HTMLButtonElement).focus();
  };
  const close = (): void => {
    sheet.classList.remove("open");
    backdrop.classList.remove("open");
    setTimeout(() => { sheet.hidden = true; backdrop.hidden = true; }, 250);
    openBtn.focus();
  };

  openBtn.addEventListener("click", open);
  ($("#closeSettings") as HTMLButtonElement).addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) close(); });

  sheet.addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === "theme") applyTheme(input.value as ThemeChoice);
    if (input.name === "lang") { applyLang(input.value as Lang); route(); }
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (theme === "auto") applyTheme("auto");
  });
}

/* ---------- Notification discrète (limite de requêtes) ---------- */

function setupStatus(): void {
  const toast = $("#statusToast") as HTMLElement;
  let hideTimer: number | undefined;
  API.onStatus((s) => {
    if (s === "rate") {
      toast.textContent = t("rateLimited");
      toast.hidden = false;
      window.clearTimeout(hideTimer);
    } else if (!toast.hidden) {
      hideTimer = window.setTimeout(() => { toast.hidden = true; }, 600);
    }
  });
}

/* ---------- Recherche ---------- */

function goSearch(q: string): void {
  q = q.trim();
  if (q.length < 2) return;
  location.hash = "recherche/" + encodeURIComponent(q);
}

function bindSearchForm(form: HTMLFormElement): void {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input") as HTMLInputElement;
    goSearch(input.value);
    input.blur();
  });
}

/* ---------- Vues ---------- */

const main = (): HTMLElement => $("#main") as HTMLElement;

function playerCard(p: { id: string; name: string; team?: string | null; nat?: string | null; pos?: string | null; thumb?: string | null; born?: string | null }): string {
  const age = ageFrom(p.born);
  return `
    <li>
      <a class="player-card" href="#joueur/${esc(p.id)}" data-card="${esc(p.id)}">
        ${photoHTML(p.thumb, p.name, "card-photo")}
        <span class="card-body">
          <span class="card-name">${esc(p.name)}</span>
          <span class="card-team">${esc(p.team || "—")}</span>
          <span class="card-meta">
            <span>${flag(p.nat)} ${esc(countryLabel(p.nat))}</span>
            <span>${esc(positionLabel(p.pos))}${age !== null ? " · " + esc(t("years", { n: age })) : ""}</span>
          </span>
        </span>
      </a>
    </li>`;
}

function renderHome(): void {
  document.body.classList.add("is-home");
  document.title = t("brand");
  main().innerHTML = `
    <section class="hero">
      <div class="hero-top">
        <span class="kicker">${esc(t("heroKicker"))}</span>
        <time id="clock" class="clock"></time>
      </div>
      <h1>${esc(t("heroTitle"))}</h1>
      <p>${esc(t("heroText"))}</p>
      <form class="hero-search" id="heroSearch" role="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="search" name="q" autocomplete="off" placeholder="${esc(t("searchPlaceholder"))}" aria-label="${esc(t("searchBtn"))}">
        <button type="submit">${esc(t("searchBtn"))}</button>
      </form>
      <a href="#" class="random-link" id="randomPlayer">${esc(t("random"))}</a>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>${esc(t("featured"))}</h2>
        <p>${esc(t("featuredSub"))}</p>
      </div>
      <ul class="player-grid">${FEATURED.map((p) => playerCard(p)).join("")}</ul>
    </section>

    <section class="section">
      <div class="section-head"><h2>${esc(t("howTitle"))}</h2></div>
      <ol class="steps">
        <li><span class="step-num">1</span><h3>${esc(t("how1t"))}</h3><p>${esc(t("how1"))}</p></li>
        <li><span class="step-num">2</span><h3>${esc(t("how2t"))}</h3><p>${esc(t("how2"))}</p></li>
        <li><span class="step-num">3</span><h3>${esc(t("how3t"))}</h3><p>${esc(t("how3"))}</p></li>
      </ol>
    </section>`;

  bindSearchForm($("#heroSearch") as HTMLFormElement);

  ($("#randomPlayer") as HTMLElement).addEventListener("click", (e) => {
    e.preventDefault();
    location.hash = "joueur/" + RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
  });

  // Date et heure en direct
  const clock = $("#clock") as HTMLElement;
  const tick = (): void => {
    clock.textContent = capitalize(new Intl.DateTimeFormat(locale(), {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
    }).format(new Date()));
  };
  tick();
  clockTimer = window.setInterval(tick, 15000);

  // Mise à jour discrète des cartes avec les données en ligne
  FEATURED.forEach((f) => {
    API.player(f.id, false, true).then(({ p }) => {
      const card = document.querySelector(`[data-card="${f.id}"]`);
      if (!p || !card || !card.parentElement) return;
      card.parentElement.outerHTML = playerCard({
        id: f.id, name: p.strPlayer || f.name, team: p.strTeam || f.team,
        nat: p.strNationality || f.nat, pos: p.strPosition || f.pos,
        thumb: p.strThumb || f.thumb, born: p.dateBorn || f.born
      });
    }).catch(() => { /* on garde l'instantané local */ });
  });
}

function renderLoading(): void {
  main().innerHTML = `<div class="page"><div class="loader" role="status"><span></span>${esc(t("loading"))}</div></div>`;
}

function renderError(retry: () => void, msg?: string): void {
  main().innerHTML = `
    <div class="page">
      <div class="empty">
        <h1>${esc(msg || t("errorTitle"))}</h1>
        ${msg ? "" : `<p>${esc(t("errorText"))}</p>`}
        <button class="btn" type="button" id="retryBtn">${esc(t("retry"))}</button>
        <a class="btn ghost" href="#">${esc(t("navHome"))}</a>
      </div>
    </div>`;
  ($("#retryBtn") as HTMLButtonElement).addEventListener("click", retry);
}

function renderSearch(q: string): void {
  document.title = q + " · " + t("brand");
  const topInput = $("#topSearch input") as HTMLInputElement;
  topInput.value = q;
  main().innerHTML = `
    <div class="page">
      <a class="back" href="#">← ${esc(t("back"))}</a>
      <h1 class="page-title">${esc(t("results", { q }))}</h1>
      <div id="results"><div class="loader" role="status"><span></span>${esc(t("searching"))}</div></div>
    </div>`;

  API.searchPlayers(q).then((list) => {
    const box = $("#results");
    if (!box) return;
    if (!list.length) { box.innerHTML = `<p class="muted">${esc(t("noResults"))}</p>`; return; }
    box.innerHTML = `<ul class="player-grid">${list.map((p) => playerCard({
      id: p.idPlayer, name: p.strPlayer, team: p.strTeam, nat: p.strNationality,
      pos: p.strPosition, thumb: p.strThumb, born: p.dateBorn
    })).join("")}</ul>`;
  }).catch(() => renderError(() => renderSearch(q)));
}

function resultLetter(e: MatchEvent, teamId: string): { cls: string; txt: string } | null {
  if (e.intHomeScore == null || e.intAwayScore == null || e.intHomeScore === "" || e.intAwayScore === "") return null;
  const h = parseInt(e.intHomeScore, 10), a = parseInt(e.intAwayScore, 10);
  const mine = e.idHomeTeam === teamId ? h : a;
  const other = e.idHomeTeam === teamId ? a : h;
  if (mine > other) return { cls: "win", txt: t("win") };
  if (mine < other) return { cls: "loss", txt: t("loss") };
  return { cls: "draw", txt: t("draw") };
}

function badge(url?: string | null): string {
  return url ? `<img class="badge" src="${esc(url)}/tiny" data-full="${esc(url)}" alt="" width="28" height="28" loading="lazy">` : "";
}

function matchRow(e: MatchEvent, teamId: string): string {
  const r = resultLetter(e, teamId);
  return `
    <li class="match">
      <span class="pill ${r ? r.cls : ""}">${r ? esc(r.txt) : "–"}</span>
      <span class="match-teams">
        <span class="team">${badge(e.strHomeTeamBadge)}${esc(e.strHomeTeam)}</span>
        <span class="score">${esc(e.intHomeScore ?? "")}&nbsp;–&nbsp;${esc(e.intAwayScore ?? "")}</span>
        <span class="team away">${esc(e.strAwayTeam)}${badge(e.strAwayTeamBadge)}</span>
      </span>
      <span class="match-meta">${esc(e.strLeague || "")} · ${esc(formatEventDate(e, false))}</span>
    </li>`;
}

function nextMatchHTML(e: MatchEvent): string {
  return `
    <div class="next">
      <div class="next-teams">
        <span class="next-team">${badge(e.strHomeTeamBadge)}<b>${esc(e.strHomeTeam)}</b></span>
        <span class="next-vs">${esc(t("vs"))}</span>
        <span class="next-team">${badge(e.strAwayTeamBadge)}<b>${esc(e.strAwayTeam)}</b></span>
      </div>
      <p class="next-when">${esc(formatEventDate(e, true))}</p>
      <p class="muted">${esc(e.strLeague || "")}${e.strVenue ? " · " + esc(e.strVenue) : ""}</p>
    </div>`;
}

function loadNews(p: Player, force: boolean): void {
  const box = $("#news");
  const teamId = p.idTeam;
  if (!box || !teamId) { if (box) box.innerHTML = `<p class="muted">${esc(t("noLast"))}</p>`; return; }

  Promise.all([API.lastEvents(teamId, force), API.nextEvents(teamId, force)]).then(([last, nxt]) => {
    const target = $("#news");
    if (!target) return;
    const time = (d: MatchEvent): number => (eventDate(d) || new Date(0)).getTime();
    const past = last.list.slice().sort((a, b) => time(b) - time(a)).slice(0, 5);
    const upcoming = nxt.list.slice().sort((a, b) => time(a) - time(b))[0];
    const stamp = Math.min(last.t, nxt.t);

    target.innerHTML = `
      <div class="news-grid">
        <div class="news-block">
          <h3>${esc(t("nextMatch"))}</h3>
          ${upcoming ? nextMatchHTML(upcoming) : `<p class="muted">${esc(t("noNext"))}</p>`}
        </div>
        <div class="news-block">
          <h3>${esc(t("lastMatches"))}</h3>
          ${past.length ? `<ul class="matches">${past.map((e) => matchRow(e, teamId)).join("")}</ul>` : `<p class="muted">${esc(t("noLast"))}</p>`}
        </div>
      </div>
      <div class="news-foot">
        <span class="muted">${esc(t("updated", { t: relativeTime(stamp) }))}</span>
        <button class="btn small ghost" type="button" id="refreshNews">↻ ${esc(t("refresh"))}</button>
      </div>`;
    ($("#refreshNews") as HTMLButtonElement).addEventListener("click", () => {
      target.innerHTML = `<div class="loader" role="status"><span></span>${esc(t("loading"))}</div>`;
      loadNews(p, true);
    });
  }).catch(() => {
    const target = $("#news");
    if (target) target.innerHTML = `<p class="muted">${esc(t("errorText"))}</p>`;
  });
}

function renderPlayer(id: string): void {
  renderLoading();
  API.player(id).then(({ p }) => {
    if (location.hash !== "#joueur/" + id) return; // l'utilisateur a changé de page
    if (!p) { renderError(() => renderPlayer(id), t("notFound")); return; }

    document.title = p.strPlayer + " · " + t("brand");
    const age = ageFrom(p.dateBorn);
    const photo = p.strCutout || p.strRender || p.strThumb;
    const bioFR = p.strDescriptionFR;
    const bioEN = p.strDescriptionEN;
    const bio = (lang === "fr" && bioFR) ? bioFR : (bioEN || bioFR || "");
    const bioNote = lang === "fr" && !bioFR && bioEN ? t("bioEnOnly") : "";
    const national = p.strTeam2 && p.strTeam2 !== p.strTeam ? p.strTeam2 : "";

    const facts: Array<[string, string]> = [
      [t("club"), p.strTeam || "—"],
      [t("nationality"), (flag(p.strNationality) + " " + countryLabel(p.strNationality)).trim()],
      [t("position"), positionLabel(p.strPosition)],
      [t("age"), age !== null ? t("years", { n: age }) : "—"],
      [t("born"), formatDate(p.dateBorn)],
      [t("birthplace"), p.strBirthLocation || "—"],
      [t("height"), (p.strHeight || "—").replace(/\s*\(.*\)/, "")],
      [t("weight"), weightLabel(p.strWeight)],
      [t("foot"), footLabel(p.strSide)],
      [t("status"), statusLabel(p.strStatus)]
    ];
    if (national) facts.splice(1, 0, [t("nationalTeam"), national]);

    main().innerHTML = `
      <div class="page">
        <a class="back" href="javascript:history.length>1?history.back():location.assign('#')">← ${esc(t("back"))}</a>

        <section class="profile">
          <div class="profile-photo">
            ${photo ? `<img src="${esc(photo)}" alt="${esc(p.strPlayer)}" width="420" height="420">` : `<span class="avatar-fallback big">${esc(initials(p.strPlayer))}</span>`}
          </div>
          <div class="profile-main">
            <p class="kicker">${esc(p.strTeam || "")}${p.strNumber ? " · #" + esc(p.strNumber) : ""}</p>
            <h1>${esc(p.strPlayer)}</h1>
            <div class="chips">
              <span class="chip">${esc(positionLabel(p.strPosition))}</span>
              ${p.strNationality ? `<span class="chip">${flag(p.strNationality)} ${esc(countryLabel(p.strNationality))}</span>` : ""}
              ${age !== null ? `<span class="chip">${esc(t("years", { n: age }))}</span>` : ""}
            </div>
          </div>
        </section>

        <section class="card">
          <h2>${esc(t("news"))}</h2>
          <div id="news"><div class="loader" role="status"><span></span>${esc(t("loading"))}</div></div>
        </section>

        <section class="card">
          <dl class="facts">
            ${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}
          </dl>
        </section>

        ${bio ? `
        <section class="card">
          <h2>${esc(t("bio"))}</h2>
          ${bioNote ? `<p class="note">${esc(bioNote)}</p>` : ""}
          <div class="bio" id="bio">${bio.split(/\n+/).filter(Boolean).map((para) => `<p>${esc(para)}</p>`).join("")}</div>
          <button class="btn small ghost" type="button" id="bioToggle">${esc(t("readMore"))}</button>
        </section>` : ""}
      </div>`;

    const toggle = $("#bioToggle");
    if (toggle) {
      const bioEl = $("#bio") as HTMLElement;
      if (bioEl.scrollHeight <= bioEl.clientHeight + 4) toggle.remove();
      toggle.addEventListener("click", () => {
        const open = bioEl.classList.toggle("open");
        toggle.textContent = open ? t("readLess") : t("readMore");
      });
    }

    loadNews(p, false);
  }).catch(() => renderError(() => renderPlayer(id)));
}

/* ---------- Routeur ---------- */

function route(): void {
  window.clearInterval(clockTimer);
  document.body.classList.remove("is-home");
  const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const [view, ...rest] = hash.split("/");
  const arg = rest.join("/");

  if (view === "joueur" && /^\d+$/.test(arg)) renderPlayer(arg);
  else if (view === "recherche" && arg) renderSearch(arg);
  else renderHome();

  window.scrollTo(0, 0);
}

/* ---------- Démarrage ---------- */

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(theme);
  applyLang(lang);
  setupSettings();
  setupStatus();
  bindSearchForm($("#topSearch") as HTMLFormElement);
  window.addEventListener("hashchange", route);
  route();
});
