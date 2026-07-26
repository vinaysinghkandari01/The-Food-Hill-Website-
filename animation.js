// animation.js – Preloader, loading overlay, and scroll‑driven frame animation
// ---------------------------------------------------------------
// This script preloads 240 JPG frames from the JPGS folder,
// displays a loading overlay until all frames are ready,
// then animates the canvas based on scroll position.
// ---------------------------------------------------------------

(function(){
  console.log('animation.js loaded');
  const canvas = document.getElementById('animation-canvas');
  if (!canvas) { console.error('Canvas element not found'); return; }
  const ctx = canvas.getContext('2d');

  const TOTAL_FRAMES = 240;
  const IMG_PATH = "./JPGS/";
  const frames = new Array(TOTAL_FRAMES);
  let loaded = 0;

  const pad = (num) => String(num).padStart(3, "0");

  // Elements
  const scrollHeader = document.getElementById('scroll-header');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const scrollSection = document.getElementById('scroll-section');
  const phaseEls = {
    1: document.getElementById('phase-1'),
    2: document.getElementById('phase-2'),
    3: document.getElementById('phase-3')
  };

  const initCanvas = () => {
    // Render at 1080p resolution
    canvas.width = 1920;
    canvas.height = 1080;
    const resize = () => {
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    };
    resize();
    window.addEventListener('resize', resize);
    drawFrame(0);
  };

  const drawFrame = (index) => {
    const img = frames[index];
    if (!img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ratio = img.width / img.height;
    let drawW = canvas.width;
    let drawH = drawW / ratio;
    if (drawH > canvas.height) {
      drawH = canvas.height;
      drawW = drawH * ratio;
    }
    const dx = (canvas.width - drawW) / 2;
    const dy = (canvas.height - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
  };

  const updateLoading = () => {
    const percent = Math.round((loaded / TOTAL_FRAMES) * 100);
    if (loadingText) loadingText.textContent = `${percent}%`;
    if (percent >= 100 && loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => { if (loadingOverlay) loadingOverlay.style.display = 'none'; }, 500);
    }
  };

  const init = () => {
    initCanvas();
    window.addEventListener('scroll', onScroll);
    // Hide loading overlay now that init runs after all frames are loaded
    if (loadingOverlay) loadingOverlay.style.display = 'none';
  };

  // Preload images
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = `${IMG_PATH}ezgif-frame-${pad(i)}.jpg`;
    img.onload = () => {
      frames[i - 1] = img;
      loaded++;
      updateLoading();
      if (loaded === TOTAL_FRAMES) init();
    };
    img.onerror = () => {
      console.error('Failed to load frame', i);
      loaded++;
      updateLoading();
      if (loaded === TOTAL_FRAMES) init();
    };
  }

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (scrollSection) {
          const rect = scrollSection.getBoundingClientRect();
          const scrollTop = -rect.top;
          const sectionHeight = Math.max(scrollSection.offsetHeight - window.innerHeight, 1);
          const progress = Math.min(Math.max(scrollTop / sectionHeight, 0), 1);
          const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * TOTAL_FRAMES));
          drawFrame(frameIdx);

          const phase = progress < 0.33 ? 1 : progress < 0.66 ? 2 : 3;
          Object.values(phaseEls).forEach(el => el && el.classList.remove('active'));
          if (phaseEls[phase]) phaseEls[phase].classList.add('active');

          if (scrollHeader) {
            if (progress >= 0.3) {
              scrollHeader.classList.add('hidden');
            } else {
              scrollHeader.classList.remove('hidden');
            }
          }

          const topBar = document.getElementById('scroll-progress-bar');
          if (topBar) topBar.style.width = (progress * 100) + '%';
        }
        ticking = false;
      });
      ticking = true;
    }
  };
})();
