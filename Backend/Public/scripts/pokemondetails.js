(function () {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('id'); // numeric ID or string key
  const detailsEl = document.getElementById('details');

  // If we arrived with a ?page= carry it into localStorage
  const fromPage = parseInt(params.get('page'), 10);
  if (!isNaN(fromPage) && fromPage > 0) {
    localStorage.setItem('lastPokedexPage', String(fromPage));
  }

  // Hook the existing Back link (if present in HTML) to use remembered page
  const backAnchor = document.querySelector('.back-button');
  if (backAnchor) {
    backAnchor.addEventListener('click', (e) => {
      e.preventDefault();
      const page = localStorage.getItem('lastPokedexPage') || '1';
      window.location.href = `index.html?page=${page}`;
    });
  }

  if (!rawId) {
    detailsEl.innerHTML = '<p>Invalid Pokémon ID.</p>';
    return;
  }

  fetch('pokemon_cache.json')
    .then(res => res.json())
    .then(data => {
      // Lookup by key or numeric ID
      let poke = data[rawId] || Object.values(data).find(p => String(p.id) === rawId);
      if (!poke) {
        detailsEl.innerHTML = '<p>Pokémon not found.</p>';
        return;
      }

      // Keep track of base Pokémon (for prev/next buttons and base form)
      const basePoke = data[poke.baseName?.toLowerCase() || poke.name.toLowerCase()] || poke;

      function renderPokemon(poke) {
        // Types and abilities
        let typesHTML = 'N/A';
        if (poke.types) {
          typesHTML = Object.keys(poke.types)
            .map(type => `<span class="type ${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`)
            .join(' ');
        }
        const abilities = poke.abilities
          ? Object.keys(poke.abilities)
            .map(a => a.charAt(0).toUpperCase() + a.slice(1))
            .join(', ')
          : 'N/A';

        // Variants dropdown
        const variants = basePoke.variants || {};
        let variantOptions = '';
        if (Object.keys(variants).length > 0) {
          variantOptions = `<select id="variant-select">
            <option value="">Base Form</option>
            ${Object.entries(variants).map(([vName, v]) =>
            `<option value="${vName}"${vName === poke.name ? ' selected' : ''}>
                ${v.name.charAt(0).toUpperCase() + v.name.slice(1)}
              </option>`
          ).join('')}
          </select>`;
        }

        // Extract stat values for the chart
        const statOrder = ['hp', 'attack', 'defense', 'speed', 'special-defense', 'special-attack'];
        const statData = statOrder.map(stat =>
          poke.stats && poke.stats[stat] ? poke.stats[stat].base_stat : 0
        );

        // Render details
        detailsEl.innerHTML = `
        <div class="half">
        <div class="namesection">
        <h1>${poke.name.charAt(0).toUpperCase() + poke.name.slice(1)}</h1>
        <p><strong>ID:</strong> ${String(poke.id).padStart(3, '0')}</p>
        ${variantOptions}
        </div>
        <div class="pokemon-image-bg">
        <img id="poke-img" src="${poke.image || 'img/Spr_3r_000.png'}" alt="${poke.name}" style="cursor:pointer">
        </div>
        <div id="cry-container">
        <button id="prev-pokemon">⬅ Previous Pokémon</button>
        <button id="play-cry">🔊 Play Cry</button>
        <button id="next-pokemon">Next Pokémon➡</button>
        <audio id="audio-cry" preload="auto" src="${poke.cries || ''}"></audio>
        </div>
        </div>
        <div class="half">
        <div class="typesection">
        <strong>Types:</strong> ${typesHTML}
        </div>
        <div id="chart"></div>
        <div class="boxes">
        <div class="box"><p><strong>Abilities:</strong> ${abilities}</p></div>
        <div class="box"><p><strong>Base XP:</strong> ${poke.base_experience || 'N/A'}</p></div>
        <div class="box"><p><strong>Height:</strong> ${poke.height || 'N/A'}</p></div>
        <div class="box"><p><strong>Weight:</strong> ${poke.weight || 'N/A'}</p></div>
        </div>
      </div>
        `;

        // Shiny toggle logic
        const pokeImg = document.getElementById('poke-img');
        let isShiny = false;
        // Create shiny audio element
        let shinyAudio = document.getElementById('shiny-audio');
        if (!shinyAudio) {
          shinyAudio = document.createElement('audio');
          shinyAudio.id = 'shiny-audio';
          shinyAudio.src = 'audio/shiny.mp3';
          shinyAudio.preload = 'auto';
          document.body.appendChild(shinyAudio);
        }
        pokeImg.addEventListener('click', () => {
          if (!poke.shiny) return;
          isShiny = !isShiny;
          pokeImg.src = "img/9201ca103be3621c2b032f2151ff210e_w200.gif"
          setTimeout(() => {
            pokeImg.src = isShiny ? poke.shiny : poke.image;
          }, 400);
          if (isShiny) {
            shinyAudio.currentTime = 0;
            shinyAudio.play().catch(() => { });
          }
        });

        // Radar chart
        let options = {
          series: [{ name: 'Stats', data: statData }],
          chart: { height: 350, type: 'radar', toolbar: { show: false } },
          plotOptions: {
            radar: {
              polygons: {
                strokeColors: '#9e9e9eff',
                fill: { colors: ['#d2e2ffff', '#d2c7ffff'] }
              }
            }
          },
          yaxis: { show: false, min: 0, max: 255 },
          colors: ['#FF4560'],
          xaxis: {
            categories: ['HP', 'Attack', 'Defence', 'Speed', 'Sp. Def', 'Sp. Atk'],
            labels: { style: { colors: ['#000', '#000', '#000', '#000', '#000', '#000'] } }
          }
        };
        let chart = new ApexCharts(document.querySelector("#chart"), options);
        chart.render();

        // Audio playback
        const audioEl = document.getElementById('audio-cry');
        const playBtn = document.getElementById('play-cry');
        playBtn.addEventListener('click', () => {
          if (audioEl.src) {
            audioEl.currentTime = 0;
            audioEl.play().catch(err => console.error('Cry failed to play', err));
          }
        });

        // Prev/Next keep last page in the URL
        const lastPage = localStorage.getItem('lastPokedexPage') || '1';
        document.getElementById('prev-pokemon').addEventListener('click', () => {
          const prevId = basePoke.id - 1;
          if (prevId > 0) window.location.href = `pokemon.html?id=${prevId}&page=${lastPage}`;
        });
        document.getElementById('next-pokemon').addEventListener('click', () => {
          const nextId = basePoke.id + 1;
          window.location.href = `pokemon.html?id=${nextId}&page=${lastPage}`;
        });

        // Variant change handling
        const variantSelect = document.getElementById('variant-select');
        if (variantSelect) {
          variantSelect.addEventListener('change', (e) => {
            const vName = e.target.value;
            let newPoke = !vName ? basePoke : basePoke.variants[vName];
            setTimeout(() => {

              if (newPoke) renderPokemon(newPoke);
            }, 200);
            pokeImg.src = "img/9201ca103be3621c2b032f2151ff210e_w200.gif"
          });
        }



        // Type effectiveness display with multipliers
        function getMultipliers(defendingTypes) {
          const allTypes = Object.keys(typeChart);
          const multipliers = {};
          allTypes.forEach(attackingType => {
            let multiplier = 1;
            defendingTypes.forEach(defType => {
              if (typeChart[defType].immune.includes(attackingType)) {
                multiplier *= 0;
              } else if (typeChart[defType].weak.includes(attackingType)) {
                multiplier *= 2;
              } else if (typeChart[defType].resist.includes(attackingType)) {
                multiplier *= 0.5;
              }
            });
            multipliers[attackingType] = multiplier;
          });
          return multipliers;
        }

        function showTypeEffectiveness(pokemonTypes) {
          const multipliers = getMultipliers(pokemonTypes);
          // Group types by multiplier
          const quadEffective = Object.entries(multipliers).filter(([type, mult]) => mult === 4);
          const superEffective = Object.entries(multipliers).filter(([type, mult]) => mult === 2);
          const quadResistant = Object.entries(multipliers).filter(([type, mult]) => mult === 0.25);
          const resistant = Object.entries(multipliers).filter(([type, mult]) => mult === 0.5);
          const immune = Object.entries(multipliers).filter(([type, mult]) => mult === 0);

          let html = `<h3>Type Effectiveness</h3>`;
          html += `<div><strong>4x Weak to:</strong> `;
          if (quadEffective.length) {
            quadEffective.forEach(([type, mult]) => {
              html += `<span class="type ${type}">${type.charAt(0).toUpperCase() + type.slice(1)} <strong>${mult}x</strong></span> `;
            });
          } else {
            html += `None`;
          }
          html += `</div>`;

          html += `<div><strong>2x Weak to:</strong> `;
          if (superEffective.length) {
            superEffective.forEach(([type, mult]) => {
              html += `<span class="type ${type}">${type.charAt(0).toUpperCase() + type.slice(1)} <strong>${mult}x</strong></span> `;
            });
          } else {
            html += `None`;
          }
          html += `</div>`;

          html += `<div><strong>0.5x Resistant to:</strong> `;
          if (resistant.length) {
            resistant.forEach(([type, mult]) => {
              html += `<span class="type ${type}">${type.charAt(0).toUpperCase() + type.slice(1)} <strong>${mult}x</strong></span> `;
            });
          } else {
            html += `None`;
          }
          html += `</div>`;

          html += `<div><strong>0.25x Resistant to:</strong> `;
          if (quadResistant.length) {
            quadResistant.forEach(([type, mult]) => {
              html += `<span class="type ${type}">${type.charAt(0).toUpperCase() + type.slice(1)} <strong>${mult}x</strong></span> `;
            });
          } else {
            html += `None`;
          }
          html += `</div>`;

          html += `<div><strong>Immune to:</strong> `;
          if (immune.length) {
            immune.forEach(([type]) => {
              html += `<span class="type ${type}">${type.charAt(0).toUpperCase() + type.slice(1)} <strong>0x</strong></span> `;
            });
          } else {
            html += `None`;
          }
          html += `</div>`;

          document.getElementById('type-effectiveness').innerHTML = html;
          document.getElementById('type-effectiveness').innerHTML = html;
        }

        showTypeEffectiveness(Object.keys(poke.types));
        addExtraInfoToCard(poke);
      }

      // Initial render
      renderPokemon(poke);
    })
    .catch(err => {
      console.error(err);
      detailsEl.innerHTML = '<p>Error loading Pokémon data.</p>';
    });
})();
(function () {
  const audio = document.getElementById('bg-music');
  const STORAGE_KEY = 'bg-music-currentTime';
  const VOLUME_KEY = 'bg-music-volume';
  let autoPlayBlocked = false;

  // --- Volume Mixer Setup ---
  const volumeSlider = document.getElementById('volume-slider');
  // Restore volume from storage or default to 0.5
  const savedVol = parseFloat(localStorage.getItem(VOLUME_KEY));
  audio.volume = !isNaN(savedVol) ? savedVol : 0.5;
  if (volumeSlider) volumeSlider.value = audio.volume;

  // Handle volume changes
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      audio.volume = parseFloat(volumeSlider.value);
      localStorage.setItem(VOLUME_KEY, audio.volume);
    });
  }

  // --- Audio Position Restore & Save ---
  audio.addEventListener('loadedmetadata', () => {
    const saved = parseFloat(localStorage.getItem(STORAGE_KEY)) || 0;
    if (saved < audio.duration) {
      audio.currentTime = saved;
    }
    audio.play().catch(_ => {
      autoPlayBlocked = true;
      console.log('Autoplay blocked; will resume when you interact.');
    });
  });

  audio.addEventListener('timeupdate', () => {
    localStorage.setItem(STORAGE_KEY, audio.currentTime);
  });

  window.addEventListener('beforeunload', () => {
    localStorage.setItem(STORAGE_KEY, audio.currentTime);
  });

  // --- Resume on User Interaction if Blocked ---
  function resumeOnFirstInteraction() {
    if (autoPlayBlocked && audio.paused) {
      audio.play().catch(_ => { });
      autoPlayBlocked = false;
      document.removeEventListener('click', resumeOnFirstInteraction);
      document.removeEventListener('keydown', resumeOnFirstInteraction);
      document.removeEventListener('touchstart', resumeOnFirstInteraction);
    }
  }
  document.addEventListener('click', resumeOnFirstInteraction);
  document.addEventListener('keydown', resumeOnFirstInteraction);
  document.addEventListener('touchstart', resumeOnFirstInteraction);

})();

