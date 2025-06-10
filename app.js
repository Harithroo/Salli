// 1. Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// 2. Load existing entries from localStorage
function render() {
  const entries = JSON.parse(localStorage.getItem('entries') || '[]');
  u('#entries').html('');

  entries.forEach((e, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${e["Date and time"]} • ${e["Account"]} • ${e["Income/Expense"]} • ${e["Description"]}: Rs${parseFloat(e["Amount"]).toFixed(2)}
      <button data-edit="${i}">✏️</button>
      <button data-delete="${i}">🗑️</button>
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

// 3. Handle new entries

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

let editingIndex = null;

function fillFormForEdit(entry, index) {
  editingIndex = index;

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

function exportEntries(type = 'csv') {
  const entries = JSON.parse(localStorage.getItem('entries') || '[]');
  if (!entries.length) {
    alert('No entries to export.');
    return;
  }

  const delimiter = type === 'tsv' ? '\t' : ',';
  const headers = [
    "Date and time", "Account", "Category", "Subcategory", "Note",
    "Income/Expense", "Description", "Currency", "Amount"
  ];

  const rows = entries.map(entry => headers.map(h => `"${(entry[h] || '').toString().replace(/"/g, '""')}"`).join(delimiter));
  const content = [headers.join(delimiter), ...rows].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `entries-${Date.now()}.${type}`;
  a.click();
}

function importEntries(file, type = 'csv') {
  const reader = new FileReader();
  const delimiter = type === 'tsv' ? '\t' : ',';

  reader.onload = function (e) {
    const lines = e.target.result.split('\n').filter(Boolean);
    const headers = lines[0].split(delimiter).map(h => h.replace(/(^"|"$)/g, '').trim());

    const newEntries = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.replace(/(^"|"$)/g, '').trim());
      const entry = {};
      headers.forEach((h, i) => entry[h] = values[i]);
      entry["Amount"] = parseFloat(entry["Amount"]);
      return entry;
    });

    const existing = JSON.parse(localStorage.getItem('entries') || '[]');
    localStorage.setItem('entries', JSON.stringify([...existing, ...newEntries]));
    alert('Entries imported!');
  };

  reader.readAsText(file);
}

u('#importFile').on('change', e => {
  const file = e.target.files[0];
  if (file) {
    const isTSV = file.name.endsWith('.tsv');
    importEntries(file, isTSV ? 'tsv' : 'csv');
  }
});

render();
