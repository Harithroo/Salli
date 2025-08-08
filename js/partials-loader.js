// Dynamically loads HTML partials into the main app container
export function loadAllPartials(partials, callback) {
    let loaded = 0;
    const total = partials.length;
    partials.forEach(({ id, file }) => {
        fetch(file)
            .then(res => res.text())
            .then(html => {
                document.getElementById(id).innerHTML = html;
                loaded++;
                if (loaded === total && typeof callback === 'function') {
                    callback();
                }
            });
    });
}