function showStatus(msg, type) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.className = type === 'success' ? 'text-success' : 'text-danger';
    setTimeout(() => {
        el.textContent = '';
        el.className = '';
    }, 4000);
}

export { showStatus };
