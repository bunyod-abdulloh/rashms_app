/* =========================================================
   ✨ PREMIUM EFFECTS
   Cursor spotlight, ripple, confetti, 3D tilt, scroll navbar
   Ishlatish: <script src="{% static 'js/premium-effects.js' %}"></script>
   ========================================================= */

(() => {
  'use strict';

  // Motion-reduced foydalanuvchilar uchun
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // =========================================================
  // 1. 🖱️ CURSOR SPOTLIGHT — sichqoncha ortidan yorug'lik
  // =========================================================
  const spotlight = document.createElement('div');
  spotlight.className = 'cursor-spotlight';
  document.body.prepend(spotlight);

  let rafId = null;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);
      rafId = null;
    });
  }, { passive: true });

  // =========================================================
  // 2. 💧 RIPPLE EFFECT — tugmalar bosilganda to'lqin
  // =========================================================
  document.addEventListener('click', (e) => {
    const target = e.target.closest('#save-btn, .btn-plus, .btn-minus, .bottom-nav a');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // Position kontexti bo'lishi shart
    if (getComputedStyle(target).position === 'static') {
      target.style.position = 'relative';
    }

    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // =========================================================
  // 3. 🎊 CONFETTI — muvaffaqiyatli saqlashda otishma
  // =========================================================
  window.launchConfetti = function launchConfetti(count = 60) {
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#fb7185'];
    const shapes = ['50%', '0%', '20%'];

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)];
      confetti.style.width = confetti.style.height = `${Math.random() * 8 + 6}px`;
      confetti.style.animationDuration = `${Math.random() * 2 + 2.5}s`;
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.opacity = 0.9;

      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 5000);
    }
  };

  // Status success bo'lganida avtomatik confetti
  const statusEl = document.getElementById('status');
  if (statusEl) {
    const observer = new MutationObserver(() => {
      if (statusEl.classList.contains('alert-success') || statusEl.textContent.includes('✅')) {
        window.launchConfetti(80);
      }
    });
    observer.observe(statusEl, { attributes: true, childList: true, subtree: true });
  }

  // =========================================================
  // 4. 🎯 3D TILT — kartochkalar sichqonchaga qarab og'adi
  // =========================================================
  const tiltCards = document.querySelectorAll('.glass-card, .question-block');
  const isTouchDevice = 'ontouchstart' in window;

  if (!isTouchDevice) {
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -4; // max 4deg
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // =========================================================
  // 5. 📜 SCROLL — top navbar zichlashadi
  // =========================================================
  const topNavbar = document.querySelector('.top-navbar');
  if (topNavbar) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 20) {
            topNavbar.classList.add('scrolled');
          } else {
            topNavbar.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // =========================================================
  // 6. 📊 PROGRESS RING — savollar to'ldirilishini kuzatish
  // =========================================================
  window.updateProgressRing = function updateProgressRing() {
    const ring = document.querySelector('.progress-ring .fg');
    const label = document.querySelector('.progress-ring .label');
    if (!ring || !label) return;

    const questions = document.querySelectorAll('.question-block');
    const total = questions.length;
    if (total === 0) return;

    let filled = 0;
    questions.forEach(q => {
      const hasChecked = q.querySelector('input[type="radio"]:checked, input[type="checkbox"]:checked');
      const hasText = Array.from(q.querySelectorAll('input[type="text"], textarea'))
        .some(inp => inp.value.trim().length > 0);
      if (hasChecked || hasText) filled++;
    });

    const percent = filled / total;
    const dashOffset = 176 - (176 * percent);
    ring.style.strokeDashoffset = dashOffset;
    label.textContent = `${filled}/${total}`;
  };

  // Har qanday inputda o'zgartirilganda progress'ni yangilaymiz
  document.addEventListener('change', () => window.updateProgressRing());
  document.addEventListener('input', () => window.updateProgressRing());
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-plus, .btn-minus')) {
      setTimeout(() => window.updateProgressRing(), 50);
    }
  });

  // =========================================================
  // 7. ⌨️ KEYBOARD SHORTCUT — Ctrl+S / Cmd+S bilan saqlash
  // =========================================================
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const saveBtn = document.getElementById('save-btn');
      if (saveBtn && !saveBtn.disabled) saveBtn.click();
    }
  });

})();