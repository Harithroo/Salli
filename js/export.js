// Export
import { getAllEntries } from './storage.js';

export function exportEntries(type = 'csv') {
    const entries = getAllEntries();
    if (!entries.length) {
        alert('No entries to export.');
        return;
    }

    if (type === 'wallet') {
        exportWalletCsv(entries);
        return;
    }

    const delimiter = type === 'tsv' ? '\t' : ',';
    const headers = [
        "Date and time", "Account", "Category", "Subcategory", "Note",
        "Income/Expense", "Description", "Currency", "Amount"
    ];

    const rows = entries.map(entry => headers.map(h => csvEscape(entry[h] || '', delimiter)).join(delimiter));
    const content = [headers.join(delimiter), ...rows].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `entries-${Date.now()}.${type}`;
    a.click();
}

function exportWalletCsv(entries) {
    const delimiter = ';';
    const headers = [
        'account',
        'category',
        'currency',
        'amount',
        'ref_currency_amount',
        'type',
        'payment_type',
        'payment_type_local',
        'note',
        'date',
        'gps_latitude',
        'gps_longitude',
        'gps_accuracy_in_meters',
        'warranty_in_month',
        'transfer',
        'payee',
        'labels',
        'envelope_id',
        'custom_category'
    ];

    const rows = entries.map(entry => {
        const currency = (entry.Currency || 'LKR').toString().trim() || 'LKR';
        const amount = Number(entry.Amount || 0);
        const isExpense = String(entry['Income/Expense'] || '').toLowerCase() === 'expense';
        const signedAmount = isExpense ? -Math.abs(amount) : Math.abs(amount);
        const walletType = isExpense ? 'Expenses' : 'Income';

        const walletCategory = buildWalletCategory(entry.Category || '', entry.Subcategory || '');
        const date = formatWalletDate(entry['Date and time Precise'] || entry['Date and time'] || '');
        const note = (entry.Note || '').toString();
        const payee = (entry.Description || '').toString();

        const row = {
            account: (entry.Account || '').toString(),
            category: walletCategory,
            currency,
            amount: formatWalletNumber(signedAmount),
            ref_currency_amount: formatWalletNumber(signedAmount),
            type: walletType,
            payment_type: 'CASH',
            payment_type_local: 'Cash',
            note,
            date,
            gps_latitude: '',
            gps_longitude: '',
            gps_accuracy_in_meters: '',
            warranty_in_month: '0',
            transfer: 'false',
            payee,
            labels: '',
            envelope_id: '',
            custom_category: 'false'
        };

        return headers.map(h => csvEscape(row[h] ?? '', delimiter)).join(delimiter);
    });

    const content = [headers.join(delimiter), ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wallet-report-${Date.now()}.csv`;
    a.click();
}

function buildWalletCategory(category, subcategory) {
    const c = String(category || '').trim();
    const s = String(subcategory || '').trim();
    if (!s) return c;
    return `${c}, ${s}`;
}

function formatWalletDate(raw) {
    const str = String(raw || '').trim();
    if (!str) return '';

    // Accept: YYYY-MM-DDTHH:MM, YYYY-MM-DDTHH:MM:SS(.ms), YYYY-MM-DD HH:MM:SS
    const normalized = str.includes('T') ? str : str.replace(' ', 'T');
    const match = normalized.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?/);
    if (!match) return str;

    const date = match[1];
    const hhmm = match[2];
    const sec = match[3] || '00';
    return `${date} ${hhmm}:${sec}`;
}

function formatWalletNumber(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '';
    // Wallet export uses dot-decimal with 2 digits (e.g., -1659.50)
    return num.toFixed(2);
}

function csvEscape(value, delimiter = ',') {
    const str = String(value ?? '');
    const mustQuote = str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes(delimiter);
    const escaped = str.replace(/"/g, '""');
    return mustQuote ? `"${escaped}"` : escaped;
}
