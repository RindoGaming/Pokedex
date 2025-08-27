(function () {
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get('id');
    const id = parseInt(rawId, 10);
    const detailsEl = document.getElementById('details');

    if (isNaN(id)) {
      detailsEl.innerHTML = '<p>Invalid Pokémon ID.</p>';
      return;
    }

    fetch('pokemon_cache.json')
      .then(res => res.json())
      .then(data => {
        let poke = data[rawId] || Object.values(data).find(p => p.id === id);

        if (!poke) {
          detailsEl.innerHTML = '<p>Pokémon not found.</p>';
          return;
        }

        const types = poke.types ? Object.keys(poke.types).join(', ') : 'N/A';
        const abilities = poke.abilities ? Object.keys(poke.abilities).join(', ') : 'N/A';
        const height = poke.height ?? 'N/A';
        const weight = poke.weight ?? 'N/A';

        // Variant handling
        const baseName = poke.baseName || poke.name;
        const variants = data[baseName] && data[baseName].variants ? data[baseName].variants : {};
        let variantOptions = "";
        if (Object.keys(variants).length > 0) {
          variantOptions = `<select id="variant-select">
            <option value="">Base Form</option>
            ${Object.entries(variants)
              .map(([vName, v]) =>
                `<option value="${vName}"${vName === poke.name ? " selected" : ""}>${v.name.charAt(0).toUpperCase() + v.name.slice(1)}</option>`
              )
              .join("")}
          </select>`;
        }

        detailsEl.innerHTML = `
          <div class="half">
            <div class="namesection">
              <h1>${poke.name ? poke.name.charAt(0).toUpperCase() + poke.name.slice(1) : 'N/A'}</h1>
              <p><strong>ID:</strong> ${String(id).padStart(3, '0')}</p>
            </div>
            
            <div class="pokemon-image-bg">
              <img src="${poke.image || ''}" alt="${poke.name || 'Unknown'}">
            </div>
            <div id="cry-container">
            <button style="padding: 5px;" id="prev-pokemon">⬅ Previous Pokémon</button>
            <button id="play-cry">🔊 Play Cry</button>
            <button style="padding: 5px;" id="next-pokemon">Next Pokémon➡ </button>
            <audio id="audio-cry" preload="auto" src="${poke.cry || ''}"></audio>
          </div>
          </div>
          <div class="half">
          <div class="chart">
            <canvas id="statsChart"></canvas>
          </div>
          ${variantOptions}
          <p><strong>Types:</strong> ${types}</p>
          <p><strong>Abilities:</strong> ${abilities}</p>
          <p><strong>Height:</strong> ${height}</p>
          <p><strong>Weight:</strong> ${weight}</p>
          </div>
        `;

        // Audio playback
        const audioEl = document.getElementById('audio-cry');
        const playBtn = document.getElementById('play-cry');
        playBtn.addEventListener('click', () => {
          audioEl.currentTime = 0;
          audioEl.play().catch(err => console.error('Cry failed to play', err));
        });

        // Navigation buttons
        document.getElementById('prev-pokemon').addEventListener('click', () => {
          if (id > 1) window.location.href = `pokemon.html?id=${id - 1}`;
        });

        document.getElementById('next-pokemon').addEventListener('click', () => {
          if (id < 1025) window.location.href = `pokemon.html?id=${id + 1}`;
        });

        // Variant change handling
        const variantSelect = document.getElementById("variant-select");
        if (variantSelect) {
          variantSelect.addEventListener("change", (e) => {
            const vName = e.target.value;
            if (!vName) {
              // Render base form
              window.location.href = `pokemon.html?id=${data[baseName].id}`;
            } else {
              // Render selected variant
              window.location.href = `pokemon.html?id=${variants[vName].id}`;
            }
          });
        }
      })
      .catch(err => {
        console.error(err);
        detailsEl.innerHTML = '<p>Error loading Pokémon data.</p>';
      });
  })();