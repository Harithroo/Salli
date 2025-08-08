import { initRender } from './js/render.js';
import { initNav } from './js/nav.js';
import { initEntries } from './js/entries.js';
import { exportEntries } from './js/export.js';
import { importEntries } from './js/import.js';

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