// Defensive type chart: for each defending type, what attacking types are 2x, 0.5x, 0x
const typeChart = {
  normal: { weak: ["fighting"], resist: [], immune: ["ghost"] },
  fire: { weak: ["water", "ground", "rock"], resist: ["fire", "grass", "ice", "bug", "steel", "fairy"], immune: [] },
  water: { weak: ["electric", "grass"], resist: ["fire", "water", "ice", "steel"], immune: [] },
  electric: { weak: ["ground"], resist: ["electric", "flying", "steel"], immune: [] },
  grass: { weak: ["fire", "ice", "poison", "flying", "bug"], resist: ["water", "grass", "electric", "ground"], immune: [] },
  ice: { weak: ["fire", "fighting", "rock", "steel"], resist: ["ice"], immune: [] },
  fighting: { weak: ["flying", "psychic", "fairy"], resist: ["bug", "rock", "dark"], immune: [] },
  poison: { weak: ["ground", "psychic"], resist: ["grass", "fighting", "poison", "bug", "fairy"], immune: [] },
  ground: { weak: ["water", "grass", "ice"], resist: ["poison", "rock"], immune: ["electric"] },
  flying: { weak: ["electric", "ice", "rock"], resist: ["grass", "fighting", "bug"], immune: ["ground"] },
  psychic: { weak: ["bug", "ghost", "dark"], resist: ["fighting", "psychic"], immune: [] },
  bug: { weak: ["fire", "flying", "rock"], resist: ["grass", "fighting", "ground"], immune: [] },
  rock: { weak: ["water", "grass", "fighting", "ground", "steel"], resist: ["normal", "fire", "poison", "flying"], immune: [] },
  ghost: { weak: ["ghost", "dark"], resist: ["poison", "bug"], immune: ["normal", "fighting"] },
  dragon: { weak: ["ice", "dragon", "fairy"], resist: ["fire", "water", "electric", "grass"], immune: [] },
  dark: { weak: ["fighting", "bug", "fairy"], resist: ["ghost", "dark"], immune: ["psychic"] },
  steel: { weak: ["fire", "fighting", "ground"], resist: ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"], immune: ["poison"] },
  fairy: { weak: ["poison", "steel"], resist: ["fighting", "bug", "dark"], immune: ["dragon"] }
};

// Returns an object: { type: multiplier }
function getMultipliers(defendingTypes) {
  const allTypes = Object.keys(typeChart);
  const multipliers = {};

  allTypes.forEach(attackingType => {
    let multiplier = 1;
    defendingTypes.forEach(defType => {
      if (typeChart[defType].immune.includes(attackingType)) {
        multiplier *= 0;
      } else if (typeChart[defType].weak.includes(attackingType)) {
        multiplier *= 2;
      } else if (typeChart[defType].resist.includes(attackingType)) {
        multiplier *= 0.5;
      }
    });
    multipliers[attackingType] = multiplier;
  });

  return multipliers;
}

// Example usage:
const defendingTypes = ['rock', 'dark']; // Tyranitar
const multipliers = getMultipliers(defendingTypes);

// To display super effective types (multiplier >= 2)
const superEffective = Object.entries(multipliers)
  .filter(([type, mult]) => mult >= 2)
  .map(([type, mult]) => `${type} (${mult}x)`);

// Add encounters, generation, and sprite gallery into the type-effectiveness card
function addExtraInfoToCard(pokemon) {
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

  const card = document.querySelector('.type-effectiveness');
  if (!card) return;

  // Clear previous extra info
  const existingExtra = card.querySelector('.extra-info');
  if (existingExtra) existingExtra.remove();

  // Build encounters HTML
  let encountersHTML = '<div class="encounters"><h4>Encounters</h4>';
  if (pokemon.encounters && Object.keys(pokemon.encounters).length > 0) {
    for (const area in pokemon.encounters) {
      encountersHTML += `<strong>${area}:</strong><ul>`;
      for (const version in pokemon.encounters[area]) {
        pokemon.encounters[area][version].forEach(detail => {
          encountersHTML += `<li>${version} - ${detail.method} (Lv ${detail.min_level}-${detail.max_level}, Chance: ${detail.chance}%)</li>`;
        });
      }
      encountersHTML += '</ul>';
    }
  } else {
    encountersHTML += '<p>None found</p>';
  }
  encountersHTML += '</div>';

// Generation info
let generationHTML = '';
if (pokemon.versions) {
  const genKeys = Object.keys(pokemon.versions);
  let genLabel = 'Unknown';

  // Find the first matching GEN_RANGES label
  for (const gen of GEN_RANGES) {
    if (genKeys.some(k => k.includes(gen.key))) {
      genLabel = gen.label;
      break;
    }
  }

  generationHTML = `<div class="generation"><h4>Generation</h4><p>${genLabel}</p></div>`;
}


  // Sprite gallery
  let spriteHTML = '<div class="sprite-gallery"><h4>Sprites</h4>';
  const addSpritesRecursively = (sprites, path = []) => {
    for (const key in sprites) {
      if (typeof sprites[key] === 'string') {
        spriteHTML += `<img src="${sprites[key]}" alt="${pokemon.name} ${key}" class="sprite-img">`;
      } else if (typeof sprites[key] === 'object') {
        addSpritesRecursively(sprites[key], path.concat(key));
      }
    }
  };
  if (pokemon.sprites) addSpritesRecursively(pokemon.sprites);
  spriteHTML += '</div>';

  // Wrap all extra info
  const wrapper = document.createElement('div');
  wrapper.classList.add('extra-info');
  wrapper.innerHTML = encountersHTML + generationHTML + spriteHTML;

  // Append to the card
  card.appendChild(wrapper);
}