(function () {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('id'); // can be numeric ID or string key
  const detailsEl = document.getElementById('details');

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

        // Stats (no bullet points, no effort)
        const statsHTML = poke.stats
          ? Object.entries(poke.stats).map(([k, v]) => 
              `<p><strong>${k}:</strong> ${v.base_stat}</p>`
            ).join('')
          : '';

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

        // Extract stat values in the correct order for the chart
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
              <img src="${poke.image || 'img/Spr_3r_000.png'}" alt="${poke.name}">
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
            <p><strong>Abilities:</strong> ${abilities}</p>
            <p><strong>Height:</strong> ${poke.height || 'N/A'}</p>
            <p><strong>Weight:</strong> ${poke.weight || 'N/A'}</p>
            <p><strong>Base XP:</strong> ${poke.base_experience || 'N/A'}</p>
          </div>
        `;

        let options = {
          series: [{
            name: 'Stats',
            data: statData,
          }],
          chart: {
            height: 350,
            type: 'radar',
            toolbar: {
              show: false
            }
          },
          plotOptions: {
          radar: {
            polygons: {
              strokeColors: '#9e9e9eff',
              fill: {
                colors: ['#d2e2ffff', '#d2c7ffff']
              }
            }
          }
        },
          yaxis: {
            show: false,
            min: 0,
            max: 255
          },
          colors: ['#FF4560'],
          xaxis: {
            categories: ['HP', 'Attack', 'Defence', 'Speed', 'Sp. Def', 'Sp. Atk'],
            labels: {
            style: {
           colors: ['#000', '#000', '#000', '#000', '#000', '#000'],
          }
  }
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
          } else {
            console.warn('No cry audio available for this Pokémon.');
          }
        });

        // Navigation buttons
        document.getElementById('prev-pokemon').addEventListener('click', () => {
          const prevId = basePoke.id - 1;
          if (prevId > 0) window.location.href = `pokemon.html?id=${prevId}`;
        });
        document.getElementById('next-pokemon').addEventListener('click', () => {
          const nextId = basePoke.id + 1;
          window.location.href = `pokemon.html?id=${nextId}`;
        });

        // Variant change handling
        const variantSelect = document.getElementById('variant-select');
        if (variantSelect) {
          variantSelect.addEventListener('change', (e) => {
            const vName = e.target.value;
            let newPoke;
            if (!vName) {
              newPoke = basePoke;
            } else {
              newPoke = basePoke.variants[vName];
            }
            if (newPoke) {
              renderPokemon(newPoke);
            }
          });
        }
      }

      // Initial render
      renderPokemon(poke);
    })
    .catch(err => {
      console.error(err);
      detailsEl.innerHTML = '<p>Error loading Pokémon data.</p>';
    });
})();
