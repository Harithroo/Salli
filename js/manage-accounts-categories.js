import {
    getAccountList, addAccount, deleteAccount, updateAccount,
    getCategoryList, addCategory, deleteCategory, updateCategory
} from './storage.js';
import { populateDropdowns } from './populate-dropdowns.js';
import { renderHomeStats } from './render-home.js';
import { render } from './render.js';

export function initManageAccountsCategories() {
    u('#addAccountBtn').on('click', () => {
        const accountName = prompt('Enter account name:');
        if (accountName && accountName.trim()) {
            if (addAccount(accountName.trim())) {
                refreshAll();
                alert('Account added successfully.');
            } else {
                alert('Account already exists.');
            }
        }
    });

    u('#addCategoryBtn').on('click', () => {
        const categoryName = prompt('Enter category name:');
        if (categoryName && categoryName.trim()) {
            if (addCategory(categoryName.trim())) {
                refreshAll();
                alert('Category added successfully.');
            } else {
                alert('Category already exists.');
            }
        }
    });

    initDelegatedActions();
    renderAccountsList();
    renderCategoriesList();
}

function initDelegatedActions() {
    const accountsContainer = document.getElementById('accountsList');
    const categoriesContainer = document.getElementById('categoriesList');

    if (accountsContainer) {
        accountsContainer.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button) return;

            const oldName = button.getAttribute('data-account');
            if (!oldName) return;

            if (button.classList.contains('edit-account')) {
                const newName = prompt('Edit account name:', oldName);
                if (newName && newName.trim() && newName !== oldName) {
                    if (updateAccount(oldName, newName.trim())) {
                        refreshAll();
                        alert('Account updated successfully.');
                    } else {
                        alert('Failed to update account.');
                    }
                }
                return;
            }

            if (button.classList.contains('delete-account')) {
                if (confirm(`Delete account "${oldName}"? This will delete all entries in this account.`)) {
                    if (deleteAccount(oldName)) {
                        refreshAll();
                        alert('Account deleted successfully.');
                    } else {
                        alert('Failed to delete account.');
                    }
                }
            }
        });
    }

    if (categoriesContainer) {
        categoriesContainer.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button) return;

            const oldName = button.getAttribute('data-category');
            if (!oldName) return;

            if (button.classList.contains('edit-category')) {
                const newName = prompt('Edit category name:', oldName);
                if (newName && newName.trim() && newName !== oldName) {
                    if (updateCategory(oldName, newName.trim())) {
                        refreshAll();
                        alert('Category updated successfully.');
                    } else {
                        alert('Failed to update category.');
                    }
                }
                return;
            }

            if (button.classList.contains('delete-category')) {
                if (confirm(`Delete category "${oldName}"?`)) {
                    if (deleteCategory(oldName)) {
                        refreshAll();
                        alert('Category deleted successfully.');
                    } else {
                        alert('Failed to delete category.');
                    }
                }
            }
        });
    }
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
                <button type="button" class="btn-small edit-account" data-account="${account}" aria-label="Edit ${account}">Edit</button>
                <button type="button" class="btn-small delete delete-account" data-account="${account}" aria-label="Delete ${account}">Delete</button>
            </div>
        `;
        container.appendChild(div);
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
                <button type="button" class="btn-small edit-category" data-category="${category}" aria-label="Edit ${category}">Edit</button>
                <button type="button" class="btn-small delete delete-category" data-category="${category}" aria-label="Delete ${category}">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function refreshAll() {
    renderAccountsList();
    renderCategoriesList();
    populateDropdowns();
    render();
    renderHomeStats();
}
