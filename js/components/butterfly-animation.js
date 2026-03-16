// js/components/butterfly-animation.js — replaces Angular ButterflyAnimationComponent
// Simplified version that handles the fly-and-park animation

let overlayEl = null;
let butterflyEl = null;
let isVisible = false;
let isParked = false;
let currentX = 0;
let currentY = 0;
let currentRotation = 0;
let animationFrameId = null;

export function initButterflyOverlay() {
  overlayEl = document.createElement('div');
  overlayEl.className = 'butterfly-overlay';
  overlayEl.innerHTML = '';
  document.body.appendChild(overlayEl);
}

export function triggerButterflyAnimation(targetSelector) {
  if (!overlayEl) return;

  // Create butterfly image
  const img = document.createElement('img');
  img.className = 'butterfly';
  img.src = 'assets/images/WOW_Schmetterling_Oben_No_BG.png';
  img.alt = 'Butterfly';
  img.style.pointerEvents = 'auto';
  img.style.cursor = 'pointer';

  overlayEl.innerHTML = '';
  overlayEl.appendChild(img);
  butterflyEl = img;
  isVisible = true;
  isParked = false;
  overlayEl.classList.remove('parked');

  // Start from random position off-screen
  const startX = Math.random() * window.innerWidth;
  const startY = -80;
  currentX = startX;
  currentY = startY;

  // Find target element
  const targetEl = targetSelector ? document.querySelector(targetSelector) : null;
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;

  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    targetX = rect.left + rect.width / 2 - 30;
    targetY = rect.top - 25;
  }

  // Animate towards target
  const duration = 2000;
  const startTime = performance.now();

  function animate(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

    // Add some wave motion
    const wave = Math.sin(progress * Math.PI * 4) * 30;

    currentX = startX + (targetX - startX) * eased + wave;
    currentY = startY + (targetY - startY) * eased;
    currentRotation = Math.sin(progress * Math.PI * 6) * 15;

    if (butterflyEl) {
      butterflyEl.style.left = currentX + 'px';
      butterflyEl.style.top = currentY + 'px';
      butterflyEl.style.transform = `rotate(${currentRotation}deg)`;
    }

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // Arrived - park the butterfly
      isParked = true;
      if (butterflyEl) {
        butterflyEl.classList.add('arriving');
        setTimeout(() => {
          if (butterflyEl) {
            butterflyEl.classList.remove('arriving');
            butterflyEl.classList.add('parked');
            overlayEl.classList.add('parked');
          }
        }, 500);
      }

      // Click to dismiss
      butterflyEl?.addEventListener('click', () => {
        dismissButterfly();
      });
    }
  }

  animationFrameId = requestAnimationFrame(animate);
}

export function dismissButterfly() {
  if (overlayEl) overlayEl.innerHTML = '';
  isVisible = false;
  isParked = false;
  overlayEl?.classList.remove('parked');
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
