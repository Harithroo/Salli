import { getAccountList, getAllEntries } from './storage.js';

export function renderHomeStats() {
    const allEntries = getAllEntries();
    let totalIncome = 0;
    let totalExpense = 0;
    const accountBalances = new Map();

    allEntries.forEach(entry => {
        const amount = parseFloat(entry["Amount"]) || 0;
        if (entry["Income/Expense"] === "Income") {
            totalIncome += amount;
            accountBalances.set(entry.Account, (accountBalances.get(entry.Account) || 0) + amount);
        } else if (entry["Income/Expense"] === "Expense") {
            totalExpense += amount;
            accountBalances.set(entry.Account, (accountBalances.get(entry.Account) || 0) - amount);
        }
    });

    const totalBalance = totalIncome - totalExpense;
    u('.account-balance-value-amount').text(totalBalance.toFixed(2));
    u('.income-value').text(totalIncome.toFixed(2));
    u('.expense-value').text(totalExpense.toFixed(2));
    renderAccountsList(accountBalances);
}

function renderAccountsList(accountBalances) {
    const accounts = getAccountList();
    const accountsList = u('.accounts-list').first();

    if (!accountsList) return;

    accountsList.innerHTML = '';

    if (accounts.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = 'var(--color-text)';
        emptyMsg.style.opacity = '0.6';
        emptyMsg.textContent = 'No accounts yet. Add one in Settings.';
        accountsList.appendChild(emptyMsg);
        return;
    }

    const fragment = document.createDocumentFragment();
    accounts.forEach(account => {
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';

        const name = document.createElement('div');
        name.className = 'account-name';
        name.textContent = account;

        const balance = document.createElement('div');
        balance.className = 'account-balance';
        balance.textContent = (accountBalances.get(account) || 0).toFixed(2);

        accountItem.append(name, balance);
        fragment.appendChild(accountItem);
    });

    accountsList.appendChild(fragment);
}
