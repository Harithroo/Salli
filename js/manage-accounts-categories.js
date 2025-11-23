import { 
    getAccountList, addAccount, deleteAccount, updateAccount,
    getCategoryList, addCategory, deleteCategory, updateCategory
} from './storage.js';
import { populateDropdowns } from './populate-dropdowns.js';

export function initManageAccountsCategories() {
    // Account management
    u('#addAccountBtn').on('click', () => {
        const accountName = prompt('Enter account name:');
        if (accountName && accountName.trim()) {
            if (addAccount(accountName.trim())) {
                renderAccountsList();
                populateDropdowns();
                alert('Account added successfully!');
            } else {
                alert('Account already exists!');
            }
        }
    });

    // Category management
    u('#addCategoryBtn').on('click', () => {
        const categoryName = prompt('Enter category name:');
        if (categoryName && categoryName.trim()) {
            if (addCategory(categoryName.trim())) {
                renderCategoriesList();
                populateDropdowns();
                alert('Category added successfully!');
            } else {
                alert('Category already exists!');
            }
        }
    });

    renderAccountsList();
    renderCategoriesList();
}

function renderAccountsList() {
    const accounts = getAccountList();
    const container = u('#accountsList').first();
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (accounts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--color-text); opacity: 0.6;">No accounts yet</p>';
        return;
    }

    accounts.forEach(account => {
        const div = document.createElement('div');
        div.className = 'account-category-item';
        div.innerHTML = `
            <span>${account}</span>
            <div class="actions">
                <button class="btn-small edit-account" data-account="${account}">✏️</button>
                <button class="btn-small delete-account" data-account="${account}">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Attach handlers
    u('.edit-account').on('click', e => {
        const oldName = e.target.getAttribute('data-account');
        const newName = prompt('Edit account name:', oldName);
        if (newName && newName.trim() && newName !== oldName) {
            if (updateAccount(oldName, newName.trim())) {
                renderAccountsList();
                populateDropdowns();
                alert('Account updated successfully!');
            } else {
                alert('Failed to update account!');
            }
        }
    });

    u('.delete-account').on('click', e => {
        const accountName = e.target.getAttribute('data-account');
        if (confirm(`Delete account "${accountName}"? This will delete all entries in this account.`)) {
            if (deleteAccount(accountName)) {
                renderAccountsList();
                populateDropdowns();
                alert('Account deleted successfully!');
            } else {
                alert('Failed to delete account!');
            }
        }
    });
}

function renderCategoriesList() {
    const categories = getCategoryList();
    const container = u('#categoriesList').first();
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (categories.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--color-text); opacity: 0.6;">No categories yet</p>';
        return;
    }

    categories.forEach(category => {
        const div = document.createElement('div');
        div.className = 'account-category-item';
        div.innerHTML = `
            <span>${category}</span>
            <div class="actions">
                <button class="btn-small edit-category" data-category="${category}">✏️</button>
                <button class="btn-small delete-category" data-category="${category}">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Attach handlers
    u('.edit-category').on('click', e => {
        const oldName = e.target.getAttribute('data-category');
        const newName = prompt('Edit category name:', oldName);
        if (newName && newName.trim() && newName !== oldName) {
            if (updateCategory(oldName, newName.trim())) {
                renderCategoriesList();
                populateDropdowns();
                alert('Category updated successfully!');
            } else {
                alert('Failed to update category!');
            }
        }
    });

    u('.delete-category').on('click', e => {
        const categoryName = e.target.getAttribute('data-category');
        if (confirm(`Delete category "${categoryName}"?`)) {
            if (deleteCategory(categoryName)) {
                renderCategoriesList();
                populateDropdowns();
                alert('Category deleted successfully!');
            } else {
                alert('Failed to delete category!');
            }
        }
    });
}
