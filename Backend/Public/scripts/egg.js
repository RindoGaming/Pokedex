const hatchBtn = document.getElementById('hatch-btn');
const resultDiv = document.getElementById('result');
const img = document.getElementById('pokemon-img');
const hatchCountDiv = document.getElementById('hatch-count');
const historyDiv = document.getElementById('history');
const pokemon = document.getElementById('reveal-pokemon')
const reveal = document.getElementById('reveal');
const audioEl = document.getElementById('audio-cry');
const eggcracking = document.getElementById('egg-cracking')

let hatchCount = 0;
const hatchHistory = {};

hatchBtn.onclick = async function () {
    img.classList.toggle("image-shaking")
    hatchBtn.disabled = true;
    setTimeout(() => {
        hatchBtn.disabled = false;
    }, 2505);

    img.src = "img/Gebarsten Ei met Groene Vlekken.png";
    img.alt = "Egg";
    setTimeout(() => {
        resultDiv.textContent = "Hatching...";
        img.classList.toggle("image-shaking")
        img.src = "/backend/public/egg/stage-3.png"
    }, 2000);
    const id = Math.floor(Math.random() * 1025) + 1;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) throw new Error("Failed to fetch Pokémon");
        const data = await res.json();
        audioEl.src = data.cries.latest;
        setTimeout(() => {
            reveal.classList.toggle("hidden");
            const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
            const sprite = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;

            if (!sprite) throw new Error("No sprite available");
            pokemon.classList.toggle("hidden");
            pokemon.src = sprite
            img.src = sprite;
            img.alt = name;
            resultDiv.textContent = `🎉 You hatched a ${name}!`;
            audioEl.currentTime = 0;
            audioEl.play().catch(err => console.error('Cry failed to play', err));


            hatchCount++;
            hatchCountDiv.textContent = hatchCount;

            if (!hatchHistory[name]) {
                hatchHistory[name] = { count: 1, sprite };
            } else {
                hatchHistory[name].count++;
            }
            setTimeout(() => {
                reveal.classList.toggle("hidden");
                pokemon.classList.toggle("hidden");
            }, 1500);
            updateHistory();
        }, 2000);
        setTimeout(() => {
            eggcracking.currentTime = 0;
            eggcracking.play().catch(err => console.error('Cry failed to play', err));
        }, 200);
        setTimeout(() => {
            eggcracking.currentTime = 0;
            eggcracking.play().catch(err => console.error('Cry failed to play', err));
        }, 700);
         setTimeout(() => {
            eggcracking.currentTime = 0;
            eggcracking.play().catch(err => console.error('Cry failed to play', err));
        }, 1200);


    } catch (e) {
        img.src = "egg.png";
        img.alt = "Egg";
        resultDiv.textContent = "❌ Failed to hatch! Try again.";
    }

};

function updateHistory() {
    historyDiv.innerHTML = "";

    const hasHistory = Object.keys(hatchHistory).length > 0;

    if (hasHistory) {
        historyDiv.style.display = "grid";
        historyDiv.classList.add('history-grid');
        for (const [name, data] of Object.entries(hatchHistory)) {
            const item = document.createElement('div');
            item.className = 'history-item';

            item.innerHTML = `
                        <img src="${data.sprite}" alt="${name}">
                        <span>${name}</span>
                        <div class="count">Hatched ${data.count} time${data.count > 1 ? 's' : ''}</div>
                    `;
            historyDiv.appendChild(item);
        }
    } else {
        historyDiv.style.display = "none";
        historyDiv.classList.remove('history-grid');
    }
}