import { getAccountList, getEntriesByAccount, getAllEntries } from './storage.js';

export function renderHomeStats() {
    renderAccountBalance();
    renderIncomeExpense();
    renderAccountsList();
}

function renderAccountBalance() {
    const allEntries = getAllEntries();
    
    let totalBalance = 0;
    allEntries.forEach(entry => {
        if (entry["Income/Expense"] === "Income") {
            totalBalance += parseFloat(entry["Amount"]) || 0;
        } else if (entry["Income/Expense"] === "Expense") {
            totalBalance -= parseFloat(entry["Amount"]) || 0;
        }
    });

    u('.account-balance-value-amount').text(totalBalance.toFixed(2));
}

function renderIncomeExpense() {
    const allEntries = getAllEntries();
    
    let totalIncome = 0;
    let totalExpense = 0;

    allEntries.forEach(entry => {
        const amount = parseFloat(entry["Amount"]) || 0;
        if (entry["Income/Expense"] === "Income") {
            totalIncome += amount;
        } else if (entry["Income/Expense"] === "Expense") {
            totalExpense += amount;
        }
    });

    u('.income-value').text(totalIncome.toFixed(2));
    u('.expense-value').text(totalExpense.toFixed(2));
}

function renderAccountsList() {
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

    accounts.forEach(account => {
        const entries = getEntriesByAccount(account);
        
        let accountBalance = 0;
        entries.forEach(entry => {
            const amount = parseFloat(entry["Amount"]) || 0;
            if (entry["Income/Expense"] === "Income") {
                accountBalance += amount;
            } else if (entry["Income/Expense"] === "Expense") {
                accountBalance -= amount;
            }
        });

        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';
        accountItem.innerHTML = `
            <div class="account-name">${account}</div>
            <div class="account-balance">${accountBalance.toFixed(2)}</div>
        `;
        accountsList.appendChild(accountItem);
    });
}
