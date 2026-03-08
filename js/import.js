// import
import { getData, saveData } from './storage.js';
import { renderHomeStats } from './render-home.js';
import { populateDropdowns } from './populate-dropdowns.js';
import { render } from './render.js';

export function importEntries(file, type = 'csv') {
    const reader = new FileReader();

    reader.onload = function (e) {
        const rawText = e.target.result || '';
        const lines = rawText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .filter(line => line.trim().length > 0);

        if (!lines.length) {
            alert('Import file is empty.');
            return;
        }

        const delimiter = type === 'tsv' ? '\t' : detectDelimiter(lines[0]);
        const headers = parseDelimitedLine(lines[0], delimiter).map(h => normalizeHeader(h));

        const parsedEntries = [];
        const invalidRows = [];
        lines.slice(1).forEach((line, index) => {
            const values = parseDelimitedLine(line, delimiter);
            if (!values.length) return;
            const row = {};
            headers.forEach((h, i) => {
                row[h] = (values[i] || '').trim();
            });
            const mapped = mapRowToEntry(row);
            if (mapped.entry) {
                parsedEntries.push({ entry: mapped.entry, lineNumber: index + 2 });
            } else {
                invalidRows.push({
                    lineNumber: index + 2,
                    reason: mapped.error || 'Invalid row',
                    raw: line
                });
            }
        });

        if (!parsedEntries.length) {
            alert('No valid rows found to import.');
            return;
        }

        const data = getData();
        if (!data.metadata) {
            data.metadata = { accountList: [], categoryList: [] };
        }
        if (!Array.isArray(data.metadata.accountList)) {
            data.metadata.accountList = [];
        }
        if (!Array.isArray(data.metadata.categoryList)) {
            data.metadata.categoryList = [];
        }
        if (!data.entries?.accounts) {
            data.entries = { accounts: {} };
        }

        const accountList = new Set(data.metadata.accountList);
        const categoryList = new Set(data.metadata.categoryList);
        const newAccounts = new Set();
        const newCategories = new Set();

        const existingSignatures = new Set();
        Object.values(data.entries.accounts).forEach(entries => {
            entries.forEach(entry => {
                existingSignatures.add(getDedupSignature(entry));
            });
        });

        let importedCount = 0;
        const duplicateRows = [];

        parsedEntries.forEach(({ entry, lineNumber }) => {
            const signature = getDedupSignature(entry);
            if (existingSignatures.has(signature)) {
                duplicateRows.push({
                    lineNumber,
                    reason: 'Duplicate signature already exists',
                    raw: `${entry['Date and time']};${entry.Account};${entry.Category};${entry['Income/Expense']};${entry.Description};${entry.Amount}`
                });
                return;
            }
            existingSignatures.add(signature);

            const account = entry.Account;
            const category = entry.Category;

            if (!data.entries.accounts[account]) {
                data.entries.accounts[account] = [];
            }
            data.entries.accounts[account].push(entry);

            if (!accountList.has(account)) {
                accountList.add(account);
                newAccounts.add(account);
            }

            if (category && !categoryList.has(category)) {
                categoryList.add(category);
                newCategories.add(category);
            }

            importedCount++;
        });

        data.metadata.accountList = Array.from(accountList);
        data.metadata.categoryList = Array.from(categoryList);
        saveData(data);

        populateDropdowns();
        render();
        renderHomeStats();

        const invalidCount = invalidRows.length;
        const duplicateCount = duplicateRows.length;
        if (invalidCount > 0 || duplicateCount > 0) {
            downloadSkipReport([...duplicateRows, ...invalidRows]);
        }

        alert(
            `Import complete. Added ${importedCount} entries, skipped ${duplicateCount} duplicates and ${invalidCount} invalid rows. ` +
            `Created ${newAccounts.size} new accounts and ${newCategories.size} new categories.`
        );
    };

    reader.readAsText(file);
}

