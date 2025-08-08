// --------------- DRIVE FUNCTIONS --------------

u('#backupBtn').on('click', backupToDrive);

u('#restoreBtn').on('click', restoreFromDrive);

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
