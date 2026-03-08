// Dynamically loads HTML partials into the main app container
export function loadAllPartials(partials, callback) {
    const partialLoads = partials.map(({ id, file }) => {
        return fetch(file)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
                return res.text();
            })
            .then(html => {
                const element = document.getElementById(id);
                if (element) {
                    element.innerHTML = html;
                } else {
                    console.error(`Element with id "${id}" not found`);
                }
            })
            .catch(err => {
                console.error(err);
            });
    });

    Promise.all(partialLoads).finally(() => {
        if (typeof callback === 'function') {
            callback();
        }
    });
}
