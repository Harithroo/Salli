// navigation
export function initNav() {
    const navButtons = Array.from(document.querySelectorAll('.nav-btn[data-page]'));
    const pages = navButtons.map(btn => btn.getAttribute('data-page')).filter(Boolean);

    u('.nav-btn').on('click', e => {
        const button = e.target.closest('.nav-btn[data-page]');
        if (!button) return;

        const page = button.getAttribute('data-page');
        pages.forEach(p => {
            u(`#page-${p}`).removeClass('active');
            const navButton = document.querySelector(`.nav-btn[data-page="${p}"]`);
            if (navButton) {
                navButton.classList.remove('active');
                navButton.removeAttribute('aria-current');
            }
        });

        u(`#page-${page}`).addClass('active');
        button.classList.add('active');
        button.setAttribute('aria-current', 'page');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
