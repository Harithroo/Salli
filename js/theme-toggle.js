// --- Theme Switcher ---
export function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        // Set initial theme
        if (savedTheme) {
            setTheme(savedTheme, themeToggle);
        } else {
            setTheme(prefersDark ? 'dark' : 'light', themeToggle);
        }
    }
}

function setTheme(theme, themeToggle) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Switch to light mode';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Switch to dark mode';
    }
}

function toggleTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme, themeToggle);
    localStorage.setItem('theme', newTheme);
}