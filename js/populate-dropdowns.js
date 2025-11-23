import { getAccountList, getCategoryList } from './storage.js';

export function populateDropdowns() {
    const accounts = getAccountList();
    const categories = getCategoryList();

    // Populate accounts dropdown
    const accountSelect = u('#account').first();
    if (accountSelect) {
        accountSelect.innerHTML = '';
        if (accounts.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No accounts available';
            option.disabled = true;
            accountSelect.appendChild(option);
        } else {
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account;
                option.textContent = account;
                accountSelect.appendChild(option);
            });
        }
    }

    // Populate categories dropdown
    const categorySelect = u('#category').first();
    if (categorySelect) {
        categorySelect.innerHTML = '';
        if (categories.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No categories available';
            option.disabled = true;
            categorySelect.appendChild(option);
        } else {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
    }
}
