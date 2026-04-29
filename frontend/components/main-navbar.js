(() => {
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

async function updateGlobalCartCount() {
    const badges = document.querySelectorAll('[data-cart-count-badge]');
    const token = getStoredToken();

    if (!badges.length) return;

    const setCount = value => {
        badges.forEach(badge => {
            badge.textContent = String(value);
        });
    };

    if (!token) {
        setCount(getStoredCartCount());
        return;
    }

    try {
        const response = await fetch('/api/cart', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            setCount(0);
            return;
        }

        const data = await response.json().catch(() => ({}));
        const items = data.data || data.cart || [];

        const count = Array.isArray(items)
            ? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            : 0;

        setCount(count);
    } catch (error) {
        console.error('Error loading cart count:', error);
        setCount(0);
    }
}

function loadMainNavbar() {
    ensureAppStateScript();
    ensureUiFeedbackScript();

    const token = getStoredToken();
    const decoded = decodeUserRole(token);

    const user = {
        first_name: decoded && decoded.first_name,
        last_name: decoded && decoded.last_name,
        role: decoded && decoded.role,
        seller_status: decoded && decoded.seller_status
    };

    const routes = getNavbarRoutes();
    const mount = ensureNavbarContainer();

    mount.innerHTML = buildNavbarHTML({ token, user, routes });

    wireNavbarSearch(routes.home);
    wireDesktopAccountDropdown();
    wireMobileMenu();
    wireThemeToggle();
    updateGlobalCartCount();
    hydrateNavbarUser(routes);
}

function getNavbarRoutes() {
    return {
        home: getPath('index.html'),
        login: getPath('pages/auth/login.html'),
        register: getPath('pages/auth/register.html'),
        profile: getPath('pages/profile/profile.html'),
        orders: getPath('pages/orders/orders.html'),
        wishlist: getPath('pages/wishlist/wishlist.html'),
        cart: getPath('pages/cart/cart.html'),
        seller: getPath('pages/seller/products.html'),
        admin: getPath('pages/admin/manage-products.html'),
        help: '#'
    };
}

function getPath(relativePath) {
    const cleanPath = String(relativePath || '').replace(/^\/+/, '');
    const currentPath = window.location.pathname;
    const prefix = currentPath.includes('/pages/') ? '../../' : '';
    return `${prefix}${cleanPath}`;
}

function ensureNavbarContainer() {
    let container = document.getElementById('navbar-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'navbar-container';
        document.body.insertAdjacentElement('afterbegin', container);
    }

    return container;
}

function buildNavbarHTML({ token, user, routes }) {
    const canSeeSeller = user.role === 'seller' || user.seller_status === 'approved_seller';
    const canSeeAdmin = user.role === 'admin';
    const fullName = getFullName(user) || 'حسابك';
    const firstName = String(user.first_name || '').trim();
    const accountLabel = firstName ? `مرحبًا، ${escapeHTML(firstName)}` : 'الحساب';
    const initials = getInitials(fullName);

    return `
        <nav class="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm" dir="rtl">
            <div class="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-3 py-3 sm:px-4 lg:px-6">
                
                <div class="flex min-w-0 items-center gap-3">
                    <a href="${routes.home}" class="flex shrink-0 items-center gap-2 text-slate-950 no-underline" aria-label="الصفحة الرئيسية">
                        <span class="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500 text-lg font-black text-white shadow-md shadow-cyan-200">S</span>
                        <span class="text-xl font-black tracking-normal sm:text-2xl">
                            Spider <span class="text-cyan-500">Store</span>
                        </span>
                    </a>

                    <form id="navbarSearchForm" class="relative hidden min-w-0 flex-1 lg:block" role="search">
                        <i class="fas fa-search pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-cyan-500"></i>
                        <input
                            id="navbarSearchInput"
                            type="search"
                            placeholder="ابحث عن منتج..."
                            autocomplete="off"
                            class="h-12 w-full rounded-full border border-slate-200 bg-slate-50 py-0 pl-12 pr-5 text-[15px] text-slate-950 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                        >
                    </form>

                    <div class="mr-auto hidden items-center gap-1 lg:flex" dir="rtl">
                        <button
                            type="button"
                            data-theme-toggle
                            class="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
                            aria-pressed="false"
                        >
                            <i data-theme-icon class="fas fa-moon text-cyan-500"></i>
                            <span data-theme-label>الوضع الداكن</span>
                        </button>

                        ${token ? buildDesktopAccountMenu({ accountLabel, fullName, initials, routes, canSeeSeller, canSeeAdmin }) : buildGuestDesktopActions(routes)}

                        <a href="${routes.orders}" class="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700">
                            <i class="fas fa-bag-shopping text-cyan-500"></i>
                            <span>الطلبات</span>
                        </a>

                        <a href="${routes.wishlist}" class="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700">
                            <i class="fas fa-heart text-cyan-500"></i>
                            <span>المفضلة</span>
                        </a>

                        ${cartButton(routes.cart)}
                    </div>

                    <div class="mr-auto flex items-center gap-2 lg:hidden" dir="rtl">
                        ${cartButton(routes.cart)}

                        ${
                            token
                                ? `
                                    <a href="${routes.profile}" class="grid h-11 w-11 place-items-center rounded-full bg-cyan-100 text-sm font-black uppercase text-cyan-700">
                                        <span id="navbarAvatarMobileTop">${escapeHTML(initials)}</span>
                                    </a>
                                `
                                : `
                                    <a href="${routes.login}" class="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-cyan-50 hover:text-cyan-700" aria-label="تسجيل الدخول">
                                        <i class="fas fa-user"></i>
                                    </a>
                                `
                        }

                        <button
                            id="navbarMobileMenuBtn"
                            type="button"
                            class="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-cyan-50 hover:text-cyan-700"
                            aria-expanded="false"
                            aria-controls="navbarMobileMenu"
                            aria-label="فتح القائمة"
                        >
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </div>

                <form id="navbarMobileSearchForm" class="relative block lg:hidden" role="search">
                    <i class="fas fa-search pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-cyan-500"></i>
                    <input
                        id="navbarMobileSearchInput"
                        type="search"
                        placeholder="ابحث عن منتج..."
                        autocomplete="off"
                        class="h-12 w-full rounded-full border border-slate-200 bg-slate-50 py-0 pl-12 pr-5 text-[15px] text-slate-950 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    >
                </form>

                <div
                    id="navbarMobileMenu"
                    class="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:hidden"
                    dir="rtl"
                >
                    ${
                        token
                            ? `
                                <div class="border-b border-slate-100 bg-slate-50 p-4">
                                    <div class="flex items-center gap-3">
                                        <span id="navbarAvatarMobileMenu" class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cyan-500 text-sm font-black uppercase text-white">
                                            ${escapeHTML(initials)}
                                        </span>

                                        <div class="min-w-0 flex-1">
                                            <p id="navbarFullNameMobile" class="truncate text-base font-black text-slate-950">${escapeHTML(fullName)}</p>
                                            <a href="${routes.profile}" class="mt-1 inline-flex items-center gap-1 text-sm font-bold text-cyan-600">
                                                حسابك الشخصي
                                                <i class="fas fa-chevron-left text-[10px]"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            `
                            : `
                                <div class="border-b border-slate-100 bg-slate-50 p-4">
                                    <div class="grid grid-cols-2 gap-2">
                                        <a href="${routes.login}" class="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                                            <i class="fas fa-user text-cyan-500"></i>
                                            تسجيل الدخول
                                        </a>

                                        <a href="${routes.register}" class="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-white shadow-sm">
                                            <i class="fas fa-user-plus"></i>
                                            إنشاء حساب
                                        </a>
                                    </div>
                                </div>
                            `
                    }

                    <div class="grid gap-2 p-3">
                        ${mobileMenuLink(routes.orders, 'fa-bag-shopping', 'الطلبات')}
                        ${mobileMenuLink(routes.wishlist, 'fa-heart', 'المفضلة')}
                        ${canSeeSeller ? mobileMenuLink(routes.seller, 'fa-store', 'لوحة البائع', 'mobileSellerDashboardLink') : ''}
                        ${canSeeAdmin ? mobileMenuLink(routes.admin, 'fa-gauge-high', 'لوحة الأدمن', 'mobileAdminDashboardLink') : ''}

                        <button
                            type="button"
                            data-theme-toggle
                            class="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                            aria-pressed="false"
                        >
                            <span data-theme-label>الوضع الداكن</span>
                            <i data-theme-icon class="fas fa-moon text-cyan-500"></i>
                        </button>

                        ${mobileMenuLink(routes.help, 'fa-circle-question', 'تحتاج مساعدة؟')}
                    </div>

                    ${
                        token
                            ? `
                                <div class="border-t border-slate-100 p-3">
                                    <button
                                        type="button"
                                        onclick="navbarLogout()"
                                        class="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100"
                                    >
                                        <i class="fas fa-right-from-bracket"></i>
                                        <span>تسجيل الخروج</span>
                                    </button>
                                </div>
                            `
                            : ''
                    }
                </div>
            </div>
        </nav>
    `;
}

function cartButton(cartUrl) {
    return `
        <a href="${cartUrl}" class="relative grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-cyan-50 hover:text-cyan-700" aria-label="سلة المشتريات">
            <i class="fas fa-cart-shopping text-lg"></i>
            <span data-cart-count-badge class="absolute -left-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-cyan-500 px-1 text-[11px] font-black leading-none text-white">0</span>
        </a>
    `;
}

function buildGuestDesktopActions(routes) {
    return `
        <a href="${routes.login}" class="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700">
            <i class="fas fa-user text-cyan-500"></i>
            <span>تسجيل الدخول</span>
        </a>

        <a href="${routes.register}" class="inline-flex h-10 items-center rounded-xl px-3 text-sm font-black text-cyan-600 transition hover:bg-cyan-50">
            إنشاء حساب
        </a>
    `;
}

function buildDesktopAccountMenu({ accountLabel, fullName, initials, routes, canSeeSeller, canSeeAdmin }) {
    return `
        <div id="navbarAccountWrap" class="relative hidden lg:block">
            <button
                id="navbarAccountBtn"
                type="button"
                class="inline-flex h-10 max-w-[190px] items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
                aria-expanded="false"
                aria-haspopup="true"
            >
                <span id="navbarAvatarDesktop" class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-100 text-xs font-black uppercase text-cyan-700">
                    ${escapeHTML(initials)}
                </span>
                <span id="navbarGreetingDesktop" class="truncate">${accountLabel}</span>
                <i class="fas fa-chevron-down text-[11px] text-slate-400"></i>
            </button>

            <div
                id="navbarAccountMenu"
                class="absolute right-0 top-[calc(100%+0.75rem)] z-50 hidden w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-2xl shadow-slate-900/15"
                role="menu"
            >
                <div class="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-4">
                    <span id="navbarAvatarDesktopMenu" class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cyan-500 text-sm font-black uppercase text-white">
                        ${escapeHTML(initials)}
                    </span>

                    <div class="min-w-0 flex-1">
                        <p id="navbarFullNameDesktop" class="truncate text-sm font-black text-slate-950">${escapeHTML(fullName)}</p>
                        <a href="${routes.profile}" class="mt-1 inline-flex items-center gap-1 text-xs font-bold text-cyan-600">
                            حسابك الشخصي
                            <i class="fas fa-chevron-left text-[10px]"></i>
                        </a>
                    </div>
                </div>

                <div class="p-2">
                    ${dropdownLink(routes.profile, 'fa-user', 'حسابي')}
                    ${dropdownLink(routes.orders, 'fa-bag-shopping', 'الطلبات')}
                    ${dropdownLink(routes.wishlist, 'fa-heart', 'المفضلة')}
                    ${dropdownLink(routes.seller, 'fa-store', 'لوحة البائع', 'sellerDashboardLink', canSeeSeller)}
                    ${dropdownLink(routes.admin, 'fa-gauge-high', 'لوحة الأدمن', 'adminDashboardLink', canSeeAdmin)}
                    ${dropdownLink(routes.help, 'fa-circle-question', 'تحتاج مساعدة؟')}
                </div>

                <div class="border-t border-slate-100 p-2">
                    <button
                        type="button"
                        onclick="navbarLogout()"
                        class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right text-sm font-black text-red-600 transition hover:bg-red-50"
                        role="menuitem"
                    >
                        <i class="fas fa-right-from-bracket"></i>
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function dropdownLink(href, icon, label, id = '', visible = true) {
    return `
        <a
            href="${href}"
            ${id ? `id="${id}"` : ''}
            class="${visible ? '' : 'hidden'} flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
            role="menuitem"
        >
            <i class="fas ${icon} w-5 text-center text-cyan-500"></i>
            <span>${label}</span>
        </a>
    `;
}

function mobileMenuLink(href, icon, label, id = '') {
    return `
        <a
            href="${href}"
            ${id ? `id="${id}"` : ''}
            class="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        >
            <span>${label}</span>
            <i class="fas ${icon} text-cyan-500"></i>
        </a>
    `;
}

function wireNavbarSearch(homePath) {
    const isHomepage = () => {
        const path = window.location.pathname.replace(/\/+$/, '');
        return !path.includes('/pages/') && (path === '' || path === '/' || path.endsWith('/index.html'));
    };

    const submitSearch = input => {
        const query = String((input && input.value) || '').trim();
        window.location.href = query ? `${homePath}?search=${encodeURIComponent(query)}` : homePath;
    };

    const emitLiveSearch = input => {
        if (!isHomepage()) return;

        const query = String((input && input.value) || '').trim();

        window.dispatchEvent(new CustomEvent('spider:live-search', {
            detail: { query }
        }));
    };

    [
        ['navbarSearchForm', 'navbarSearchInput'],
        ['navbarMobileSearchForm', 'navbarMobileSearchInput']
    ].forEach(([formId, inputId]) => {
        const form = document.getElementById(formId);
        const input = document.getElementById(inputId);

        if (!form || !input) return;

        form.addEventListener('submit', event => {
            event.preventDefault();
            submitSearch(input);
        });

        input.addEventListener('input', () => emitLiveSearch(input));
    });
}

function wireDesktopAccountDropdown() {
    const wrap = document.getElementById('navbarAccountWrap');
    const button = document.getElementById('navbarAccountBtn');
    const menu = document.getElementById('navbarAccountMenu');

    if (!wrap || !button || !menu) return;

    const close = () => {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
    };

    button.addEventListener('click', event => {
        event.stopPropagation();
        closeMobileMenu();

        const willOpen = menu.classList.contains('hidden');

        menu.classList.toggle('hidden', !willOpen);
        button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.addEventListener('click', event => {
        if (!wrap.contains(event.target)) close();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') close();
    });
}

function closeDesktopAccountDropdown() {
    const button = document.getElementById('navbarAccountBtn');
    const menu = document.getElementById('navbarAccountMenu');

    if (!button || !menu) return;

    menu.classList.add('hidden');
    button.setAttribute('aria-expanded', 'false');
}

function closeMobileMenu() {
    const button = document.getElementById('navbarMobileMenuBtn');
    const menu = document.getElementById('navbarMobileMenu');

    if (!button || !menu) return;

    menu.classList.add('hidden');
    button.setAttribute('aria-expanded', 'false');
}

function wireMobileMenu() {
    const button = document.getElementById('navbarMobileMenuBtn');
    const menu = document.getElementById('navbarMobileMenu');

    if (!button || !menu) return;

    button.addEventListener('click', event => {
        event.stopPropagation();
        closeDesktopAccountDropdown();

        const willOpen = menu.classList.contains('hidden');

        menu.classList.toggle('hidden', !willOpen);
        button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.addEventListener('click', event => {
        if (!menu.contains(event.target) && !button.contains(event.target)) {
            closeMobileMenu();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMobileMenu();
    });
}

function wireThemeToggle() {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();

            if (window.SpiderTheme && typeof window.SpiderTheme.toggle === 'function') {
                window.SpiderTheme.toggle();
            } else {
                document.documentElement.classList.toggle('dark');
            }

            updateThemeToggleUI();
        });
    });

    updateThemeToggleUI();

    if (!window.__spiderThemeToggleListenerBound) {
        window.addEventListener('spider:theme-changed', updateThemeToggleUI);
        window.__spiderThemeToggleListenerBound = true;
    }
}

function updateThemeToggleUI() {
    const isDark = document.documentElement.classList.contains('dark');

    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
        button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        button.setAttribute('aria-label', isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن');
    });

    document.querySelectorAll('[data-theme-label]').forEach(label => {
        label.textContent = isDark ? 'الوضع الفاتح' : 'الوضع الداكن';
    });

    document.querySelectorAll('[data-theme-icon]').forEach(icon => {
        icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'} text-cyan-500`;
    });
}

