import { loadAllPartials } from './js/partials-loader.js';
import { initRender } from './js/render.js';
import { initNav } from './js/nav.js';
import { initEntries } from './js/entries.js';
import { exportEntries } from './js/export.js';
import { importEntries } from './js/import.js';

document.addEventListener('DOMContentLoaded', () => {
    loadAllPartials([
        { id: 'home-container', file: 'partials/home.html' },
        { id: 'entries-container', file: 'partials/entries.html' },
        { id: 'entryform-container', file: 'partials/entryform.html' },
        { id: 'stats-container', file: 'partials/stats.html' },
        { id: 'settings-container', file: 'partials/settings.html' },
        { id: 'nav-container', file: 'partials/nav.html' }
    ], () => {
        initRender();
        initNav();
        initEntries();
        u('#exportCsvBtn').on('click', () => exportEntries('csv'));
        u('#exportTsvBtn').on('click', () => exportEntries('tsv'));
        u('#importFile').on('change', e => {
            const file = e.target.files[0];
            if (file) {
                const isTSV = file.name.endsWith('.tsv');
                importEntries(file, isTSV ? 'tsv' : 'csv');
            }
        });
    });
});