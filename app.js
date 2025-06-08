// 1. Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// 2. Load existing entries from localStorage
const entries = JSON.parse(localStorage.getItem('entries') || '[]');
function render() {
  u('#entries').html('');
  entries.forEach(e => {
    const li = document.createElement('li');
    li.textContent = `${e.desc}: $${e.amount.toFixed(2)}`;
    u('#entries').append(li);
  });
}
render();

// 3. Handle new entries
u('#entryForm').on('submit', ev => {
  ev.preventDefault();
  const d = u('#desc').first().value;
  const a = parseFloat(u('#amount').first().value);
  entries.push({ desc: d, amount: a });
  localStorage.setItem('entries', JSON.stringify(entries));
  render();
  ev.target.reset();
});