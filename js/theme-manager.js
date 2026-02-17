/**
 * FixMate Theme Manager
 * Handles dynamic application of color themes.
 */

const themes = {
    'midnight-gold': {
        name: 'Midnight Gold',
        primary: '#2563eb',
        primaryHover: '#1e3a8a',
        secondary: '#d4af37',
        secondaryHover: '#b8860b',
        bgBody: '#fdfcf0',
        bgSurface: '#ffffff',
        gradientPrimary: 'linear-gradient(135deg, #0f172a 0%, #d4af37 100%)'
    },
    'amethyst-gold': {
        name: 'Amethyst & Gold',
        primary: '#4c1d95',
        primaryHover: '#5b21b6',
        secondary: '#fbbf24',
        secondaryHover: '#f59e0b',
        bgBody: '#f5f3ff',
        bgSurface: '#ffffff',
        gradientPrimary: 'linear-gradient(135deg, #4c1d95 0%, #fbbf24 100%)'
    },
    'emerald-clean': {
        name: 'Emerald Clean',
        primary: '#064e3b',
        primaryHover: '#065f46',
        secondary: '#10b981',
        secondaryHover: '#059669',
        bgBody: '#f0fdfa',
        bgSurface: '#ffffff',
        gradientPrimary: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)'
    },
    'ocean-deep': {
        name: 'Ocean Deep',
        primary: '#1e3a8a',
        primaryHover: '#1e40af',
        secondary: '#3b82f6',
        secondaryHover: '#2563eb',
        bgBody: '#eff6ff',
        bgSurface: '#ffffff',
        gradientPrimary: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
    },
    'obsidian-lime': {
        name: 'Obsidian & Lime',
        primary: '#1c1917',
        primaryHover: '#292524',
        secondary: '#bef264',
        secondaryHover: '#a3e635',
        bgBody: '#fafaf9',
        bgSurface: '#ffffff',
        gradientPrimary: 'linear-gradient(135deg, #1c1917 0%, #bef264 100%)'
    }
};

function applyTheme(themeKey) {
    const theme = themes[themeKey] || themes['midnight-gold'];
    const root = document.documentElement;

    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-hover', theme.primaryHover);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--secondary-hover', theme.secondaryHover);
    root.style.setProperty('--bg-body', theme.bgBody);
    root.style.setProperty('--bg-surface', theme.bgSurface);
    root.style.setProperty('--gradient-primary', theme.gradientPrimary);

    // Smooth transition
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    localStorage.setItem('fixmate-theme', themeKey);
}

// Auto-apply on load
(function () {
    const savedTheme = localStorage.getItem('fixmate-theme') || 'amethyst-gold';
    // Use requestAnimationFrame or DOMContentLoaded to ensure CSS variables exist
    window.addEventListener('DOMContentLoaded', () => {
        applyTheme(savedTheme);
    });
})();

// Export for switcher UI
window.ThemeManager = {
    applyTheme,
    themes,
    getCurrentTheme: () => localStorage.getItem('fixmate-theme') || 'amethyst-gold'
};