function hydrateNavbarUser(routes) {
    const token = getStoredToken();

    if (!token) return;

    fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(response => response.ok ? response.json() : null)
        .then(result => {
            const user = result && result.data;
            if (!user) return;
            updateNavbarUser(user, routes);
        })
        .catch(() => {});
}

function updateNavbarUser(user, routes) {
    const fullName = getFullName(user) || 'حسابك';
    const firstName = String(user.first_name || '').trim();
    const initials = getInitials(fullName || 'ح');

    setText('navbarGreetingDesktop', firstName ? `مرحبًا، ${firstName}` : 'الحساب');
    setText('navbarFullNameDesktop', fullName);
    setText('navbarFullNameMobile', fullName);

    setText('navbarAvatarDesktop', initials);
    setText('navbarAvatarDesktopMenu', initials);
    setText('navbarAvatarMobileTop', initials);
    setText('navbarAvatarMobileMenu', initials);

    const sellerLinks = [
        document.getElementById('sellerDashboardLink'),
        document.getElementById('mobileSellerDashboardLink')
    ];

    const adminLinks = [
        document.getElementById('adminDashboardLink'),
        document.getElementById('mobileAdminDashboardLink')
    ];

    sellerLinks.forEach(link => {
        if (!link) return;

        link.href = routes.seller;
        link.classList.toggle('hidden', !(user.role === 'seller' || user.seller_status === 'approved_seller'));
    });

    adminLinks.forEach(link => {
        if (!link) return;

        link.href = routes.admin;
        link.classList.toggle('hidden', user.role !== 'admin');
    });
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function getFullName(user) {
    return [user.first_name, user.last_name]
        .map(value => String(value || '').trim())
        .filter(Boolean)
        .join(' ');
}

function getInitials(name) {
    const parts = String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) return 'ح';

    return parts
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase();
}

