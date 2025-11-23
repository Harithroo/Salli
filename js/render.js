// Load existing entries from localStorage
import { getAccounts, getEntriesByAccount, deleteEntry, getSetting } from './storage.js';
import { renderHomeStats } from './render-home.js';

let editingIndex = null;
let editingAccount = null;
let currentFilterType = 'all';
let currentFilterDate = new Date(); // For month/year filtering

export function getEditingIndex() {
    return editingIndex;
}

export function setEditingIndex(val) {
    editingIndex = val;
}

export function getEditingAccount() {
    return editingAccount;
}

export function setEditingAccount(val) {
    editingAccount = val;
}

export function render() {
    u('#entries').html('');
    
    // Get filtered entries
    let entriesToRender = getFilteredEntries();
    
    // Sort by date and time (descending - newest first)
    entriesToRender.sort((a, b) => {
        const dateA = new Date(a.entry["Date and time"]);
        const dateB = new Date(b.entry["Date and time"]);
        return dateB - dateA;
    });

    // Render sorted entries
    entriesToRender.forEach((item) => {
        const e = item.entry;
        const account = item.account;
        const i = item.index;
        
        const li = document.createElement('li');
        li.innerHTML = `
        <div class="info">
            <span>${e["Date and time"]}</span>
            <span>${e["Account"]} • ${e["Income/Expense"]}</span>
            <span>${e["Description"]}: Rs${parseFloat(e["Amount"]).toFixed(2)}</span>
        </div>
        <div class="controls">
            <button data-edit="${i}" data-account="${account}">✏️</button>
            <button data-delete="${i}" data-account="${account}">🗑️</button>
        </div>
        `;
        u('#entries').append(li);
    });

    // Attach handlers
    u('[data-delete]').on('click', e => {
        const i = +e.target.getAttribute('data-delete');
        const account = e.target.getAttribute('data-account');
        deleteEntry(account, i);
        render();
        renderHomeStats();
    });

    u('[data-edit]').on('click', e => {
        const i = +e.target.getAttribute('data-edit');
        const account = e.target.getAttribute('data-account');
        const entries = getEntriesByAccount(account);
        fillFormForEdit(entries[i], i, account);
    });

    renderHomeStats();
}

export function initRender() {
    render();
    u('#lastBackupDate').text(getSetting('lastBackup') || 'Never');
    u('#lastRestoreDate').text(getSetting('lastRestore') || 'Never');
    
    // Initialize filter controls
    initFilterControls();
}

function fillFormForEdit(entry, index, account) {
    setEditingIndex(index);
    setEditingAccount(account);

    u('#datetime').first().value = entry["Date and time"];
    u('#account').first().value = entry["Account"];
    u('#category').first().value = entry["Category"];
    u('#subcategory').first().value = entry["Subcategory"];
    u('#note').first().value = entry["Note"];
    u('#type').first().value = entry["Income/Expense"];
    u('#description').first().value = entry["Description"];
    u('#amount').first().value = entry["Amount"];

    u('#submitBtn').text('Update');
}

// Filter controls
function initFilterControls() {
    u('#filterType').on('change', e => {
        currentFilterType = e.target.value;
        currentFilterDate = new Date();
        render();
        updateFilterDisplay();
    });

    u('#prevBtn').on('click', () => {
        if (currentFilterType === 'month') {
            currentFilterDate.setMonth(currentFilterDate.getMonth() - 1);
        } else if (currentFilterType === 'year') {
            currentFilterDate.setFullYear(currentFilterDate.getFullYear() - 1);
        }
        render();
        updateFilterDisplay();
    });

    u('#nextBtn').on('click', () => {
        const today = new Date();
        if (currentFilterType === 'month') {
            const nextMonth = new Date(currentFilterDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            if (nextMonth <= today) {
                currentFilterDate = nextMonth;
                render();
                updateFilterDisplay();
            }
        } else if (currentFilterType === 'year') {
            const nextYear = new Date(currentFilterDate);
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            if (nextYear.getFullYear() <= today.getFullYear()) {
                currentFilterDate = nextYear;
                render();
                updateFilterDisplay();
            }
        }
    });

    updateFilterDisplay();
}

function updateFilterDisplay() {
    const today = new Date();
    let displayText = 'All Entries';
    let hideNext = false;

    if (currentFilterType === 'month') {
        const monthYear = currentFilterDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        displayText = monthYear;
        
        // Disable next if we're viewing current month
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const filterMonth = currentFilterDate.getMonth();
        const filterYear = currentFilterDate.getFullYear();
        hideNext = currentMonth === filterMonth && currentYear === filterYear;
    } else if (currentFilterType === 'year') {
        displayText = currentFilterDate.getFullYear().toString();
        hideNext = currentFilterDate.getFullYear() === today.getFullYear();
    } else if (currentFilterType === 'all') {
        hideNext = true; // Hide next button when showing all entries
    }

    u('#filterDisplay').text(displayText);
    u('#prevBtn').first().style.visibility = currentFilterType === 'all' ? 'hidden' : 'visible';
    u('#nextBtn').first().style.visibility = hideNext ? 'hidden' : 'visible';
    u('#nextBtn').first().disabled = hideNext;
}

function getFilteredEntries() {
    const accounts = getAccounts();
    let allEntries = [];
    
    accounts.forEach(account => {
        const entries = getEntriesByAccount(account);
        entries.forEach((entry, index) => {
            allEntries.push({
                entry: entry,
                account: account,
                index: index
            });
        });
    });

    if (currentFilterType === 'all') {
        return allEntries;
    }

    const filterYear = currentFilterDate.getFullYear();
    const filterMonth = currentFilterDate.getMonth();

    return allEntries.filter(item => {
        const entryDate = new Date(item.entry["Date and time"]);
        if (currentFilterType === 'month') {
            return entryDate.getFullYear() === filterYear && entryDate.getMonth() === filterMonth;
        } else if (currentFilterType === 'year') {
            return entryDate.getFullYear() === filterYear;
        }
        return true;
    });
}