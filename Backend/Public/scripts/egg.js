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
  // img.src = "/backend/public/stage-1.png";
    img.classList.toggle("image-shaking")
    hatchBtn.disabled = true;
    setTimeout(() => {
        hatchBtn.disabled = false;
    }, 2505);

    img.alt = "Egg";
    setTimeout(() => {
        resultDiv.textContent = "Hatching...";
        img.classList.toggle("image-shaking")
        img.src = "/backend/public/stage-3.png"
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
(function(){
  const audio      = document.getElementById('bg-music');
  const STORAGE_KEY = 'bg-music-currentTime';
  let autoPlayBlocked = false;

  // 1) Restore position and try to start as soon as metadata is ready
  audio.addEventListener('loadedmetadata', () => {
    const saved = parseFloat(localStorage.getItem(STORAGE_KEY)) || 0;
    if (saved < audio.duration) {
      audio.currentTime = saved;
    }
    audio.play().catch(_ => {
      // Autoplay was blocked, we'll resume on user gesture
      autoPlayBlocked = true;
      console.log('Autoplay blocked; will resume when you interact.');
    });
  });

  // 2) Keep saving currentTime as it plays
  audio.addEventListener('timeupdate', () => {
    localStorage.setItem(STORAGE_KEY, audio.currentTime);
  });

  // 3) Save one more time if they close/refresh mid-audio
  window.addEventListener('beforeunload', () => {
    localStorage.setItem(STORAGE_KEY, audio.currentTime);
  });

  // 4) If autoplay was blocked, resume on any user interaction
  function resumeOnFirstInteraction() {
    if (autoPlayBlocked && audio.paused) {
      audio.play().catch(_=>{});  // silent fail if still blocked
      autoPlayBlocked = false;
      // clean up listeners
      document.removeEventListener('click',      resumeOnFirstInteraction);
      document.removeEventListener('keydown',    resumeOnFirstInteraction);
      document.removeEventListener('touchstart', resumeOnFirstInteraction);
    }
  }
  document.addEventListener('click',      resumeOnFirstInteraction);
  document.addEventListener('keydown',    resumeOnFirstInteraction);
  document.addEventListener('touchstart', resumeOnFirstInteraction);

})();
const egghatch = document.getElementById('go-to');
egghatch.addEventListener("click", () => {
  location.href = 'index.html'
  console.log(`hi`);
  
})
const volumeSlider = document.getElementById('volume-slider');
const bgMusic = document.getElementById('bg-music');

if (volumeSlider && bgMusic) {

    bgMusic.volume = volumeSlider.value;
    volumeSlider.addEventListener('input', () => {
        bgMusic.volume = volumeSlider.value;
    });

    document.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play().catch(err => console.log('Autoplay blocked:', err));
        }
    }, { once: true });
}
