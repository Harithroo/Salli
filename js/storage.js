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
        },
        metadata: {
            accountList: [],
            categoryList: []
        }
    };
}

export function initStorage() {
    // Initialize if not exists
    try {
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultData()));
        }
    } catch (err) {
        console.error('Error initializing storage:', err);
    }
}

export function clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
    initStorage();
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

export function updateEntry(index, entry, account) {
    const data = getData();
    
    // Remove the entry from its current account
    data.entries.accounts[account].splice(index, 1);
    if (data.entries.accounts[account].length === 0) {
        delete data.entries.accounts[account];
    }

    // Add the entry to its new (or same) account
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

// Account management
export function getAccountList() {
    const data = getData();
    return data.metadata?.accountList || [];
}

export function addAccount(accountName) {
    const data = getData();
    if (!data.metadata) data.metadata = { accountList: [], categoryList: [] };
    if (!data.metadata.accountList.includes(accountName)) {
        data.metadata.accountList.push(accountName);
        saveData(data);
        return true;
    }
    return false;
}

export function deleteAccount(accountName) {
    const data = getData();
    if (!data.metadata) data.metadata = { accountList: [], categoryList: [] };
    const index = data.metadata.accountList.indexOf(accountName);
    if (index > -1) {
        data.metadata.accountList.splice(index, 1);
        // Also delete entries for this account
        if (data.entries.accounts[accountName]) {
            delete data.entries.accounts[accountName];
        }
        saveData(data);
        return true;
    }
    return false;
}

export function updateAccount(oldName, newName) {
    const data = getData();
    if (!data.metadata) data.metadata = { accountList: [], categoryList: [] };
    const index = data.metadata.accountList.indexOf(oldName);
    if (index > -1) {
        data.metadata.accountList[index] = newName;
        // Update entries with new account name
        if (data.entries.accounts[oldName]) {
            data.entries.accounts[newName] = data.entries.accounts[oldName];
            delete data.entries.accounts[oldName];
            data.entries.accounts[newName].forEach(entry => {
                entry.Account = newName;
            });
        }
        saveData(data);
        return true;
    }
    return false;
}

// Category management
export function getCategoryList() {
    const data = getData();
    return data.metadata?.categoryList || [];
}

export function addCategory(categoryName) {
    const data = getData();
    if (!data.metadata) data.metadata = { accountList: [], categoryList: [] };
    if (!data.metadata.categoryList.includes(categoryName)) {
        data.metadata.categoryList.push(categoryName);
        saveData(data);
        return true;
    }
    return false;
}

export function deleteCategory(categoryName) {
    const data = getData();
    if (!data.metadata) data.metadata = { accountList: [], categoryList: [] };
    const index = data.metadata.categoryList.indexOf(categoryName);
    if (index > -1) {
        data.metadata.categoryList.splice(index, 1);
        saveData(data);
        return true;
    }
    return false;
}

export function updateCategory(oldName, newName) {
    const data = getData();
    if (!data.metadata) data.metadata = { accountList: [], categoryList: [] };
    const index = data.metadata.categoryList.indexOf(oldName);
    if (index > -1) {
        data.metadata.categoryList[index] = newName;
        // Update entries with new category name
        Object.values(data.entries.accounts).forEach(accountEntries => {
            accountEntries.forEach(entry => {
                if (entry.Category === oldName) {
                    entry.Category = newName;
                }
            });
        });
        saveData(data);
        return true;
    }
    return false;
}