function detectDelimiter(headerLine) {
    const delimiters = [';', '\t', ','];
    let best = ',';
    let maxParts = 0;

    delimiters.forEach(delimiter => {
        const parts = parseDelimitedLine(headerLine, delimiter).length;
        if (parts > maxParts) {
            maxParts = parts;
            best = delimiter;
        }
    });

    return best;
}

function parseDelimitedLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (ch === delimiter && !inQuotes) {
            values.push(current.trim());
            current = '';
            continue;
        }

        current += ch;
    }

    values.push(current.trim());
    return values;
}

function normalizeHeader(header) {
    return header
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
}

function mapRowToEntry(row) {
    const account = (row.account || row['account_name'] || row['Account'] || '').trim();
    const category = (row.category || row['Category'] || '').trim();
    const rawAmount = row.amount || row['Amount'];
    const amount = parseAmount(rawAmount);
    const incomeExpense = normalizeType(row.type || row['income/expense'] || row['Income/Expense'], amount);
    const dateTime = normalizeDateTimeForStorage(row.date || row['date_and_time'] || row['Date and time']);
    const preciseDateTime = normalizeDateTimeForDedup(row.date || row['date_and_time'] || row['Date and time']);
    const note = (row.note || row['Note'] || '').trim();
    const payee = (row.payee || '').trim();
    const description = (row.description || row['Description'] || note || payee || category || 'Imported entry').trim();
    const subcategory = (row.subcategory || row['Subcategory'] || '').trim();
    const currency = (row.currency || row['Currency'] || 'LKR').trim() || 'LKR';

    if (!account) return { entry: null, error: 'Missing account' };
    if (!category) return { entry: null, error: 'Missing category' };
    if (!incomeExpense) return { entry: null, error: 'Missing/invalid type' };
    if (!Number.isFinite(amount)) return { entry: null, error: 'Invalid amount' };
    if (!dateTime || !preciseDateTime) return { entry: null, error: 'Invalid date' };

    return {
        entry: {
            "Date and time": dateTime,
            "Date and time Precise": preciseDateTime,
            "Account": account,
            "Category": category,
            "Subcategory": subcategory,
            "Note": note,
            "Income/Expense": incomeExpense,
            "Description": description,
            "Currency": currency,
            "Amount": Math.abs(amount)
        }
    }
}

function parseAmount(rawAmount) {
    if (typeof rawAmount === 'number') return rawAmount;
    if (!rawAmount) return NaN;
    const normalized = String(rawAmount).replace(/,/g, '').trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeType(type, amount) {
    const raw = String(type || '').trim().toLowerCase();
    if (raw === 'income') return 'Income';
    if (raw === 'expense' || raw === 'expenses') return 'Expense';
    if (Number.isFinite(amount)) {
        return amount < 0 ? 'Expense' : 'Income';
    }
    return '';
}

function normalizeDateTimeForStorage(rawDateTime) {
    if (!rawDateTime) return '';
    const precise = normalizeDateTimeForDedup(rawDateTime);
    if (!precise) return '';
    return precise.slice(0, 16);
}

function normalizeDateTimeForDedup(rawDateTime) {
    if (!rawDateTime) return '';
    const raw = String(rawDateTime).trim().replace(' ', 'T');
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2})(\.\d{1,3})?)?/);
    if (!match) return '';

    const date = match[1];
    const hhmm = match[2];
    const sec = match[3] ? `:${match[3]}` : ':00';
    const ms = match[4] || '';
    return `${date}T${hhmm}${sec}${ms}`;
}

function getDedupSignature(entry) {
    return [
        entry['Date and time Precise'] || entry['Date and time'] || '',
        entry.Account || '',
        entry.Category || '',
        entry['Income/Expense'] || '',
        entry.Description || '',
        entry.Amount || ''
    ].join('|');
}

function downloadSkipReport(skippedRows) {
    const headers = ['line_number', 'reason', 'raw'];
    const rows = skippedRows.map(row => [
        row.lineNumber,
        csvEscape(row.reason),
        csvEscape(row.raw)
    ].join(','));
    const content = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `import-skipped-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function csvEscape(value) {
    const str = String(value ?? '');
    return `"${str.replace(/"/g, '""')}"`;
}
