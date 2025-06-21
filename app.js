const CLIENT_ID = '582559971955-4qancoqkve8od8ji73hefkssqj8725ic.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_KEY = 'budgetDriveFileId';

// 1. Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
