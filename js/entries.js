// Handle new entries/updates/deletes
export function initEntries() {
    u('#entryForm').on('submit', ev => {
        ev.preventDefault();
        const all = JSON.parse(localStorage.getItem('entries') || '[]');

        const entry = {
            "Date and time": u('#datetime').first().value,
            "Account": u('#account').first().value,
            "Category": u('#category').first().value,
            "Subcategory": u('#subcategory').first().value,
            "Note": u('#note').first().value,
            "Income/Expense": u('#type').first().value,
            "Description": u('#description').first().value,
            "Currency": "LKR",
            "Amount": parseFloat(u('#amount').first().value)
        };

        if (editingIndex !== null) {
            all[editingIndex] = entry;
            editingIndex = null;
            u('#submitBtn').text('Add');
            alert('Entry updated!');
        } else {
            alert('Entry added!');
            all.push(entry);
        }

        localStorage.setItem('entries', JSON.stringify(all));
        render();
        ev.target.reset();
    });
}