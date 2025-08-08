// navigation
export function initNav() {
    const pages = ['home', 'entries', 'entryform', 'stats', 'settings'];
    u('.nav-btn').on('click', e => {
        const page = e.target.closest('.nav-btn').getAttribute('data-page');
        pages.forEach(p => {
            u(`#page-${p}`).removeClass('active');
            u(`.nav-btn[data-page="${p}"]`).removeClass('active');
        });
        u(`#page-${page}`).addClass('active');
        u(`.nav-btn[data-page="${page}"]`).addClass('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}