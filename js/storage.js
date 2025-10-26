// Storage management
const STORAGE_KEY = 'salli_data';

function getDefaultData() {
    return {
        entries: {
            accounts: {}
        },
        settings: {
            theme: 'light',
            lastBackup: null,
            lastRestore: null
        }
    };
}

export function initStorage() {
    // Initialize if not exists
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultData()));
    }

    // Migrate old data if exists
    migrateOldData();
}

function migrateOldData() {
    const oldEntries = localStorage.getItem('entries');
    const oldTheme = localStorage.getItem('theme');
    const oldLastBackup = localStorage.getItem('lastBackupDate');
    const oldLastRestore = localStorage.getItem('lastRestoreDate');

    if (oldEntries || oldTheme || oldLastBackup || oldLastRestore) {
        const data = getData();

        if (oldEntries) {
            const entries = JSON.parse(oldEntries);
            // Group entries by account
            entries.forEach(entry => {
                const account = entry.Account;
                if (!data.entries.accounts[account]) {
                    data.entries.accounts[account] = [];
                }
                data.entries.accounts[account].push(entry);
            });
        }

        if (oldTheme) data.settings.theme = oldTheme;
        if (oldLastBackup) data.settings.lastBackup = oldLastBackup;
        if (oldLastRestore) data.settings.lastRestore = oldLastRestore;

        saveData(data);

        // Clean up old storage
        localStorage.removeItem('entries');
        localStorage.removeItem('theme');
        localStorage.removeItem('lastBackupDate');
        localStorage.removeItem('lastRestoreDate');
    }
}

export function getData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultData();
}

export function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAllEntries() {
    const data = getData();
    return Object.values(data.entries.accounts).flat();
}

export function getEntriesByAccount(account) {
    const data = getData();
    return data.entries.accounts[account] || [];
}

export function getAccounts() {
    const data = getData();
    return Object.keys(data.entries.accounts);
}

export function addEntry(entry) {
    const data = getData();
    if (!data.entries.accounts[entry.Account]) {
        data.entries.accounts[entry.Account] = [];
    }
    data.entries.accounts[entry.Account].push(entry);
    saveData(data);
}

export function updateEntry(index, entry, oldAccount) {
    const data = getData();
    
    // Remove from old account
    if (oldAccount) {
        const oldEntries = data.entries.accounts[oldAccount];
        oldEntries.splice(index, 1);
        if (oldEntries.length === 0) {
            delete data.entries.accounts[oldAccount];
        }
    }

    // Add to new/same account
    if (!data.entries.accounts[entry.Account]) {
        data.entries.accounts[entry.Account] = [];
    }
    data.entries.accounts[entry.Account].push(entry);
    
    saveData(data);
}

export function deleteEntry(account, index) {
    const data = getData();
    data.entries.accounts[account].splice(index, 1);
    if (data.entries.accounts[account].length === 0) {
        delete data.entries.accounts[account];
    }
    saveData(data);
}

export function getSetting(key) {
    const data = getData();
    return data.settings[key];
}

export function setSetting(key, value) {
    const data = getData();
    data.settings[key] = value;
    saveData(data);
}