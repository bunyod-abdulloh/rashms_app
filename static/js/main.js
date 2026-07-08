import { fillTable, setupInputs, saveAnswers } from 'static/js/add_test.js';

document.addEventListener('DOMContentLoaded', () => {
    fillTable();
    setupInputs();

    document.getElementById('save-btn').addEventListener('click', saveAnswers);
});
