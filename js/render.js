import { getEntriesByAccount, deleteEntry, getSetting, getEntriesWithAccounts } from './storage.js';
import { renderHomeStats } from './render-home.js';

let editingIndex = null;
let editingAccount = null;
let currentFilterType = 'all';
let currentFilterDate = new Date();

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
    const list = document.getElementById('entries');
    if (!list) return;

    list.innerHTML = '';
    const entriesToRender = getFilteredEntries().sort((a, b) => {
        const dateA = new Date(a.entry['Date and time']);
        const dateB = new Date(b.entry['Date and time']);
        return dateB - dateA;
    });

    if (entriesToRender.length === 0) {
        const emptyState = document.createElement('li');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No entries for this filter yet.';
        list.appendChild(emptyState);
        return;
    }

    const fragment = document.createDocumentFragment();
    entriesToRender.forEach(item => {
        const li = buildEntryListItem(item);
        fragment.appendChild(li);
    });

    list.appendChild(fragment);
}

export function initRender() {
    initEntryActions();
    initFilterControls();
    render();
    renderHomeStats();

    u('#lastBackupDate').text(getSetting('lastBackup') || 'Never');
    u('#lastRestoreDate').text(getSetting('lastRestore') || 'Never');
}

function buildEntryListItem(item) {
    const { entry, account, index } = item;
    const li = document.createElement('li');

    const info = document.createElement('div');
    info.className = 'info';

    const date = document.createElement('span');
    date.textContent = entry['Date and time'];

    const meta = document.createElement('span');
    meta.textContent = `${entry.Account} | ${entry['Income/Expense']}`;

    const description = document.createElement('span');
    const amount = Number.parseFloat(entry.Amount) || 0;
    description.textContent = `${entry.Description}: Rs${amount.toFixed(2)}`;

    info.append(date, meta, description);

    const controls = document.createElement('div');
    controls.className = 'controls';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'entry-action';
    editBtn.dataset.edit = String(index);
    editBtn.dataset.account = account;
    editBtn.setAttribute('aria-label', 'Edit entry');
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'entry-action delete';
    deleteBtn.dataset.delete = String(index);
    deleteBtn.dataset.account = account;
    deleteBtn.setAttribute('aria-label', 'Delete entry');
    deleteBtn.textContent = 'Delete';

    controls.append(editBtn, deleteBtn);
    li.append(info, controls);

    return li;
}

function fillFormForEdit(entry, index, account) {
    setEditingIndex(index);
    setEditingAccount(account);

    u('#datetime').first().value = entry['Date and time'];
    u('#account').first().value = entry.Account;
    u('#category').first().value = entry.Category;
    u('#subcategory').first().value = entry.Subcategory;
    u('#note').first().value = entry.Note;
    u('#type').first().value = entry['Income/Expense'];
    u('#description').first().value = entry.Description;
    u('#amount').first().value = entry.Amount;

    u('#submitBtn').text('Update');
}

function initEntryActions() {
    const list = document.getElementById('entries');
    if (!list) return;

    list.addEventListener('click', event => {
        const target = event.target.closest('button');
        if (!target) return;

        const account = target.getAttribute('data-account');
        if (!account) return;

        if (target.hasAttribute('data-delete')) {
            const index = Number.parseInt(target.getAttribute('data-delete'), 10);
            if (!Number.isNaN(index)) {
                deleteEntry(account, index);
                render();
                renderHomeStats();
            }
            return;
        }

        if (target.hasAttribute('data-edit')) {
            const index = Number.parseInt(target.getAttribute('data-edit'), 10);
            if (!Number.isNaN(index)) {
                const entries = getEntriesByAccount(account);
                if (entries[index]) {
                    fillFormForEdit(entries[index], index, account);
                }
            }
        }
    });
}

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

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const filterMonth = currentFilterDate.getMonth();
        const filterYear = currentFilterDate.getFullYear();
        hideNext = currentMonth === filterMonth && currentYear === filterYear;
    } else if (currentFilterType === 'year') {
        displayText = currentFilterDate.getFullYear().toString();
        hideNext = currentFilterDate.getFullYear() === today.getFullYear();
    } else if (currentFilterType === 'all') {
        hideNext = true;
    }

    u('#filterDisplay').text(displayText);
    u('#prevBtn').first().style.visibility = currentFilterType === 'all' ? 'hidden' : 'visible';
    u('#nextBtn').first().style.visibility = hideNext ? 'hidden' : 'visible';
    u('#nextBtn').first().disabled = hideNext;
}

function getFilteredEntries() {
    const allEntries = getEntriesWithAccounts();

    if (currentFilterType === 'all') {
        return allEntries;
    }

    const filterYear = currentFilterDate.getFullYear();
    const filterMonth = currentFilterDate.getMonth();

    return allEntries.filter(item => {
        const entryDate = new Date(item.entry['Date and time']);
        if (currentFilterType === 'month') {
            return entryDate.getFullYear() === filterYear && entryDate.getMonth() === filterMonth;
        }
        if (currentFilterType === 'year') {
            return entryDate.getFullYear() === filterYear;
        }
        return true;
    });
}
