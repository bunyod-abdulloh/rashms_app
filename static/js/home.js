// Loading state test-status.js uchun (agar u status yozsa)
const startBtn = document.getElementById('');
const testCodeInp = document.getElementById('test-code');

// Enter tugmasi bilan submit
testCodeInp?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && testCodeInp.value.trim()) {
        startBtn?.click();
    }
});

// Test-status.js loading class'ini boshqarishi uchun global helper
window.setStartBtnLoading = (loading) => {
    if (loading) {
        startBtn.classList.add('loading');
        startBtn.disabled = true;
    } else {
        startBtn.classList.remove('loading');
        startBtn.disabled = false;
    }
};