const GEN_RANGES = [
  { key: "gen1", label: "Gen 1 (Kanto)", min: 1, max: 151 },
  { key: "gen2", label: "Gen 2 (Johto)", min: 152, max: 251 },
  { key: "gen3", label: "Gen 3 (Hoenn)", min: 252, max: 386 },
  { key: "gen4", label: "Gen 4 (Sinnoh)", min: 387, max: 493 },
  { key: "gen5", label: "Gen 5 (Unova)", min: 494, max: 649 },
  { key: "gen6", label: "Gen 6 (Kalos)", min: 650, max: 721 },
  { key: "gen7", label: "Gen 7 (Alola)", min: 722, max: 809 },
  { key: "gen8", label: "Gen 8 (Galar/Hisui)", min: 810, max: 905 },
  { key: "gen9", label: "Gen 9 (Paldea+)", min: 906, max: 20000 }
];

const listEl = document.getElementById("pokemon-list");
const searchEl = document.getElementById("search");
const type1El = document.getElementById("type-filter-1");
const type2El = document.getElementById("type-filter-2");
const idEl = document.getElementById("id-search");
const moveEl = document.getElementById("move-search");
const moveListEl = document.getElementById("move-list");
const genEl = document.getElementById("gen-filter");
const playerTeamEl = document.getElementById("player-team");
const enemyTeamEl = document.getElementById("enemy-team");
const startBtn = document.getElementById("start-battle");
const errorEl = document.getElementById("error-message");

const paginationEl = document.getElementById("pagination");

let ALL = [];
let TYPES = new Set();
let ABILS = new Set();
let GENS = new Set();

let playerTeam = JSON.parse(localStorage.getItem("playerTeam") || "[]");
let enemyTeam = JSON.parse(localStorage.getItem("enemyTeam") || "[]");

let currentPage = 1;
const pageSize = 25;
let filteredList = [];

const toTitle = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const normalize = s => (s || "").toString().trim().toLowerCase();
const slugify = s => normalize(s).replace(/\s+/g, "-");

function idToGenKey(id) {
  for (const g of GEN_RANGES) {
    if (id >= g.min && id <= g.max) return g.key;
  }
  return "";
}

function formatTypes(obj) {
  const arr = Object.keys(obj || {});
  return arr.map(toTitle).join(" / ") || "Unknown";
}

function getTypesArray(obj) {
  return Object.keys(obj || {}).map(normalize);
}
function getAbilitiesArray(obj) {
  return Object.keys(obj || {}).map(normalize);
}

function flattenDex(raw) {
  const out = [];
  for (const key of Object.keys(raw)) {
    const base = raw[key];
    if (!base || typeof base !== "object") continue;

    out.push({
      ...base,
      _types: getTypesArray(base.types),
      _abils: getAbilitiesArray(base.abilities),
      _gen: idToGenKey(Number(base.id) || 0)
    });

    const vs = base.variants;
    if (Array.isArray(vs)) {
      for (const v of vs) {
        out.push({
          ...v,
          _types: getTypesArray(v.types),
          _abils: getAbilitiesArray(v.abilities),
          _gen: idToGenKey(Number(v.id) || 0)
        });
      }
    } else if (vs && typeof vs === "object") {
      for (const vKey of Object.keys(vs)) {
        const v = vs[vKey];
        out.push({
          ...v,
          _types: getTypesArray(v.types),
          _abils: getAbilitiesArray(v.abilities),
          _gen: idToGenKey(Number(v.id) || 0)
        });
      }
    }
  }
  return out.sort((a, b) => (a.id || 0) - (b.id || 0));
}

function harvestFacets(list) {
  list.forEach(p => {
    p._types.forEach(t => TYPES.add(t));
    p._abils.forEach(a => ABILS.add(a));
    if (p._gen) GENS.add(p._gen);
  });
}

function renderSelectOptions(selectEl, values, labelMap = x => x) {
  const arr = Array.from(values).sort((a, b) => a.localeCompare(b));
  for (const v of arr) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = toTitle(labelMap(v));
    selectEl.appendChild(opt);
  }
}

function renderGenOptions() {
  const present = GEN_RANGES.filter(g => GENS.has(g.key));
  for (const g of present) {
    const opt = document.createElement("option");
    opt.value = g.key;
    opt.textContent = g.label;
    genEl.appendChild(opt);
  }
}

function renderAbilityDatalist() {
  const arr = Array.from(ABILS).sort((a, b) => a.localeCompare(b));
  for (const a of arr) {
    const opt = document.createElement("option");
    opt.value = a;
    moveListEl.appendChild(opt);
  }
}
function matchesFilters(p) {
  const qName = normalize(searchEl.value);
  const qId = normalize(idEl.value);
  const qMove = slugify(moveEl.value);
  const t1 = normalize(type1El.value);
  const t2 = normalize(type2El.value);
  const gSel = normalize(genEl.value);

  if (qName && !normalize(p.name).includes(qName)) return false;

  if (qId) {
    const asNum = Number(qId);
    if (!Number.isNaN(asNum) && (p.id || 0) !== asNum) return false;
  }

  if (t1 && !p._types.includes(t1)) return false;
  if (t2 && !p._types.includes(t2)) return false;

  if (qMove) {
    const hasAbility = p._abils.some(a => a.includes(qMove));
    if (!hasAbility) return false;
  }

  if (gSel && p._gen !== gSel) return false;

  return true;
}

