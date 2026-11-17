const participants = [
["MrSkrenh","https://www.twitch.tv/skrenhtv","https://t.me/skrenh"],["Permintion","https://www.twitch.tv/permintion","https://t.me/permintion_of"],["Fendi","https://www.twitch.tv/0_fendi_0","https://t.me/+e8Ad9dgn5js1YTEy"],["Stintik","https://www.twitch.tv/stintik"],["byakakk","https://www.twitch.tv/byakakk"],["kesya127","https://www.twitch.tv/kesya127"],["nechistv","https://www.twitch.tv/nechistv"],["sagitt_a","https://www.twitch.tv/sagitt_a"],["fantik_42r","https://www.twitch.tv/fantik_42r"],["Danfnaf12","https://www.twitch.tv/danfnaf12"],["EDISON","https://www.twitch.tv/edison"],["TakSebeYarik","https://www.twitch.tv/taksebeyarik"],["kW1sst","https://www.twitch.tv/kw1sst"],["sanhez","https://www.twitch.tv/sanhez"],["5opka","https://www.twitch.tv/5opka"],["Zakviel","https://www.twitch.tv/zakvielchannel"],["Buster","https://twitch.tv/buster"],["Bratishkinoff","https://twitch.tv/bratishkinoff"],["Deepins02","https://twitch.tv/deepins02"],["zubarefff","https://twitch.tv/zubarefff"],["N3koglai","https://twitch.tv/n3koglai"],["Evelone2004","https://twitch.tv/evelone2004"],["paradeev1ch","https://twitch.tv/paradeev1ch"],["koreshzy","https://twitch.tv/koreshzy"],["T2x2","https://twitch.tv/t2x2"],["HoneyMad","https://twitch.tv/honeymad"],["StRoGo","https://twitch.tv/strogo"],["mazellovvv","https://twitch.tv/mazellovvv"],["Recrent","https://twitch.tv/recrent"],["Gensyxa","https://twitch.tv/gensyxa"],["Dmitry_Lixxx","https://twitch.tv/dmitry_lixxx"],["Sasavot","https://twitch.tv/sasavot"]
];
const nominations = ["Прикол года","Тупость года","Клип года","Спидранер года","Маинкрафтер года","Кээсер года","Дотер года","Харизма года","Мододел Года","Контент года","Монстор года","Хойщик года","Витубер года","Активист года","Фоновик года","Строитель года","Архитектор автоматизации"];
const $ = (id) => document.getElementById(id);
const grid = $("peopleGrid"), count = $("peopleCount"), awardsGrid = $("awardsGrid");
let supabaseClient = null, session = null, myVotes = new Map(), totals = new Map();

