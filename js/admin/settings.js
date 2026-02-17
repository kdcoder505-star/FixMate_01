document.addEventListener('DOMContentLoaded', () => {
    initTabs();
});

function initTabs() {
    const tabs = document.querySelectorAll('.settings-nav');
    const sections = document.querySelectorAll('.settings-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = tab.getAttribute('data-tab');

            // Update Tab UI
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update Section Visibility
            sections.forEach(section => {
                const sectionId = section.getAttribute('id');
                if (sectionId === `section-${targetTab}`) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            if (targetTab === 'themes') {
                renderThemeGallery();
            }
        });
    });
}

function renderThemeGallery() {
    const gallery = document.getElementById('theme-gallery');
    if (!gallery || !window.ThemeManager) return;

    const currentTheme = window.ThemeManager.getCurrentTheme();
    const themes = window.ThemeManager.themes;

    gallery.innerHTML = Object.entries(themes).map(([key, theme]) => `
        <div class="col-md-4">
            <div class="theme-card border rounded-3 p-3 text-center ${currentTheme === key ? 'border-primary shadow-sm ring-2 ring-primary ring-opacity-20' : 'bg-light'}">
                <div class="d-flex align-items-center justify-content-center mb-3">
                    <div class="rounded-circle shadow-sm" style="width: 24px; height: 24px; background: ${theme.primary}; margin-right: -8px; z-index: 2;"></div>
                    <div class="rounded-circle shadow-sm" style="width: 24px; height: 24px; background: ${theme.secondary}; z-index: 1;"></div>
                </div>
                <h6 class="fw-bold text-dark mb-2">${theme.name}</h6>
                <button class="btn ${currentTheme === key ? 'btn-primary' : 'btn-outline-secondary'} btn-sm w-100" 
                    onclick="window.ThemeManager.applyTheme('${key}'); renderThemeGallery();">
                    ${currentTheme === key ? 'Active' : 'Apply Theme'}
                </button>
            </div>
        </div>
    `).join('');
}

function openAddCategoryModal() {
    // Placeholder for category addition logic
    alert('Category management logic would be implemented here to interact with Supabase/Firebase.');
}
