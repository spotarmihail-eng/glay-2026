const participants = [
["MrSkrenh","https://www.twitch.tv/skrenhtv","https://t.me/skrenh"],
["Permintion","https://www.twitch.tv/permintion","https://t.me/permintion_of"],
["Fendi","https://www.twitch.tv/0_fendi_0","https://t.me/+e8Ad9dgn5js1YTEy"],
["Stintik","https://www.twitch.tv/stintik"],
["byakakk","https://www.twitch.tv/byakakk"],
["kesya127","https://www.twitch.tv/kesya127"],
["nechistv","https://www.twitch.tv/nechistv"],
["sagitt_a","https://www.twitch.tv/sagitt_a"],
["fantik_42r","https://www.twitch.tv/fantik_42r"],
["Danfnaf12","https://www.twitch.tv/danfnaf12"],
["EDISON","https://www.twitch.tv/edison"],
["TakSebeYarik","https://www.twitch.tv/taksebeyarik"],
["kW1sst","https://www.twitch.tv/kw1sst"],
["sanhez","https://www.twitch.tv/sanhez"],
["5opka","https://www.twitch.tv/5opka"],
["Zakviel","https://www.twitch.tv/zakvielchannel"],
["Buster","https://twitch.tv/buster"],
["Bratishkinoff","https://twitch.tv/bratishkinoff"],
["Deepins02","https://twitch.tv/deepins02"],
["zubarefff","https://twitch.tv/zubarefff"],
["N3koglai","https://twitch.tv/n3koglai"],
["Evelone2004","https://twitch.tv/evelone2004"],
["paradeev1ch","https://twitch.tv/paradeev1ch"],
["koreshzy","https://twitch.tv/koreshzy"],
["T2x2","https://twitch.tv/t2x2"],
["HoneyMad","https://twitch.tv/honeymad"],
["StRoGo","https://twitch.tv/strogo"],
["mazellovvv","https://twitch.tv/mazellovvv"],
["Recrent","https://twitch.tv/recrent"],
["Gensyxa","https://twitch.tv/gensyxa"],
["Dmitry_Lixxx","https://twitch.tv/dmitry_lixxx"],
["Sasavot","https://twitch.tv/sasavot"]
];
const nominations = ["Прикол года","Тупость года","Клип года","Спидранер года","Маинкрафтер года","Кээсер года","Дотер года","Харизма года","Мододел Года","Контент года","Монстор года","Хойщик года","Витубер года","Активист года","Фоновик года","Строитель года","Архитектор автоматизации"];
const grid = document.getElementById("peopleGrid");
const count = document.getElementById("peopleCount");
function renderPeople(query="") {
  const filtered = participants.filter(p=>p[0].toLowerCase().includes(query.toLowerCase()));
  count.textContent = filtered.length + " / 32 УЧАСТНИКА";
  grid.innerHTML = filtered.length ? filtered.map(p=>{
    const i=participants.indexOf(p)+1;
    return '<article class="person-card"><div class="person-info"><div class="person-number">УЧАСТНИК / '+String(i).padStart(2,"0")+'</div><div class="person-name">'+p[0]+'</div></div><div class="person-links"><a href="'+p[1]+'" target="_blank" rel="noopener noreferrer" aria-label="Twitch '+p[0]+'" title="Twitch">T</a>'+(p[2]?'<a href="'+p[2]+'" target="_blank" rel="noopener noreferrer" aria-label="Telegram '+p[0]+'" title="Telegram">↗</a>':'')+'</div></article>';
  }).join("") : '<div class="empty-state">Никого не нашли. Попробуй другой запрос.</div>';
}
renderPeople();
document.getElementById("peopleSearch").addEventListener("input",e=>renderPeople(e.target.value));
document.getElementById("awardsGrid").innerHTML=nominations.map((n,i)=>'<article class="award-card"><div class="award-number">CATEGORY / '+String(i+1).padStart(2,"0")+'</div><div class="award-name">'+n+'</div><span class="award-arrow">↗</span></article>').join("");
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("nav").classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("nav").classList.remove("open")));
