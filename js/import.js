// import
import { getData, saveData, addAccount, addCategory } from './storage.js';
import { renderHomeStats } from './render-home.js';
import { populateDropdowns } from './populate-dropdowns.js';

export function importEntries(file, type = 'csv') {
    const reader = new FileReader();
    const delimiter = type === 'tsv' ? '\t' : ',';

    reader.onload = function (e) {
        const lines = e.target.result.split('\n').filter(Boolean);
        const headers = lines[0].split(delimiter).map(h => h.replace(/(^"|"$)/g, '').trim());

        const newEntries = lines.slice(1).map(line => {
            const values = line.split(delimiter).map(v => v.replace(/(^"|"$)/g, '').trim());
            const entry = {};
            headers.forEach((h, i) => entry[h] = values[i]);
            entry["Amount"] = parseFloat(entry["Amount"]);
            return entry;
        });

        const data = getData();
        const newAccounts = new Set();
        const newCategories = new Set();
        
        // Group new entries by account and collect account/category names
        newEntries.forEach(entry => {
            const account = entry.Account;
            const category = entry.Category;
            
            if (!data.entries.accounts[account]) {
                data.entries.accounts[account] = [];
                newAccounts.add(account);
            }
            data.entries.accounts[account].push(entry);
            
            if (category) {
                newCategories.add(category);
            }
        });

        saveData(data);
        
        // Add new accounts and categories to the metadata
        newAccounts.forEach(account => addAccount(account));
        newCategories.forEach(category => addCategory(category));

        // Refresh UI
        populateDropdowns();
        renderHomeStats();
        
        alert(`Entries imported! Added ${newEntries.length} entries, ${newAccounts.size} new accounts, ${newCategories.size} new categories.`);
    };

    reader.readAsText(file);
}