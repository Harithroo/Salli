const CLIENT_ID = '582559971955-4qancoqkve8od8ji73hefkssqj8725ic.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_KEY = 'budgetDriveFileId';
const entriesKey = 'entries';
const FOLDER_ID = 'salli-backup'; // TODO: Replace with actual Google Drive folder ID if using Drive API

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

// 3. Handle new entries/updates/deletes
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

// 4. Export
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

// 5. import
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

// --- GOOGLE IDENTITY SERVICES (GIS) ---
let accessToken = null;
let tokenClient = null;

window.onload = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
    },
  });
  render();
};

async function ensureSignedIn() {
  if (!accessToken) {
    return new Promise((resolve) => {
      tokenClient.callback = (tokenResponse) => {
        accessToken = tokenResponse.access_token;
        resolve();
      };
      tokenClient.requestAccessToken();
    });
  }
}

// --- Helper: Get or create the backup folder and return its ID ---
async function getOrCreateBackupFolder() {
  // Try to find the folder
  const folderListResp = await fetch(
    "https://www.googleapis.com/drive/v3/files?q=" +
    encodeURIComponent("mimeType='application/vnd.google-apps.folder' and name='salli-backup' and trashed=false"),
    { headers: { Authorization: "Bearer " + accessToken } }
  );
  const folderList = await folderListResp.json();
  if (folderList.files && folderList.files.length > 0) {
    return folderList.files[0].id;
  }
  // Create the folder if not found
  const createResp = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "salli-backup",
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const createData = await createResp.json();
  return createData.id;
}

// --- Helper: Find backup file in folder ---
async function findBackupFile(folderId) {
  const q = `name='salli-backup.json' and '${folderId}' in parents and trashed=false`;
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`,
    { headers: { Authorization: "Bearer " + accessToken } }
  );
  const data = await resp.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

// --------------- DRIVE FUNCTIONS --------------
async function backupToDrive() {
  const statusEl = u('#backupStatus').first();
  statusEl.textContent = 'Backing up…';
  await ensureSignedIn();

  const folderId = await getOrCreateBackupFolder();
  const fileId = await findBackupFile(folderId);

  const entries = JSON.parse(localStorage.getItem(entriesKey) || '[]');
  const fileContent = JSON.stringify(entries, null, 2);
  const metadata = {
    name: 'salli-backup.json',
    mimeType: 'application/json',
    parents: [folderId]
  };

  // Create multipart request body
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelim;

  try {
    let resp;
    if (fileId) {
      // Update existing file
      resp = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'multipart/related; boundary=' + boundary,
          },
          body: multipartRequestBody,
        }
      );
    } else {
      // Create new file
      resp = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'multipart/related; boundary=' + boundary,
          },
          body: multipartRequestBody,
        }
      );
    }
    if (!resp.ok) throw new Error(await resp.text());
    statusEl.textContent = '✅ Backup successful';
  } catch (err) {
    console.error(err);
    statusEl.textContent = '❌ Backup failed';
  }
}

u('#backupBtn').on('click', backupToDrive);

async function restoreFromDrive() {
  const statusEl = u('#restoreStatus').first();
  statusEl.textContent = 'Restoring…';
  try {
    // 1. Ensure we have an access token
    await ensureSignedIn();

    // 2. Get (or create) the backup folder
    const folderId = await getOrCreateBackupFolder();

    // 3. Find the backup file in that folder
    const fileId = await findBackupFile(folderId);
    if (!fileId) {
      throw new Error('No backup file found.');
    }

    // 4. Fetch the file contents
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: 'Bearer ' + accessToken } }
    );
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
    }
    const data = await resp.json();

    // 5. Save locally & re-render
    localStorage.setItem(entriesKey, JSON.stringify(data));
    render();
    statusEl.textContent = '✅ Restore successful';
  } catch (err) {
    console.error(err);
    statusEl.textContent = err.message.includes('No backup')
      ? '❌ No backup file found. Please backup first.'
      : '❌ Restore failed';
  }
}

// And hook it up:
u('#restoreBtn').on('click', restoreFromDrive);