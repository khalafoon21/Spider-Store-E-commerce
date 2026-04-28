(function () {
    'use strict';

    const THEME_KEY = 'spider_theme';

    if (window.SpiderTheme && typeof window.SpiderTheme.applySaved === 'function') {
        window.SpiderTheme.applySaved();
        return;
    }

    function configureTailwindDarkMode() {
        window.tailwind = window.tailwind || {};
        const currentConfig = window.tailwind.config || {};

        window.tailwind.config = {
            ...currentConfig,
            darkMode: 'class'
        };
    }

    function injectThemeStyles() {
        if (document.getElementById('spider-theme-styles')) return;

        const style = document.createElement('style');
        style.id = 'spider-theme-styles';

        style.textContent = `
            html.dark {
                color-scheme: dark;

                --spider-dark-bg: #0B1020;
                --spider-dark-surface: #111827;
                --spider-dark-card: #151F32;
                --spider-dark-soft: #1E293B;
                --spider-dark-soft-hover: #25344A;
                --spider-dark-inner: #0F172A;
                --spider-dark-border: #263449;
                --spider-dark-border-soft: #334155;

                --spider-dark-text: #F8FAFC;
                --spider-dark-muted: #CBD5E1;
                --spider-dark-subtle: #94A3B8;

                --spider-dark-accent: #22D3EE;
                --spider-dark-accent-soft: rgba(34, 211, 238, 0.12);
                --spider-dark-accent-hover: rgba(34, 211, 238, 0.18);
            }

            html.dark body {
                background: var(--spider-dark-bg) !important;
                color: var(--spider-dark-text) !important;
            }

            html.dark nav,
            html.dark header {
                background-color: var(--spider-dark-surface) !important;
                border-color: var(--spider-dark-border) !important;
                color: var(--spider-dark-text) !important;
            }

            html.dark footer {
                background-color: #090E1A !important;
                border-color: var(--spider-dark-border) !important;
                color: var(--spider-dark-muted) !important;
            }

            html.dark .bg-white,
            html.dark .bg-white\\/95,
            html.dark .bg-white\\/90,
            html.dark .bg-white\\/80,
            html.dark .bg-white\\/75 {
                background-color: var(--spider-dark-card) !important;
                color: var(--spider-dark-text) !important;
            }

            html.dark section.bg-white,
            html.dark section.rounded-2xl,
            html.dark article.bg-white,
            html.dark aside.bg-white,
            html.dark .shadow-sm.bg-white,
            html.dark .shadow-md.bg-white,
            html.dark .shadow-lg.bg-white {
                background-color: var(--spider-dark-card) !important;
                border-color: var(--spider-dark-border) !important;
            }

            html.dark .bg-gray-50,
            html.dark .bg-gray-100,
            html.dark .bg-gray-200,
            html.dark .bg-slate-50,
            html.dark .bg-slate-100,
            html.dark .bg-slate-200 {
                background-color: var(--spider-dark-soft) !important;
                color: var(--spider-dark-text) !important;
            }

            html.dark section .bg-slate-50,
            html.dark section .bg-gray-50,
            html.dark article .bg-slate-50,
            html.dark article .bg-gray-50 {
                background-color: var(--spider-dark-inner) !important;
            }

            html.dark .bg-gray-900,
            html.dark .bg-slate-900,
            html.dark .bg-slate-950 {
                background-color: var(--spider-dark-surface) !important;
            }

            html.dark .bg-cyan-50,
            html.dark .bg-primary-50,
            html.dark .bg-primary-100 {
                background-color: var(--spider-dark-accent-soft) !important;
                color: var(--spider-dark-accent) !important;
            }

            html.dark .border-gray-100,
            html.dark .border-gray-200,
            html.dark .border-gray-300,
            html.dark .border-gray-800,
            html.dark .border-slate-100,
            html.dark .border-slate-200,
            html.dark .border-slate-300,
            html.dark .border-slate-800 {
                border-color: var(--spider-dark-border) !important;
            }

            html.dark .text-gray-900,
            html.dark .text-slate-950,
            html.dark .text-slate-900,
            html.dark .text-black {
                color: var(--spider-dark-text) !important;
            }

            html.dark .text-gray-800,
            html.dark .text-slate-800,
            html.dark .text-gray-700,
            html.dark .text-slate-700,
            html.dark .text-gray-600,
            html.dark .text-slate-600 {
                color: var(--spider-dark-muted) !important;
            }

            html.dark .text-gray-500,
            html.dark .text-slate-500,
            html.dark .text-gray-400,
            html.dark .text-slate-400 {
                color: var(--spider-dark-subtle) !important;
            }

            html.dark .text-primary-500,
            html.dark .text-primary-600,
            html.dark .text-primary-700,
            html.dark .text-cyan-400,
            html.dark .text-cyan-500,
            html.dark .text-cyan-600,
            html.dark .text-cyan-700,
            html.dark [class*="text-[#06B6D4]"] {
                color: var(--spider-dark-accent) !important;
            }

            html.dark .bg-primary-500,
            html.dark .bg-primary-600,
            html.dark .bg-cyan-500,
            html.dark .bg-cyan-600,
            html.dark [class*="bg-[#06B6D4]"] {
                background-color: var(--spider-dark-accent) !important;
                color: #07111F !important;
            }

            html.dark .border-primary-500,
            html.dark .border-primary-600,
            html.dark .border-cyan-500,
            html.dark .border-cyan-600,
            html.dark [class*="border-[#06B6D4]"] {
                border-color: var(--spider-dark-accent) !important;
            }

            html.dark input,
            html.dark textarea,
            html.dark select {
                background-color: var(--spider-dark-inner) !important;
                color: var(--spider-dark-text) !important;
                border-color: var(--spider-dark-border-soft) !important;
            }

            html.dark input:focus,
            html.dark textarea:focus,
            html.dark select:focus {
                border-color: var(--spider-dark-accent) !important;
                box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.14) !important;
            }

            html.dark input::placeholder,
            html.dark textarea::placeholder {
                color: var(--spider-dark-subtle) !important;
            }

            html.dark table,
            html.dark th,
            html.dark td {
                border-color: var(--spider-dark-border) !important;
            }

            html.dark .ring-slate-100,
            html.dark .ring-slate-200,
            html.dark .ring-gray-100,
            html.dark .ring-gray-200,
            html.dark .ring-primary-100,
            html.dark .ring-cyan-100 {
                --tw-ring-color: var(--spider-dark-border) !important;
            }

            html.dark .hover\\:bg-cyan-50:hover,
            html.dark .hover\\:bg-primary-50:hover {
                background-color: var(--spider-dark-accent-hover) !important;
                color: var(--spider-dark-accent) !important;
            }

            html.dark .hover\\:bg-slate-50:hover,
            html.dark .hover\\:bg-gray-50:hover {
                background-color: var(--spider-dark-soft-hover) !important;
            }

            html.dark a:hover {
                color: var(--spider-dark-accent) !important;
            }

            html.dark .shadow-sm,
            html.dark .shadow-md,
            html.dark .shadow-lg,
            html.dark .shadow-xl,
            html.dark .shadow-2xl {
                box-shadow:
                    0 18px 45px rgba(0, 0, 0, 0.24),
                    inset 0 1px 0 rgba(255, 255, 255, 0.035) !important;
            }

            html.dark img {
                color: var(--spider-dark-muted);
            }

            html.dark .skeleton,
            html.dark .animate-pulse {
                background-color: var(--spider-dark-soft) !important;
            }

            html.dark .line-through {
                color: var(--spider-dark-subtle) !important;
            }
        `;

        document.head.appendChild(style);
    }

    function getStoredTheme() {
        try {
            const value = localStorage.getItem(THEME_KEY);
            return value === 'dark' ? 'dark' : 'light';
        } catch (error) {
            return 'light';
        }
    }

    function applyTheme(theme, options = {}) {
        const normalized = theme === 'dark' ? 'dark' : 'light';

        document.documentElement.classList.toggle('dark', normalized === 'dark');
        document.documentElement.dataset.theme = normalized;

        if (options.persist !== false) {
            try {
                localStorage.setItem(THEME_KEY, normalized);
            } catch (error) {}
        }

        window.dispatchEvent(new CustomEvent('spider:theme-changed', {
            detail: { theme: normalized }
        }));

        return normalized;
    }

    function applySavedTheme() {
        return applyTheme(getStoredTheme(), { persist: false });
    }

    configureTailwindDarkMode();
    injectThemeStyles();
    applySavedTheme();

    window.SpiderTheme = {
        key: THEME_KEY,
        get: getStoredTheme,
        set: applyTheme,
        applySaved: applySavedTheme,
        toggle() {
            return applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
        }
    };
})();