    document.addEventListener("DOMContentLoaded", () => {
        const stats   = JSON.parse(localStorage.getItem('test_stats')   || '{}');
        const results = JSON.parse(localStorage.getItem('test_results') || '[]');
        const subject   = localStorage.getItem('test_subject') || '';
        const essayBall = localStorage.getItem('essay_ball')   || null;

        const total   = stats.total   || 0;
        const correct = stats.correct || 0;
        const wrong   = stats.wrong   || 0;
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

        // =====================================================
        // 🎯 Foizga qarab hero rangi va matn
        // =====================================================
        const resultIcon     = document.getElementById('result-icon');
        const resultTitle    = document.getElementById('result-title');
        const resultSubtitle = document.getElementById('result-subtitle');

        let iconClass, iconHtml, title, subtitle;
        let scoreStart, scoreEnd, heroGlow;

        if (percent >= 85) {
            iconClass = 'excellent';
            iconHtml = '<i class="bi bi-trophy-fill"></i>';
            title = 'A\'lo natija! 🎉';
            subtitle = 'Siz haqiqiy chempion!';
            scoreStart = '#10b981'; scoreEnd = '#059669';
            heroGlow = 'rgba(16, 185, 129, 0.2)';
        } else if (percent >= 65) {
            iconClass = 'good';
            iconHtml = '<i class="bi bi-star-fill"></i>';
            title = 'Yaxshi natija!';
            subtitle = 'Yana biroz mashq — a\'lo bo\'lasiz';
            scoreStart = '#3b82f6'; scoreEnd = '#2563eb';
            heroGlow = 'rgba(59, 130, 246, 0.2)';
        } else if (percent >= 40) {
            iconClass = 'average';
            iconHtml = '<i class="bi bi-hand-thumbs-up-fill"></i>';
            title = 'O\'rtacha natija';
            subtitle = 'Ko\'proq mashq qiling — muvaffaqiyat sizga yaqin!';
            scoreStart = '#f59e0b'; scoreEnd = '#d97706';
            heroGlow = 'rgba(245, 158, 11, 0.2)';
        } else {
            iconClass = 'poor';
            iconHtml = '<i class="bi bi-emoji-frown-fill"></i>';
            title = 'Yana urinib ko\'ring';
            subtitle = 'Har xato — yangi imkoniyat!';
            scoreStart = '#ef4444'; scoreEnd = '#dc2626';
            heroGlow = 'rgba(239, 68, 68, 0.2)';
        }

        resultIcon.className = `result-icon ${iconClass}`;
        resultIcon.innerHTML = iconHtml;
        resultTitle.textContent = title;
        resultSubtitle.textContent = subtitle;

        // Sahifa fonidagi glow'ni ham foizga moslashtiramiz
        document.documentElement.style.setProperty('--hero-glow', heroGlow);

        // =====================================================
        // 📊 Stats grid + progress bar
        // =====================================================
        const summary = document.getElementById('summary');
        summary.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card correct">
                    <i class="bi bi-check-circle-fill stat-icon"></i>
                    <div class="stat-value">${correct}</div>
                    <div class="stat-label">To'g'ri</div>
                </div>
                <div class="stat-card wrong">
                    <i class="bi bi-x-circle-fill stat-icon"></i>
                    <div class="stat-value">${wrong}</div>
                    <div class="stat-label">Xato</div>
                </div>
                <div class="stat-card total">
                    <i class="bi bi-list-ol stat-icon"></i>
                    <div class="stat-value">${total}</div>
                    <div class="stat-label">Jami</div>
                </div>
            </div>

            <div class="score-section" style="--score-color-start: ${scoreStart}; --score-color-end: ${scoreEnd};">
                <div class="score-header">
                    <span class="score-label">Umumiy ball</span>
                    <span class="score-percent">${percent}%</span>
                </div>
                <div class="score-bar">
                    <div class="score-bar-fill" style="width: 0%;" id="scoreBarFill"></div>
                </div>
            </div>
        `;

        // Progress bar animatsiyasi
        setTimeout(() => {
            const fill = document.getElementById('scoreBarFill');
            if (fill) fill.style.width = percent + '%';
        }, 300);

        // =====================================================
        // 🎊 Confetti
        // =====================================================
        if (percent >= 65) {
            setTimeout(() => launchConfetti(percent >= 85 ? 140 : 70), 500);
            window.tgHaptic?.success?.();
        } else if (percent >= 40) {
            window.tgHaptic?.warning?.();
        } else {
            window.tgHaptic?.error?.();
        }

        // =====================================================
        // 📝 Savollar ro'yxati
        // =====================================================
        const container = document.getElementById('results-container');
        if (results.length === 0) {
            container.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1;">
                    <div class="no-results-icon">📭</div>
                    <p>Savollar natijasi topilmadi</p>
                </div>
            `;
        } else {
            results.forEach((r, i) => {
                const div = document.createElement('div');
                div.className = `result-item ${r.is_correct ? 'correct' : 'wrong'}`;
                div.style.animationDelay = `${Math.min(i * 0.015, 0.6)}s`;
                div.innerHTML = `
                    <div class="result-item-icon">
                        <i class="bi bi-${r.is_correct ? 'check-lg' : 'x-lg'}"></i>
                    </div>
                    <div class="result-item-question">${r.question}.</div>
                    <div class="result-item-answer" title="${r.user_answer || '—'}">${r.user_answer || '—'}</div>
                `;
                container.appendChild(div);
            });

            // ⬅️ NEW: Ona tilida — esse balli eng oxirida
            if (subject === 'uzbek' && essayBall) {
                const div = document.createElement('div');
                div.className = 'result-item essay-result';
                div.style.animationDelay = `${Math.min(results.length * 0.015, 0.6)}s`;
                div.innerHTML = `
                    <div class="result-item-icon">
                        <i class="bi bi-pencil-square"></i>
                    </div>
                    <div class="result-item-question">45.</div>
                    <div class="result-item-answer" title="Esse balli: ${essayBall}">${essayBall}</div>
                `;
                container.appendChild(div);
            }

            // ⬅️ NEW: ustun bo'yicha to'ldirish (1-5 | 6-10 | ...)
            requestAnimationFrame(() => {
                const cs = getComputedStyle(container);
                const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length || 2;
                const rows = Math.ceil(container.children.length / cols);
                container.style.gridAutoFlow = 'column';
                container.style.gridTemplateRows = `repeat(${rows}, auto)`;
            });
        }

        // =====================================================
        // 🚪 Yopish tugmasi
        // =====================================================
        document.getElementById('close-btn')?.addEventListener('click', () => {
            window.tgHaptic?.medium?.();
            window.location.href = '/pupil/home/';
        });

        // =====================================================
        // 🧹 LocalStorage tozalash
        // =====================================================
        localStorage.removeItem('test_results');
        localStorage.removeItem('test_stats');
        localStorage.removeItem('test_subject');
        localStorage.removeItem('essay_ball');
    });

    // =====================================================
    // 🎊 Confetti animatsiyasi
    // =====================================================
    function launchConfetti(count = 80) {
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#fb7185'];
        const shapes = ['50%', '0%', '20%'];

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}vw;
                top: -20px;
                width: ${Math.random() * 8 + 6}px;
                height: ${Math.random() * 8 + 6}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: ${shapes[Math.floor(Math.random() * shapes.length)]};
                opacity: 0.9;
                z-index: 9999;
                pointer-events: none;
                animation: confettiFall ${Math.random() * 2 + 2.5}s linear ${Math.random() * 0.5}s forwards;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5500);
        }
    }