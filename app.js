const CLIENT_ID = '582559971955-4qancoqkve8od8ji73hefkssqj8725ic.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_KEY = 'budgetDriveFileId';
const entriesKey = 'entries';

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

function initGapi() {
  // Load the gapi.client library
  gapi.load('client:auth2', () => {
    gapi.client.init({ clientId: CLIENT_ID, scope: SCOPES });
  });
}
// Called by <script src="https://apis.google.com/js/api.js">
window.onGapiLoad = initGapi;

// --------------- DRIVE FUNCTIONS --------------
async function backupToDrive() {
  const statusEl = u('#backupStatus').first();
  statusEl.textContent = 'Backing up…';

  // Ensure user is signed in
  const GoogleAuth = gapi.auth2.getAuthInstance();
  if (!GoogleAuth.isSignedIn.get()) {
    await GoogleAuth.signIn();
  }

  // Set the token for subsequent requests
  const token = GoogleAuth.currentUser.get().getAuthResponse().access_token;
  gapi.client.setToken({ access_token: token });

  // Prepare file content
  const entries = JSON.parse(localStorage.getItem(entriesKey) || '[]');
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const metadata = {
    name: 'budget-backup.json',
    mimeType: 'application/json'
  };

  const driveFileId = localStorage.getItem(DRIVE_KEY);
  let request;
  if (driveFileId) {
    // Update existing file
    request = gapi.client.drive.files.update({
      fileId: driveFileId,
      resource: metadata,
      media: { mimeType: 'application/json', body: blob }
    });
  } else {
    // Create new file
    request = gapi.client.drive.files.create({
      resource: metadata,
      media: { mimeType: 'application/json', body: blob },
      fields: 'id'
    });
  }

  try {
    const resp = await request;
    const id = resp.result.id;
    if (!driveFileId) localStorage.setItem(DRIVE_KEY, id);
    statusEl.textContent = '✅ Backup successful';
  } catch (err) {
    console.error(err);
    statusEl.textContent = '❌ Backup failed';
  }
}

// --------- HOOK UP THE BACKUP BUTTON ---------
u('#backupBtn').on('click', backupToDrive);

// ------------ BOOTSTRAP GAPI INIT -------------
// This assumes you’ve added `onload="onGapiLoad()"` to your <script> tag above,
// or simply call initGapi() once your page & gapi.js have loaded.
window.addEventListener('load', () => {
  if (window.gapi) initGapi();
});

// -------- RESTORE FROM DRIVE --------
async function restoreFromDrive() {
  const statusEl = u('#restoreStatus').first();
  statusEl.textContent = 'Restoring…';

  const GoogleAuth = gapi.auth2.getAuthInstance();
  if (!GoogleAuth.isSignedIn.get()) {
    await GoogleAuth.signIn();
  }

  const token = GoogleAuth.currentUser.get().getAuthResponse().access_token;
  gapi.client.setToken({ access_token: token });

  const driveFileId = localStorage.getItem(DRIVE_KEY);
  if (!driveFileId) {
    statusEl.textContent = '❌ No backup file found. Please backup first.';
    return;
  }

  try {
    const resp = await gapi.client.drive.files.get({
      fileId: driveFileId,
      alt: 'media'
    });

    // resp.body contains the JSON text
    const data = typeof resp.body === 'string'
      ? JSON.parse(resp.body)
      : resp.result; // fallback

    localStorage.setItem(entriesKey, JSON.stringify(data));
    render();
    statusEl.textContent = '✅ Restore successful';
  } catch (err) {
    console.error(err);
    statusEl.textContent = '❌ Restore failed';
  }
}

// Hook up the restore button
u('#restoreBtn').on('click', restoreFromDrive);

render();
