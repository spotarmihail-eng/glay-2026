const SITE_ORIGIN = "https://spotarmihail-eng.github.io";
const SITE_URL = "https://spotarmihail-eng.github.io/glay-2026/";

const NOMINATIONS = [
  "Прикол года", "Тупость года", "Клип года", "Спидранер года",
  "Маинкрафтер года", "Кээсер года", "Дотер года", "Харизма года",
  "Мододел Года", "Контент года", "Монстор года", "Хойщик года",
  "Витубер года", "Активист года", "Фоновик года", "Строитель года",
  "Архитектор автоматизации"
];

const PARTICIPANTS = [
  "MrSkrenh", "Permintion", "Fendi", "Stintik", "byakakk", "kesya127",
  "nechistv", "sagitt_a", "fantik_42r", "Danfnaf12", "EDISON",
  "TakSebeYarik", "kW1sst", "sanhez", "5opka", "Zakviel", "Buster",
  "Bratishkinoff", "Deepins02", "zubarefff", "N3koglai", "Evelone2004",
  "paradeev1ch", "koreshzy", "T2x2", "HoneyMad", "StRoGo", "mazellovvv",
  "Recrent", "Gensyxa", "Dmitry_Lixxx", "Sasavot"
];

const enc = new TextEncoder();
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/=/g, "").replace(/\\+/g, "-").replace(/\\//g, "_");
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));

async function sign(payload, secret) {
  const head = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const data = head + "." + body;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return data + "." + b64url(sig);
}

async function verify(token, secret) {
  try {
    const [head, body, signature] = token.split(".");
    const data = head + "." + body;
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("HMAC", key, fromB64url(signature), enc.encode(data));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function cookie(request, name) {
  const value = request.headers.get("Cookie") || "";
  const match = value.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

function headers(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status = 200, origin = SITE_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers(origin) }
  });
}

function redirect(url, cookieValue) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Set-Cookie": cookieValue,
      "Cache-Control": "no-store"
    }
  });
}

async function currentUser(request, env) {
  const token = cookie(request, "glay_session");
  return token ? verify(token, env.SESSION_SECRET) : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || SITE_ORIGIN;
    if (request.method === "OPTIONS") return new Response(null, { headers: headers(origin) });

    if (url.pathname === "/auth/discord") {
      const state = crypto.randomUUID();
      const authorize = new URL("https://discord.com/oauth2/authorize");
      authorize.search = new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        response_type: "code",
        redirect_uri: url.origin + "/auth/discord/callback",
        scope: "identify",
        state
      });
      return redirect(authorize.toString(),
        "glay_oauth_state=" + state + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600");
    }

    if (url.pathname === "/auth/discord/callback") {
      const state = url.searchParams.get("state") || "";
      const savedState = cookie(request, "glay_oauth_state");
      const code = url.searchParams.get("code");
      if (!code || !state || state !== savedState) {
        return redirect(SITE_URL + "?login=failed",
          "glay_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      }

      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: url.origin + "/auth/discord/callback"
        })
      });
      if (!tokenResponse.ok) return redirect(SITE_URL + "?login=failed", "glay_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      const tokenData = await tokenResponse.json();
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: "Bearer " + tokenData.access_token }
      });
      if (!userResponse.ok) return redirect(SITE_URL + "?login=failed", "glay_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      const discordUser = await userResponse.json();
      await env.DB.prepare(
        "INSERT INTO voters (discord_id, discord_username) VALUES (?, ?) ON CONFLICT(discord_id) DO UPDATE SET discord_username = excluded.discord_username"
      ).bind(discordUser.id, discordUser.global_name || discordUser.username).run();

      const session = await sign({
        sub: discordUser.id,
        username: discordUser.global_name || discordUser.username,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
      }, env.SESSION_SECRET);

      return redirect(SITE_URL,
        "glay_session=" + session + "; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800");
    }

    if (url.pathname.startsWith("/api/")) {
      if (origin !== SITE_ORIGIN) return json({ error: "Origin not allowed" }, 403, origin);
      const user = await currentUser(request, env);
      if (url.pathname === "/api/me" && request.method === "GET") {
        return json({ user: user ? { id: user.sub, username: user.username } : null }, 200, origin);
      }
      if (url.pathname === "/api/vote" && request.method === "POST") {
        if (!user) return json({ error: "Сначала войдите через Discord" }, 401, origin);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Некорректный JSON" }, 400, origin); }
        const { nomination, participant } = body || {};
        if (!NOMINATIONS.includes(nomination) || !PARTICIPANTS.includes(participant)) {
          return json({ error: "Неизвестная номинация или участник" }, 400, origin);
        }
        await env.DB.prepare(
          "INSERT INTO votes (discord_id, nomination, participant) VALUES (?, ?, ?) ON CONFLICT(discord_id, nomination) DO UPDATE SET participant = excluded.participant, created_at = CURRENT_TIMESTAMP"
        ).bind(user.sub, nomination, participant).run();
        return json({ ok: true }, 200, origin);
      }
      if (url.pathname === "/api/vote" && request.method === "DELETE") {
        if (!user) return json({ error: "Сначала войдите через Discord" }, 401, origin);
        const nomination = url.searchParams.get("nomination") || "";
        if (!NOMINATIONS.includes(nomination)) return json({ error: "Неизвестная номинация" }, 400, origin);
        await env.DB.prepare("DELETE FROM votes WHERE discord_id = ? AND nomination = ?")
          .bind(user.sub, nomination).run();
        return json({ ok: true }, 200, origin);
      }
      if (url.pathname === "/api/results" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT nomination, participant, COUNT(*) AS votes FROM votes GROUP BY nomination, participant ORDER BY nomination, votes DESC"
        ).all();
        return json({ results: result.results || [] }, 200, origin);
      }
    }

    return new Response("GLAY 2026 voting API", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
};