function renderList() {
  // Filter first
  filteredList = ALL.filter(matchesFilters);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * pageSize;
  const items = filteredList.slice(start, start + pageSize);

  listEl.innerHTML = "";
  if (!items.length) {
    listEl.innerHTML = `<p style="text-align:center; opacity:.8;">No Pokémon match your filters.</p>`;
  } else {
    for (const p of items) {
      const card = document.createElement("div");
      card.className = "pokemon-card";

      const title = document.createElement("div");
      title.className = "pokemon-title";
      title.textContent = `#${p.id} — ${toTitle(p.name)}`;

      const sprite = document.createElement("img");
      sprite.src = p.image;
      sprite.alt = p.name;
      sprite.loading = "lazy";

      const types = document.createElement("div");
      types.className = "pokemon-types";
      types.textContent = formatTypes(p.types);

      const actions = document.createElement("div");
      actions.className = "pokemon-actions";

      const addP = document.createElement("button");
      addP.textContent = "Add to Player";
      addP.onclick = () => addToTeam(p, "player");

      const addE = document.createElement("button");
      addE.textContent = "Add to Enemy";
      addE.onclick = () => addToTeam(p, "enemy");

      actions.appendChild(addP);
      actions.appendChild(addE);

      card.appendChild(title);
      card.appendChild(sprite);
      card.appendChild(types);
      card.appendChild(actions);

      listEl.appendChild(card);
    }
  }

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  paginationEl.innerHTML = "";

  // Controls row
  const row = document.createElement("div");
  row.className = "controls";

  // Prev
  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = currentPage === 1;
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderList();
    }
  };
  row.appendChild(prev);

  const pageBox = document.createElement("div");
  pageBox.className = "page-box";

  const input = document.createElement("input");
  input.type = "number";
  input.min = 1;
  input.max = totalPages;
  input.placeholder = "Page";
  input.value = currentPage;

  const goBtn = document.createElement("button");
  goBtn.textContent = "Go";
  goBtn.className = "go-btn";
  goBtn.onclick = () => {
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      currentPage = page;
      renderList();
    }
  };

  pageBox.appendChild(input);
  pageBox.appendChild(goBtn);
  row.appendChild(pageBox);

  // Next
  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = currentPage === totalPages;
  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderList();
    }
  };
  row.appendChild(next);

  paginationEl.appendChild(row);

  const info = document.createElement("div");
  info.className = "page-info";
  info.textContent = `Page ${currentPage} of ${totalPages}`;
  paginationEl.appendChild(info);
}

function addToTeam(p, which) {
  const team = which === "player" ? playerTeam : enemyTeam;
  if (team.length >= 6) {
    flashError(`${which === "player" ? "Player" : "Enemy"} team already has 6 Pokémon.`);
    return;
  }
  if (team.some(x => x.id === p.id && x.name === p.name)) {
    flashError(`That ${toTitle(p.name)} is already on the ${which === "player" ? "Player" : "Enemy"} team.`);
    return;
  }

  const sfx = document.getElementById("button-sfx");
  if (sfx) {
    sfx.currentTime = 0; 
    sfx.play();
  }

  team.push({ id: p.id, name: p.name, image: p.image, types: p.types, stats: p.stats, abilities: p.abilities });
  persistTeams();
  renderTeams();
}

function removeFromTeam(idx, which) {
  const team = which === "player" ? playerTeam : enemyTeam;
  team.splice(idx, 1);
  persistTeams();
  renderTeams();
}

function renderTeams() {
  playerTeamEl.innerHTML = "";
  enemyTeamEl.innerHTML = "";

  playerTeam.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "team-row";
    row.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <span>#${p.id} — ${toTitle(p.name)}</span>
      <button aria-label="Remove" title="Remove">✕</button>
    `;
    row.querySelector("button").onclick = () => removeFromTeam(i, "player");
    playerTeamEl.appendChild(row);
  });

  enemyTeam.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "team-row";
    row.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <span>#${p.id} — ${toTitle(p.name)}</span>
      <button aria-label="Remove" title="Remove">✕</button>
    `;
    row.querySelector("button").onclick = () => removeFromTeam(i, "enemy");
    enemyTeamEl.appendChild(row);
  });
}

function persistTeams() {
  localStorage.setItem("playerTeam", JSON.stringify(playerTeam));
  localStorage.setItem("enemyTeam", JSON.stringify(enemyTeam));
}

let errorTimer = null;
function flashError(msg) {
  clearTimeout(errorTimer);
  errorEl.textContent = msg;
  errorEl.style.opacity = "1";
  errorTimer = setTimeout(() => (errorEl.style.opacity = "0"), 2200);
}

async function init() {
  try {
    const res = await fetch("pokemon_cache.json");
    const raw = await res.json();

    ALL = flattenDex(raw);
    harvestFacets(ALL);

    renderSelectOptions(type1El, TYPES, x => x);
    renderSelectOptions(type2El, TYPES, x => x);
    renderGenOptions();
    renderAbilityDatalist();

    renderTeams();
    [searchEl, idEl, moveEl, type1El, type2El, genEl].forEach(el => {
      el.addEventListener("input", () => { currentPage = 1; renderList(); });
      el.addEventListener("change", () => { currentPage = 1; renderList(); });
    });

    startBtn.addEventListener("click", () => {
      if (!playerTeam.length || !enemyTeam.length) {
        flashError("Pick at least one Pokémon for both teams.");
        return;
      }
      persistTeams();
      window.location.href = "battle.html";
    });

    renderList();
  } catch (e) {
    console.error(e);
    flashError("Failed to load Pokémon cache.");
  }
}

document.addEventListener("DOMContentLoaded", init);

const egghatch = document.getElementById('go-to');
egghatch.addEventListener("click", () => {
  location.href = '../index.html'
  console.log(`hi`);
  
})