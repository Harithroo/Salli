// Load existing entries from localStorage
let editingIndex = null;

export function getEditingIndex() {
    return editingIndex;
}

export function setEditingIndex(val) {
    editingIndex = val;
}

export function render() {
    const entries = JSON.parse(localStorage.getItem('entries') || '[]');
    u('#entries').html('');

    entries.forEach((e, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
        <div class="info">
            <span>${e["Date and time"]}</span>
            <span>${e["Account"]} • ${e["Income/Expense"]}</span>
            <span>${e["Description"]}: Rs${parseFloat(e["Amount"]).toFixed(2)}</span>
        </div>
        <div class="controls">
            <button data-edit="${i}">✏️</button>
            <button data-delete="${i}">🗑️</button>
        </div>
        `;
        u('#entries').append(li);
    });

    // Attach handlers
    u('[data-delete]').on('click', e => {
        const i = +e.target.getAttribute('data-delete');
        entries.splice(i, 1);
        localStorage.setItem('entries', JSON.stringify(entries));
        render();
    });

    u('[data-edit]').on('click', e => {
        const i = +e.target.getAttribute('data-edit');
        fillFormForEdit(entries[i], i);
    });
}

export function initRender() {
    render();
}

function fillFormForEdit(entry, index) {
    setEditingIndex(index);

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