const pokedex = document.getElementById('pokedex');
const type1Filter = document.getElementById('type1-filter');
const type2Filter = document.getElementById('type2-filter');
const searchbar = document.getElementById('searchbar');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');
const pageSearch = document.getElementById('page-search');
const goPageBtn = document.getElementById('go-page-btn');
const searchDropdown = document.getElementById('search-dropdown');
let allPokemon = [];
let filteredPokemon = [];
let currentPage = 1;
const pageSize = 24;

fetch('pokemon_cache.json')
  .then(r => r.json())
  .then(data => {
    allPokemon = Object.entries(data)
      .map(([key, poke]) => ({
        id: poke.id ?? parseInt(key, 10),
        info: poke
      }))
      .sort((a, b) => a.id - b.id);

    const types = new Set();
    allPokemon.forEach(p => {
      if (p.info.types) Object.keys(p.info.types).forEach(t => types.add(t));
    });




    [...types].sort().forEach(t => {
      [type1Filter, type2Filter].forEach(sel => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t[0].toUpperCase() + t.slice(1);
        sel.appendChild(opt);
      });
    });

    filteredPokemon = [...allPokemon];
    renderPage();

    type1Filter.onchange = type2Filter.onchange = () => {
      currentPage = 1;
      applyFilters();
    };
    searchbar.oninput = () => {
      currentPage = 1;
      applyFilters();
      showDropdown();
    };
  })
  .catch(_ => pokedex.innerHTML = '<p>Failed to load Pokédex.</p>');

function applyFilters() {
  const t1 = type1Filter.value;
  const t2 = type2Filter.value;
  const query = searchbar.value.trim().toLowerCase();
  console.log(
    `Applying filters: Type1=${t1}, Type2=${t2}, Query='${query}'`
  );

  filteredPokemon = allPokemon.filter(p => {
    const ts = p.info.types ? Object.keys(p.info.types) : [];
    const nameMatch = p.info.name?.toLowerCase().includes(query);
    const abilityMatch = Object.keys(p.info.abilities || {}).some(a =>
      a.toLowerCase().includes(query)
    );
    const idMatch = String(p.id).padStart(3, '0').includes(query) || String(p.id).includes(query);

    if (query && !nameMatch && !idMatch && !abilityMatch) return false;
    if (t1 && !ts.includes(t1)) return false;
    if (t2 && !ts.includes(t2)) return false;

    return true;
  });

  renderPage();
}

function renderPage() {
  pokedex.innerHTML = '';
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filteredPokemon.slice(start, end);

  pageItems.forEach(p => {
    const padded = String(p.id).padStart(3, '0');
    const types = p.info.types ? Object.keys(p.info.types) : [];
    const typeHTML = types.map(t => `<span class="type ${t}">${t}</span>`).join(' ');
    const name = p.info.name
      ? p.info.name.charAt(0).toUpperCase() + p.info.name.slice(1)
      : 'N/A';

    pokedex.innerHTML += `
          <div class="pokemon" onclick="goToDetails(${p.id})">
            <img src="${p.info.image || ''}" alt="${name}">
            <p><strong>ID:</strong> ${padded}</p>
            <h3>${name}</h3>
            <div>${typeHTML}</div>
          </div>
        `;
  });

  pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredPokemon.length / pageSize)}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = end >= filteredPokemon.length;
}

prevBtn.onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
  }
};

nextBtn.onclick = () => {
  if ((currentPage * pageSize) < filteredPokemon.length) {
    currentPage++;
    renderPage();
  }
};

goPageBtn.onclick = () => {
  const page = parseInt(pageSearch.value, 10);
  if (!isNaN(page) && page > 0 && page <= Math.ceil(filteredPokemon.length / pageSize)) {
    currentPage = page;
    renderPage();
  }
};

function goToDetails(id) {
  window.location.href = `pokemon.html?id=${id}`;
}

document.addEventListener('click', e => {
  if (!searchDropdown.contains(e.target) && e.target !== searchbar) {
    searchDropdown.innerHTML = '';
  }
});

function showDropdown() {
  const query = searchbar.value.trim().toLowerCase();
  if (!query) {
    searchDropdown.innerHTML = '';
    return;
  }

  // (limit to 10 results)
  const results = allPokemon.filter(p =>
    p.info.name?.toLowerCase().includes(query)
  ).slice(0, 6); 

  if (results.length === 0) {
    searchDropdown.innerHTML = '';
    return;
  }


  let wrapper = searchDropdown.querySelector(".dropdown-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "dropdown-wrapper";
    wrapper.style.cssText = "background:#fff; border:1px solid #ccc; width:100%; z-index:10;";
    searchDropdown.appendChild(wrapper);
  } else {
    wrapper.innerHTML = "";
  }

  results.forEach(p => {
    const types = p.info.types ? Object.keys(p.info.types) : [];
    const typeHTML = types.map(t => `<span class="type ${t}" style="margin-left:4px;">${t}</span>`).join('');
    const name = p.info.name
      ? p.info.name.charAt(0).toUpperCase() + p.info.name.slice(1)
      : 'N/A';

    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.style.cssText = "display:flex; align-items:center; padding:4px; cursor:pointer;";
    item.onclick = () => { goToDetails(p.id); searchDropdown.innerHTML = ''; };

    item.innerHTML = `
      <img src="${p.info.image || ''}" alt="${name}" style="width:40px; height:40px; object-fit:contain; margin-right:8px;">
      <span style="flex:1;">${name}</span>
      <span style="margin-left:auto;">${typeHTML}</span>
    `;

    wrapper.appendChild(item); // 👈 puts new items at the bottom
  });
}

function on() {
  document.getElementById("overlay").style.display = "flex";
}
function off() {
  document.getElementById("overlay").style.display = "none";
}