function toast(message) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3200);
}
function renderPeople(query = "") {
  const filtered = participants.filter(p => p[0].toLowerCase().includes(query.toLowerCase()));
  count.textContent = filtered.length + " / 32 УЧАСТНИКА";
  grid.innerHTML = filtered.length ? filtered.map(p => {
    const i = participants.indexOf(p) + 1;
    return '<article class="person-card"><div class="person-info"><div class="person-number">УЧАСТНИК / ' + String(i).padStart(2,"0") + '</div><div class="person-name">' + p[0] + '</div></div><div class="person-links"><a href="' + p[1] + '" target="_blank" rel="noopener noreferrer" aria-label="Twitch ' + p[0] + '" title="Twitch">T</a>' + (p[2] ? '<a href="' + p[2] + '" target="_blank" rel="noopener noreferrer" aria-label="Telegram ' + p[0] + '" title="Telegram">↗</a>' : '') + '</div></article>';
  }).join("") : '<div class="empty-state">Никого не нашли. Попробуй другой запрос.</div>';
}
function renderAwards() {
  awardsGrid.innerHTML = nominations.map((name, i) => {
    const selected = myVotes.get(name) || "";
    const total = totals.get(name) || 0;
    const options = participants.map(p => '<option value="' + p[0] + '"' + (selected === p[0] ? " selected" : "") + '>' + p[0] + '</option>').join("");
    return '<article class="award-card vote-card"><div class="award-number">CATEGORY / ' + String(i+1).padStart(2,"0") + '</div><div class="award-name">' + name + '</div><span class="award-arrow">✳</span><div class="vote-controls"><label class="vote-label" for="vote-' + i + '">ТВОЙ ВЫБОР</label><select id="vote-' + i + '" class="vote-select"><option value="">Выбери участника</option>' + options + '</select><button class="vote-submit" data-vote="' + i + '">' + (selected ? "Изменить голос" : "Проголосовать") + '</button>' + (selected ? '<button class="vote-remove" data-remove="' + i + '">Отменить голос</button>' : '') + '</div></article>';
  }).join("");
  awardsGrid.querySelectorAll("[data-vote]").forEach(btn => btn.addEventListener("click", () => castVote(Number(btn.dataset.vote))));
  awardsGrid.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", () => removeVote(Number(btn.dataset.remove))));
}
async function refreshVotes() {
  if (!supabaseClient) return;
  // Не читаем таблицу голосов у анонимных посетителей.
  // После входа загружаем только голоса текущего пользователя (RLS).
  totals = new Map(nominations.map(n => [n, 0]));
  if (!session) {
    myVotes = new Map();
    renderAwards();
    return;
  }
  const { data: mine, error } = await supabaseClient
    .from("votes")
    .select("nomination,participant")
    .eq("user_id", session.user.id);
  if (error) {
    console.error(error);
    toast("Не удалось загрузить твои голоса. Проверь структуру таблицы votes в Supabase.");
    myVotes = new Map();
  } else {
    myVotes = new Map((mine || []).map(v => [v.nomination, v.participant]));
  }
  renderAwards();
}
async function castVote(index) {
  if (!session) { toast("Сначала войди через Discord."); return; }
  const nomination = nominations[index], participant = $("vote-" + index).value;
  if (!participant) { toast("Сначала выбери участника."); return; }
  const { error } = await supabaseClient.from("votes").upsert(
    { user_id: session.user.id, nomination, participant, updated_at: new Date().toISOString() },
    { onConflict: "user_id,nomination" }
  );
  if (error) { console.error(error); toast("Не удалось сохранить голос: " + error.message); return; }
  toast("Голос сохранён!");
  await refreshVotes();
}
async function removeVote(index) {
  if (!session) { toast("Сначала войди через Discord."); return; }
  const { error } = await supabaseClient.from("votes").delete().eq("user_id", session.user.id).eq("nomination", nominations[index]);
  if (error) { console.error(error); toast("Не удалось отменить голос: " + error.message); return; }
  toast("Голос отменён.");
  await refreshVotes();
}
function renderAuth() {
  const button = $("authButton"), status = $("authStatus");
  if (!button) return;
  button.textContent = session ? "Выйти" : "Войти через Discord";
  status.textContent = session ? (session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.user_metadata.user_name || "Вы вошли") : "Голосование через Discord";
}
async function initAuth() {
  const cfg = window.GLAY_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseKey) {
    toast("Не заполнены настройки Supabase.");
    return;
  }
  supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  const { data } = await supabaseClient.auth.getSession();
  session = data.session;
  renderAuth();
  await refreshVotes();
  supabaseClient.auth.onAuthStateChange(async (_event, newSession) => {
    session = newSession;
    renderAuth();
    await refreshVotes();
  });
  $("authButton").addEventListener("click", async () => {
    if (session) {
      const { error } = await supabaseClient.auth.signOut();
      if (error) toast("Не удалось выйти.");
    } else {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
      if (error) toast("Ошибка входа через Discord: " + error.message);
    }
  });
}
renderPeople();
$("peopleSearch").addEventListener("input", e => renderPeople(e.target.value));
$("menuToggle").addEventListener("click", () => $("nav").classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => $("nav").classList.remove("open")));
renderAwards();
initAuth();