function navbarLogout() {
    if (window.AppState) {
        window.AppState.clearToken();

        if (typeof window.AppState.clearCart === 'function') {
            window.AppState.clearCart();
        }
    } else {
        try {
            localStorage.removeItem('spider_token');
            localStorage.removeItem('token');
            localStorage.removeItem('spider_cart');
        } catch (error) {}

        document.cookie = 'spider_token=; path=/; max-age=0; SameSite=Lax';
    }

    window.location.href = getPath('index.html');
}

function decodeUserRole(token) {
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        return {
            role: payload.role === 'customer' ? 'user' : payload.role,
            seller_status: payload.seller_status,
            first_name: payload.first_name,
            last_name: payload.last_name,
            name: payload.name
        };
    } catch (error) {
        return null;
    }
}

function getStoredToken() {
    if (window.AppState && typeof window.AppState.getToken === 'function') {
        return window.AppState.getToken();
    }

    const token =
        localStorage.getItem('spider_token') ||
        localStorage.getItem('token') ||
        getCookieValue('spider_token');

    if (token) {
        try {
            localStorage.setItem('spider_token', token);
            localStorage.removeItem('token');
        } catch (error) {}
    }

    return token;
}

function getStoredCartCount() {
    if (window.AppState && typeof window.AppState.getCartCount === 'function') {
        return window.AppState.getCartCount();
    }

    try {
        const localCart = JSON.parse(localStorage.getItem('spider_cart') || '[]');

        return Array.isArray(localCart)
            ? localCart.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            : 0;
    } catch (error) {
        return 0;
    }
}

function getCookieValue(name) {
    const encodedName = `${encodeURIComponent(name)}=`;

    return document.cookie
        .split(';')
        .map(part => part.trim())
        .filter(Boolean)
        .reduce((found, part) => {
            return found || (part.startsWith(encodedName) ? decodeURIComponent(part.slice(encodedName.length)) : null);
        }, null);
}

function ensureAppStateScript() {
    if (window.AppState || document.querySelector('script[data-app-state]')) return;

    const script = document.createElement('script');
    script.src = getPath('components/app-state.js');
    script.dataset.appState = 'true';
    document.head.appendChild(script);
}

function ensureUiFeedbackScript() {
    if (window.AppUI || document.querySelector('script[data-ui-feedback]')) return;

    const script = document.createElement('script');
    script.src = getPath('components/ui-feedback.js');
    script.dataset.uiFeedback = 'true';
    document.head.appendChild(script);
}

function escapeHTML(value) {
    return String(value || '').replace(/[&<>'"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[char]));
}

loadMainNavbar();

window.updateGlobalCartCount = updateGlobalCartCount;
window.navbarLogout = navbarLogout;
window.addEventListener('spider:cart-changed', updateGlobalCartCount);