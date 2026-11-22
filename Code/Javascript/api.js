"use strict";
/* Accès aux données TheSportsDB : file d'attente, cache et nouvelles tentatives.
   La clé gratuite limite le nombre de requêtes par minute : on espace les appels
   et on garde les réponses en cache pour que le site reste fluide. */
const API = (() => {
    const BASE = "https://www.thesportsdb.com/api/v1/json/123/";
    const MIN_GAP = 2100; // ms entre deux requêtes (~28 / minute)
    const CACHE_PREFIX = "pf-cache:";
    const MIN = 60 * 1000;
    const HOUR = 60 * MIN;
    const queue = [];
    const memory = {};
    const listeners = [];
    let running = false;
    let lastCall = 0;
    function notify(state) {
        listeners.forEach((fn) => { try {
            fn(state);
        }
        catch (e) { /* ignore */ } });
    }
    function readCache(key, maxAge) {
        let entry = memory[key];
        if (!entry) {
            try {
                const raw = localStorage.getItem(CACHE_PREFIX + key);
                if (raw)
                    entry = memory[key] = JSON.parse(raw);
            }
            catch (e) { /* stockage indisponible */ }
        }
        return entry && Date.now() - entry.t < maxAge ? entry : null;
    }
    function writeCache(key, data) {
        const entry = { t: Date.now(), d: data };
        memory[key] = entry;
        try {
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
        }
        catch (e) {
            // Stockage plein : on vide l'ancien cache
            try {
                Object.keys(localStorage)
                    .filter((k) => k.indexOf(CACHE_PREFIX) === 0)
                    .forEach((k) => localStorage.removeItem(k));
            }
            catch (e2) { /* ignore */ }
        }
        return entry;
    }
    function pump() {
        if (running || !queue.length)
            return;
        running = true;
        const wait = Math.max(0, lastCall + MIN_GAP - Date.now());
        setTimeout(() => {
            const job = queue.shift();
            lastCall = Date.now();
            attempt(job, 0);
        }, wait);
    }
    function next() {
        running = false;
        pump();
    }
    function attempt(job, tries) {
        fetch(BASE + job.path)
            .then((res) => {
            if (res.status === 429)
                throw new Error("rate");
            if (!res.ok)
                throw new Error("HTTP " + res.status);
            return res.text();
        })
            .then((txt) => {
            let data;
            try {
                data = JSON.parse(txt);
            }
            catch (e) {
                throw new Error("rate");
            }
            notify("ok");
            job.resolve(writeCache(job.path, data));
            next();
        })
            .catch((err) => {
            // Limite atteinte (Cloudflare renvoie une page sans CORS => erreur réseau)
            if (tries < 3) {
                notify("rate");
                setTimeout(() => { lastCall = Date.now(); attempt(job, tries + 1); }, 6000 * (tries + 1));
            }
            else {
                notify("error");
                job.reject(err);
                next();
            }
        });
    }
    function get(path, maxAge, force = false, priority = false) {
        if (!force) {
            const cached = readCache(path, maxAge);
            if (cached)
                return Promise.resolve(cached);
        }
        const existing = queue.find((j) => j.path === path);
        if (existing)
            return existing.promise;
        const job = { path };
        job.promise = new Promise((resolve, reject) => {
            job.resolve = resolve;
            job.reject = (e) => {
                // En cas d'échec, on se rabat sur un cache même ancien
                const stale = readCache(path, Infinity);
                if (stale)
                    resolve(stale);
                else
                    reject(e);
            };
        });
        if (priority)
            queue.unshift(job);
        else
            queue.push(job);
        pump();
        return job.promise;
    }
    return {
        onStatus(fn) { listeners.push(fn); },
        searchPlayers(q) {
            const path = "searchplayers.php?p=" + encodeURIComponent(q.trim().replace(/\s+/g, "_"));
            return get(path, 6 * HOUR, false, true).then((r) => {
                const d = r.d;
                const list = ((d && (d.player || d.players)) || []);
                return list.filter((p) => p.strSport === "Soccer");
            });
        },
        player(id, force = false, background = false) {
            return get("lookupplayer.php?id=" + id, 6 * HOUR, force, !background).then((r) => {
                const d = r.d;
                const list = ((d && (d.players || d.player)) || []);
                return { t: r.t, p: list[0] || null };
            });
        },
        lastEvents(teamId, force = false) {
            return get("eventslast.php?id=" + teamId, 20 * MIN, force, true).then((r) => {
                const d = r.d;
                return { t: r.t, list: ((d && d.results) || []) };
            });
        },
        nextEvents(teamId, force = false) {
            return get("eventsnext.php?id=" + teamId, 20 * MIN, force, true).then((r) => {
                const d = r.d;
                return { t: r.t, list: ((d && d.events) || []) };
            });
        }
    };
})();
