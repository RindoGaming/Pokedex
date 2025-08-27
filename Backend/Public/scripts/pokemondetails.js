(function () {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get("id");
  const id = parseInt(rawId, 10);
  const detailsEl = document.getElementById("details");

  if (isNaN(id)) {
    detailsEl.innerHTML = "<p>Invalid Pokémon ID.</p>";
    return;
  }

  fetch("pokemon_cache.json")
    .then((res) => res.json())
    .then((data) => {
      let poke = data[rawId] || Object.values(data).find((p) => p.id === id);
      let baseName = null;

      // If not found in base Pokémon, check variants
      if (!poke) {
        for (const [bName, base] of Object.entries(data)) {
          if (base.variants) {
            for (const [vName, variant] of Object.entries(base.variants)) {
              if (
                variant.id === id ||
                vName.toLowerCase() === rawId?.toLowerCase()
              ) {
                poke = variant;
                baseName = bName;
                break;
              }
            }
          }
          if (poke) break;
        }
      } else {
        baseName = poke.name.toLowerCase();
      }

      if (!poke) {
        detailsEl.innerHTML = "<p>Pokémon not found.</p>";
        return;
      }

      function renderPokemon(p) {
        const types = p.types ? Object.keys(p.types).join(", ") : "N/A";
        const abilities = p.abilities
          ? Object.keys(p.abilities).join(", ")
          : "N/A";
        const height = p.height ?? "N/A";
        const weight = p.weight ?? "N/A";

        // Variant dropdown
        let variantOptions = "";
        const variants =
          baseName && data[baseName].variants ? data[baseName].variants : {};
        if (Object.keys(variants).length > 0) {
          variantOptions = `<select id="variant-select">
            <option value="">Base Form</option>
            ${Object.entries(variants)
              .map(
                ([vName, v]) =>
                  `<option value="${vName}" ${
                    vName === p.name ? "selected" : ""
                  }>${v.name}</option>`
              )
              .join("")}
          </select>`;
        }

        detailsEl.innerHTML = `
          <img src="${p.image || ""}" alt="${p.name || "Unknown"}">
          <h2>${p.name ? p.name.charAt(0).toUpperCase() + p.name.slice(1) : "N/A"}</h2>
          <p><strong>ID:</strong> ${String(p.id).padStart(3, "0")}</p>
          <p><strong>Types:</strong> ${types}</p>
          <p><strong>Abilities:</strong> ${abilities}</p>
          <p><strong>Height:</strong> ${height}</p>
          <p><strong>Weight:</strong> ${weight}</p>
          ${variantOptions}
          <div id="cry-container">
            <button style="padding: 5px;" id="prev-pokemon">Previous Pokémon</button>
            <button id="play-cry">🔊 Play Cry</button>
            <button style="padding: 5px;" id="next-pokemon">Next Pokémon</button>
            <audio id="audio-cry" preload="auto" src="${p.cry || ""}"></audio>
          </div>
        `;

        // Cry playback
        const audioEl = document.getElementById("audio-cry");
        const playBtn = document.getElementById("play-cry");
        playBtn.addEventListener("click", () => {
          audioEl.currentTime = 0;
          audioEl.play().catch((err) => console.error("Cry failed to play", err));
        });

        // Variant selector
        const variantSelect = document.getElementById("variant-select");
        if (variantSelect) {
          variantSelect.addEventListener("change", (e) => {
            const vName = e.target.value;
            if (!vName) {
              renderPokemon(data[baseName]);
            } else {
              renderPokemon(data[baseName].variants[vName]);
            }
          });
        }

        // Navigation buttons
        document.getElementById("prev-pokemon").addEventListener("click", () => {
          if (p.id > 1) window.location.href = `pokemon.html?id=${p.id - 1}`;
        });
        document.getElementById("next-pokemon").addEventListener("click", () => {
          if (p.id < 1164) window.location.href = `pokemon.html?id=${p.id + 1}`;
        });
      }

      renderPokemon(poke);
    })
    .catch((err) => {
      console.error(err);
      detailsEl.innerHTML = "<p>Error loading Pokémon data.</p>";
    });
})();
