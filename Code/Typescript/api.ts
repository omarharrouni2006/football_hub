/* Accès aux données TheSportsDB : file d'attente, cache et nouvelles tentatives.
   La clé gratuite limite le nombre de requêtes par minute : on espace les appels
   et on garde les réponses en cache pour que le site reste fluide. */

interface Player {
  idPlayer: string;
  idTeam?: string | null;
  idTeam2?: string | null;
  strPlayer: string;
  strTeam?: string | null;
  strTeam2?: string | null;
  strSport?: string | null;
  strNationality?: string | null;
  strPosition?: string | null;
  strNumber?: string | null;
  strStatus?: string | null;
  strSide?: string | null;
  strHeight?: string | null;
  strWeight?: string | null;
  strBirthLocation?: string | null;
  dateBorn?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
  strRender?: string | null;
  strFanart1?: string | null;
  strDescriptionEN?: string | null;
  strDescriptionFR?: string | null;
  [key: string]: string | null | undefined;
}

interface MatchEvent {
  idEvent: string;
  strEvent: string;
  strLeague?: string | null;
  strLeagueBadge?: string | null;
  strHomeTeam: string;
  strAwayTeam: string;
  idHomeTeam: string;
  idAwayTeam: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strVenue?: string | null;
  strStatus?: string | null;
}

interface CacheEntry<T = unknown> { t: number; d: T; }
type ApiStatus = "ok" | "rate" | "error";

interface Job {
  path: string;
  promise: Promise<CacheEntry>;
  resolve: (e: CacheEntry) => void;
  reject: (e: unknown) => void;
}

const API = (() => {
  const BASE = "https://www.thesportsdb.com/api/v1/json/123/";
  const MIN_GAP = 2100;          // ms entre deux requêtes (~28 / minute)
  const CACHE_PREFIX = "pf-cache:";
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;

  const queue: Job[] = [];
  const memory: Record<string, CacheEntry> = {};
  const listeners: Array<(s: ApiStatus) => void> = [];
  let running = false;
  let lastCall = 0;

  function notify(state: ApiStatus): void {
    listeners.forEach((fn) => { try { fn(state); } catch (e) { /* ignore */ } });
  }

  function readCache(key: string, maxAge: number): CacheEntry | null {
    let entry: CacheEntry | undefined = memory[key];
    if (!entry) {
      try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (raw) entry = memory[key] = JSON.parse(raw) as CacheEntry;
      } catch (e) { /* stockage indisponible */ }
    }
    return entry && Date.now() - entry.t < maxAge ? entry : null;
  }

  function writeCache(key: string, data: unknown): CacheEntry {
    const entry: CacheEntry = { t: Date.now(), d: data };
    memory[key] = entry;
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // Stockage plein : on vide l'ancien cache
      try {
        Object.keys(localStorage)
          .filter((k) => k.indexOf(CACHE_PREFIX) === 0)
          .forEach((k) => localStorage.removeItem(k));
      } catch (e2) { /* ignore */ }
    }
    return entry;
  }

  function pump(): void {
    if (running || !queue.length) return;
    running = true;
    const wait = Math.max(0, lastCall + MIN_GAP - Date.now());
    setTimeout(() => {
      const job = queue.shift() as Job;
      lastCall = Date.now();
      attempt(job, 0);
    }, wait);
  }

  function next(): void {
    running = false;
    pump();
  }

  function attempt(job: Job, tries: number): void {
    fetch(BASE + job.path)
      .then((res) => {
        if (res.status === 429) throw new Error("rate");
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then((txt) => {
        let data: unknown;
        try { data = JSON.parse(txt); } catch (e) { throw new Error("rate"); }
        notify("ok");
        job.resolve(writeCache(job.path, data));
        next();
      })
      .catch((err) => {
        // Limite atteinte (Cloudflare renvoie une page sans CORS => erreur réseau)
        if (tries < 3) {
          notify("rate");
          setTimeout(() => { lastCall = Date.now(); attempt(job, tries + 1); }, 6000 * (tries + 1));
        } else {
          notify("error");
          job.reject(err);
          next();
        }
      });
  }

  function get(path: string, maxAge: number, force = false, priority = false): Promise<CacheEntry> {
    if (!force) {
      const cached = readCache(path, maxAge);
      if (cached) return Promise.resolve(cached);
    }
    const existing = queue.find((j) => j.path === path);
    if (existing) return existing.promise;

    const job = { path } as Job;
    job.promise = new Promise<CacheEntry>((resolve, reject) => {
      job.resolve = resolve;
      job.reject = (e) => {
        // En cas d'échec, on se rabat sur un cache même ancien
        const stale = readCache(path, Infinity);
        if (stale) resolve(stale); else reject(e);
      };
    });
    if (priority) queue.unshift(job); else queue.push(job);
    pump();
    return job.promise;
  }

  type Raw = Record<string, unknown> | null;

  return {
    onStatus(fn: (s: ApiStatus) => void): void { listeners.push(fn); },

    searchPlayers(q: string): Promise<Player[]> {
      const path = "searchplayers.php?p=" + encodeURIComponent(q.trim().replace(/\s+/g, "_"));
      return get(path, 6 * HOUR, false, true).then((r) => {
        const d = r.d as Raw;
        const list = ((d && (d.player || d.players)) || []) as Player[];
        return list.filter((p) => p.strSport === "Soccer");
      });
    },

    player(id: string, force = false, background = false): Promise<{ t: number; p: Player | null }> {
      return get("lookupplayer.php?id=" + id, 6 * HOUR, force, !background).then((r) => {
        const d = r.d as Raw;
        const list = ((d && (d.players || d.player)) || []) as Player[];
        return { t: r.t, p: list[0] || null };
      });
    },

    lastEvents(teamId: string, force = false): Promise<{ t: number; list: MatchEvent[] }> {
      return get("eventslast.php?id=" + teamId, 20 * MIN, force, true).then((r) => {
        const d = r.d as Raw;
        return { t: r.t, list: ((d && d.results) || []) as MatchEvent[] };
      });
    },

    nextEvents(teamId: string, force = false): Promise<{ t: number; list: MatchEvent[] }> {
      return get("eventsnext.php?id=" + teamId, 20 * MIN, force, true).then((r) => {
        const d = r.d as Raw;
        return { t: r.t, list: ((d && d.events) || []) as MatchEvent[] };
      });
    }
  };
})();
