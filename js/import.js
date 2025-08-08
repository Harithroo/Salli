// import
export function importEntries(file, type = 'csv') {
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