let team1 = JSON.parse(localStorage.getItem('playerTeam')) || [];
let team2 = JSON.parse(localStorage.getItem('enemyTeam')) || [];
let active1 = 0;
let active2 = 0;
let turn = "player";

if (!team1.length || !team2.length) {
  document.getElementById("battle-text").textContent = "Teams not found!";
} else {
  team1.forEach(p => { normalizeStats(p); p.currentHP = p.maxHP; });
  team2.forEach(p => { normalizeStats(p); p.currentHP = p.maxHP; });
  startBattle();
}

function normalizeStats(poke) {
  let s = { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1, level: 50 };
  const t = poke.stats;
  if (Array.isArray(t)) {
    t.forEach(st => {
      const n = st.stat?.name, v = Number(st.base_stat) || 1;
      if (n === 'hp') s.hp = v;
      else if (n === 'attack') s.atk = v;
      else if (n === 'defense') s.def = v;
      else if (n === 'special-attack') s.spa = v;
      else if (n === 'special-defense') s.spd = v;
      else if (n === 'speed') s.spe = v;
    });
  } else if (t) {
    s.hp = Number(t.hp?.base_stat || t.hp) || 1;
    s.atk = Number(t.attack?.base_stat || t.attack) || 1;
    s.def = Number(t.defense?.base_stat || t.defense) || 1;
    s.spa = Number(t["special-attack"]?.base_stat || t.sp_atk) || 1;
    s.spd = Number(t["special-defense"]?.base_stat || t.sp_def) || 1;
    s.spe = Number(t.speed?.base_stat || t.speed) || 1;
    s.level = Number(t.level) || 50;
  }
  poke.maxHP = s.hp;
  poke.atk = s.atk;
  poke.def = s.def;
  poke.spa = s.spa;
  poke.spd = s.spd;
  poke.spe = s.spe;
  poke.level = s.level;
}

function startBattle() {
  render();
  updateTurn();
}

// === Rendering ===
function render() {
  renderSide("top", team2[active2]);
  renderSide("bottom", team1[active1]);
}

function renderSide(pos, poke) {
  if (!poke) return;
  document.getElementById(`${pos}-name`).textContent = `${poke.name} (${poke.currentHP}/${poke.maxHP} HP)`;
  document.getElementById(`${pos}-level`).textContent = formatTypes(poke.types);
  document.getElementById(`${pos}-sprite`).src = poke.image;

  const hpFill = document.getElementById(`${pos}-hp`);
  const pct = Math.max(0, Math.floor((poke.currentHP / poke.maxHP) * 100));
  hpFill.style.width = pct + "%";
  hpFill.className = "hp-fill " + (pct > 50 ? "hp-green" : pct > 20 ? "hp-yellow" : "hp-red");
}

function formatTypes(t) {
  return t ? Object.keys(t).map(x => x[0].toUpperCase() + x.slice(1)).join("/") : "Unknown";
}

function updateTurn() {
  document.getElementById("battle-text").textContent = turn === "player" ? "Player 1's Turn" : "Player 2's Turn";
}

document.getElementById("fight-btn").onclick = chooseMove;
document.getElementById("swap-btn").onclick = swapPokemon;
document.getElementById("run-btn").onclick = runAway;

function chooseMove() {
  const box = document.getElementById("move-options");
  box.innerHTML = "";
  box.classList.add("show");

  const atk = turn === "player" ? team1[active1] : team2[active2];
  const def = turn === "player" ? team2[active2] : team1[active1];
  const moves = Object.keys(atk.moves || atk.abilities || {});

  if (moves.length === 0) {
    const noMoves = document.createElement("p");
    noMoves.textContent = "No moves available!";
    box.appendChild(noMoves);
    return;
  }

  moves.forEach(name => {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.onclick = () => {
      box.classList.remove("show");
      attackMove(atk, def, name);
    };
    box.appendChild(btn);
  });
}

function swapPokemon() {
  const box = document.getElementById("move-options");
  box.innerHTML = "";
  box.classList.add("show");

  const team = turn === "player" ? team1 : team2;
  team.forEach((p, i) => {
    if (i !== (turn === "player" ? active1 : active2) && p.currentHP > 0) {
      const btn = document.createElement("button");
      btn.textContent = `${p.name} (${p.currentHP}/${p.maxHP})`;
      btn.onclick = () => {
        box.classList.remove("show");
        if (turn === "player") active1 = i;
        else active2 = i;
        render();
        endTurn();
      };
      box.appendChild(btn);
    }
  });
}

function attackMove(att, def, name) {
  const pwr = 35;
  const dmg = Math.floor(((2 * att.level / 5 + 2) * pwr * att.atk / def.def) / 50 + 2);

  setTimeout(() => {
    def.currentHP = Math.max(0, def.currentHP - dmg);
    render();
    document.getElementById("battle-text").textContent = `${att.name} dealt ${dmg} damage!`;

    setTimeout(() => {
      if (def.currentHP <= 0) handleFaint(def);
      else endTurn();
    }, 700);
  }, 500);
}

function handleFaint(def) {
  if (turn === "player") {
    if (!team2.some(p => p.currentHP > 0)) return endGame("Player 1");
    active2 = team2.findIndex(p => p.currentHP > 0);
  } else {
    if (!team1.some(p => p.currentHP > 0)) return endGame("Player 2");
    active1 = team1.findIndex(p => p.currentHP > 0);
  }
  render();
  endTurn();
}

function endTurn() {
  turn = turn === "player" ? "enemy" : "player";
  updateTurn();
  render();
  if (turn === "enemy") setTimeout(enemyTurn, 700);
}

function enemyTurn() {
  const atk = team2[active2];
  const def = team1[active1];
  const moves = Object.keys(atk.moves || atk.abilities || {});
  if (!moves.length) return;
  const m = moves[Math.floor(Math.random() * moves.length)];
  document.getElementById("battle-text").textContent = `Enemy ${atk.name} used ${m}!`;
  setTimeout(() => {
    attackMove(atk, def, m);
  }, 1000);
}

function runAway() {
  if (turn === "player") team1.forEach(p => p.currentHP = 0);
  else team2.forEach(p => p.currentHP = 0);
  render();
  endGame(turn === "player" ? "Player 2" : "Player 1");
}

function endGame(winner) {
  document.getElementById("battle-text").textContent = `${winner} wins the battle!`;
  document.querySelectorAll(".control-btn").forEach(b => b.disabled = true);
}

const music = document.getElementById("bg-music");
const slider = document.getElementById("volume-slider");
music.volume = 0.5;
slider.value = 0.5;
document.body.addEventListener("click", () => {
  if (music.paused) {
    music.play().catch(err => console.log("Autoplay blocked:", err));
  }
});

slider.addEventListener("input", () => {
  music.volume = slider.value;
});
