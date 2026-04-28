(() => {
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
                --spider-dark-bg: #070B16;
                --spider-dark-surface: #111827;
                --spider-dark-card: #1A263A;
                --spider-dark-soft: #24324A;
                --spider-dark-border: #3A4A63;
                --spider-dark-text: #F8FAFC;
                --spider-dark-muted: #CBD5E1;
                --spider-dark-subtle: #94A3B8;
                --spider-dark-accent: #38D5E8;
            }
            html.dark body { background: var(--spider-dark-bg) !important; color: var(--spider-dark-text) !important; }
            html.dark nav,
            html.dark footer,
            html.dark header { background-color: var(--spider-dark-surface) !important; border-color: var(--spider-dark-border) !important; color: var(--spider-dark-text) !important; }
            html.dark .bg-white,
            html.dark .bg-white\\/95,
            html.dark .bg-white\\/90,
            html.dark .bg-white\\/80,
            html.dark .bg-white\\/75 { background-color: var(--spider-dark-card) !important; color: var(--spider-dark-text) !important; }
            html.dark .bg-gray-50,
            html.dark .bg-gray-100,
            html.dark .bg-gray-200,
            html.dark .bg-slate-50,
            html.dark .bg-slate-100,
            html.dark .bg-slate-200 { background-color: var(--spider-dark-soft) !important; color: var(--spider-dark-text) !important; }
            html.dark .bg-gray-900,
            html.dark .bg-slate-900,
            html.dark .bg-slate-950 { background-color: var(--spider-dark-surface) !important; }
            html.dark .bg-cyan-50,
            html.dark .bg-primary-50,
            html.dark .bg-primary-100 { background-color: rgba(56, 213, 232, 0.12) !important; color: var(--spider-dark-accent) !important; }
            html.dark .border-gray-100,
            html.dark .border-gray-200,
            html.dark .border-gray-300,
            html.dark .border-gray-800,
            html.dark .border-slate-100,
            html.dark .border-slate-200,
            html.dark .border-slate-300,
            html.dark .border-slate-800 { border-color: var(--spider-dark-border) !important; }
            html.dark .text-gray-900,
            html.dark .text-slate-950,
            html.dark .text-slate-900 { color: var(--spider-dark-text) !important; }
            html.dark .text-gray-800,
            html.dark .text-slate-800 { color: var(--spider-dark-muted) !important; }
            html.dark .text-gray-700,
            html.dark .text-slate-700,
            html.dark .text-gray-600,
            html.dark .text-slate-600 { color: var(--spider-dark-muted) !important; }
            html.dark .text-gray-500,
            html.dark .text-slate-500,
            html.dark .text-gray-400,
            html.dark .text-slate-400 { color: var(--spider-dark-subtle) !important; }
            html.dark .text-primary-500,
            html.dark .text-primary-600,
            html.dark .text-primary-700,
            html.dark .text-cyan-400,
            html.dark .text-cyan-500,
            html.dark .text-cyan-600,
            html.dark .text-cyan-700,
            html.dark [class*="text-[#06B6D4]"] { color: var(--spider-dark-accent) !important; }
            html.dark .bg-primary-500,
            html.dark .bg-primary-600,
            html.dark .bg-cyan-500,
            html.dark .bg-cyan-600,
            html.dark [class*="bg-[#06B6D4]"] { background-color: var(--spider-dark-accent) !important; color: #07111F !important; }
            html.dark .border-primary-500,
            html.dark .border-primary-600,
            html.dark .border-cyan-500,
            html.dark .border-cyan-600,
            html.dark [class*="border-[#06B6D4]"] { border-color: var(--spider-dark-accent) !important; }
            html.dark input,
            html.dark textarea,
            html.dark select { background-color: var(--spider-dark-soft) !important; color: var(--spider-dark-text) !important; border-color: var(--spider-dark-border) !important; }
            html.dark input:focus,
            html.dark textarea:focus,
            html.dark select:focus { border-color: var(--spider-dark-accent) !important; box-shadow: 0 0 0 3px rgba(56, 213, 232, 0.14) !important; }
            html.dark input::placeholder,
            html.dark textarea::placeholder { color: var(--spider-dark-subtle) !important; }
            html.dark table,
            html.dark th,
            html.dark td { border-color: var(--spider-dark-border) !important; }
            html.dark .ring-slate-100,
            html.dark .ring-slate-200,
            html.dark .ring-gray-100,
            html.dark .ring-gray-200,
            html.dark .ring-primary-100,
            html.dark .ring-cyan-100 { --tw-ring-color: var(--spider-dark-border) !important; }
            html.dark .hover\\:bg-cyan-50:hover,
            html.dark .hover\\:bg-primary-50:hover,
            html.dark .hover\\:bg-slate-50:hover,
            html.dark .hover\\:bg-gray-50:hover { background-color: rgba(56, 213, 232, 0.10) !important; color: var(--spider-dark-accent) !important; }
            html.dark .shadow-sm,
            html.dark .shadow-md,
            html.dark .shadow-lg,
            html.dark .shadow-xl,
            html.dark .shadow-2xl { box-shadow: 0 18px 45px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.03) !important; }
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

    function applyTheme(theme) {
        const normalized = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', normalized === 'dark');
        document.documentElement.dataset.theme = normalized;
        try {
            localStorage.setItem(THEME_KEY, normalized);
        } catch (error) {}
        window.dispatchEvent(new CustomEvent('spider:theme-changed', { detail: { theme: normalized } }));
        return normalized;
    }

    function applySavedTheme() {
        return applyTheme(getStoredTheme());
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
    const badge = document.getElementById('cartCountBadge');
    const token = getStoredToken();

    if (!badge) return;

    if (!token) {
        badge.textContent = getStoredCartCount();
        return;
    }

    try {
        const response = await fetch('/api/cart', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            badge.textContent = '0';
            return;
        }

        const data = await response.json().catch(() => ({}));
        const items = data.data || data.cart || [];
        badge.textContent = Array.isArray(items)
            ? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            : '0';
    } catch (error) {
        console.error('Error loading cart count:', error);
        badge.textContent = '0';
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
    wireAccountDropdown();
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
    const accountLabel = user.first_name ? `Hi, ${escapeHTML(user.first_name)}` : 'Account';
    const fullName = getFullName(user) || 'Your account';
    const initials = getInitials(fullName);

    return `
        <nav class="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm" dir="ltr">
            <div class="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-3 py-3 sm:px-4 lg:px-6">

                <div class="flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-5">
                    <a href="${routes.home}" class="flex shrink-0 items-center gap-2 text-slate-950 no-underline" aria-label="Spider Store home">
                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-[#06B6D4] text-lg font-black text-white shadow-md shadow-cyan-200">S</span>
                        <span class="text-xl font-black tracking-normal sm:text-2xl">
                            Spider <span class="text-[#06B6D4]">Store</span>
                        </span>
                    </a>

                    <form id="navbarSearchForm" class="relative hidden min-w-0 flex-1 lg:block" role="search">
                        <i class="fas fa-search pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#06B6D4]"></i>
                        <input id="navbarSearchInput" type="search" placeholder="What are you looking for?" autocomplete="off"
                            class="h-12 w-full rounded-full border border-slate-200 bg-slate-50 py-0 pl-5 pr-12 text-[15px] text-slate-950 outline-none transition focus:border-[#06B6D4] focus:bg-white focus:ring-4 focus:ring-cyan-100">
                    </form>

                    <div class="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2" dir="rtl">

                        <button type="button" class="hidden h-10 items-center rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 xl:inline-flex">
                            العربية | EN
                        </button>

                        <button type="button" data-theme-toggle class="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 lg:inline-flex" aria-pressed="false">
                            <i data-theme-icon class="fas fa-moon text-[#06B6D4]"></i>
                            <span data-theme-label class="hidden xl:inline">Dark Mode</span>
                        </button>

                        <a href="${routes.orders}" class="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 lg:inline-flex">
                            <i class="fas fa-bag-shopping text-[#06B6D4]"></i>
                            <span>Orders</span>
                        </a>

                        <a href="${routes.wishlist}" class="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 lg:inline-flex">
                            <i class="fas fa-heart text-[#06B6D4]"></i>
                            <span>Wishlist</span>
                        </a>

                        <a href="${routes.cart}" class="relative grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-950 transition hover:bg-cyan-50 hover:text-cyan-700" aria-label="Cart">
                            <i class="fas fa-cart-shopping text-lg"></i>
                            <span id="cartCountBadge" class="absolute -left-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#06B6D4] px-1 text-[11px] font-black leading-none text-white">0</span>
                        </a>

                        ${token ? buildLoggedInAccount({ accountLabel, fullName, initials, routes, canSeeSeller, canSeeAdmin }) : buildGuestActions(routes)}

                        <button id="navbarMobileMenuBtn" type="button" class="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-950 transition hover:bg-cyan-50 hover:text-cyan-700 lg:hidden" aria-expanded="false" aria-controls="navbarMobileMenu" aria-label="Open menu">
                            <i class="fas fa-bars text-lg"></i>
                        </button>
                    </div>
                </div>

                <form id="navbarMobileSearchForm" class="relative block lg:hidden" role="search">
                    <i class="fas fa-search pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#06B6D4]"></i>
                    <input id="navbarMobileSearchInput" type="search" placeholder="What are you looking for?" autocomplete="off"
                        class="h-12 w-full rounded-full border border-slate-200 bg-slate-50 py-0 pl-5 pr-12 text-[15px] text-slate-950 outline-none transition focus:border-[#06B6D4] focus:bg-white focus:ring-4 focus:ring-cyan-100">
                </form>

                <div id="navbarMobileMenu" class="hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 lg:hidden" dir="rtl">
                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <a href="${routes.orders}" class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-700">
                            <span>Orders</span>
                            <i class="fas fa-bag-shopping text-[#06B6D4]"></i>
                        </a>

                        <a href="${routes.wishlist}" class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-700">
                            <span>Wishlist</span>
                            <i class="fas fa-heart text-[#06B6D4]"></i>
                        </a>

                        <button type="button" class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-700">
                            <span>العربية | EN</span>
                            <i class="fas fa-language text-[#06B6D4]"></i>
                        </button>

                        <button type="button" data-theme-toggle class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-700" aria-pressed="false">
                            <span data-theme-label>Dark Mode</span>
                            <i data-theme-icon class="fas fa-moon text-[#06B6D4]"></i>
                        </button>

                        <a href="${routes.help}" class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-700">
                            <span>Need Help?</span>
                            <i class="fas fa-circle-question text-[#06B6D4]"></i>
                        </a>

                        ${canSeeSeller ? `
                            <a href="${routes.seller}" class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-700">
                                <span>Seller Dashboard</span>
                                <i class="fas fa-store text-[#06B6D4]"></i>
                            </a>
                        ` : ''}

                        ${canSeeAdmin ? `
                            <a href="${routes.admin}" class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-700">
                                <span>Admin Panel</span>
                                <i class="fas fa-gauge-high text-[#06B6D4]"></i>
                            </a>
                        ` : ''}
                    </div>
                </div>

            </div>
        </nav>
    `;
}

function buildGuestActions(routes) {
    return `
        <a href="${routes.login}" class="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700">
            <i class="fas fa-user text-[#06B6D4]"></i>
            <span class="hidden sm:inline">Login</span>
        </a>

        <a href="${routes.register}" class="hidden h-10 items-center rounded-xl px-3 text-sm font-black text-[#06B6D4] transition hover:bg-cyan-50 sm:inline-flex">
            Register
        </a>
    `;
}

function buildLoggedInAccount({ accountLabel, fullName, initials, routes, canSeeSeller, canSeeAdmin }) {
    return `
        <div id="navbarAccountWrap" class="relative">
            <button id="navbarAccountBtn" type="button" class="inline-flex h-11 max-w-[140px] items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 sm:max-w-[190px]" aria-expanded="false" aria-haspopup="true">
                <span id="navbarAvatarSmall" class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-100 text-xs font-black uppercase text-cyan-700">${escapeHTML(initials)}</span>
                <span id="navbarGreeting" class="hidden truncate sm:inline">${accountLabel}</span>
                <i class="fas fa-chevron-down hidden text-[11px] text-slate-400 sm:inline"></i>
            </button>

            <div id="navbarAccountMenu" class="absolute left-0 top-[calc(100%+0.75rem)] z-50 hidden w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-2xl shadow-slate-900/15 sm:left-auto sm:right-0" role="menu">
                <div class="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-4">
                    <span id="navbarAvatarLarge" class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#06B6D4] text-sm font-black uppercase text-white">${escapeHTML(initials)}</span>

                    <div class="min-w-0 flex-1">
                        <p id="navbarFullName" class="truncate text-sm font-black text-slate-950">${escapeHTML(fullName)}</p>
                        <a href="${routes.profile}" class="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#06B6D4]">
                            Your Profile
                            <i class="fas fa-chevron-left text-[10px]"></i>
                        </a>
                    </div>
                </div>

                <div class="p-2">
                    ${dropdownLink(routes.profile, 'fa-user', 'My Profile')}
                    ${dropdownLink(routes.orders, 'fa-bag-shopping', 'Orders')}
                    ${dropdownLink(routes.wishlist, 'fa-heart', 'Wishlist')}
                    ${dropdownLink(routes.seller, 'fa-store', 'Seller Dashboard', 'sellerDashboardLink', canSeeSeller)}
                    ${dropdownLink(routes.admin, 'fa-gauge-high', 'Admin Panel', 'adminDashboardLink', canSeeAdmin)}
                    ${dropdownLink(routes.help, 'fa-circle-question', 'Need Help?')}
                </div>

                <div class="border-t border-slate-100 p-2">
                    <button type="button" onclick="navbarLogout()" class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right text-sm font-black text-red-600 transition hover:bg-red-50" role="menuitem">
                        <i class="fas fa-right-from-bracket"></i>
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function dropdownLink(href, icon, label, id = '', visible = true) {
    return `
        <a href="${href}" ${id ? `id="${id}"` : ''} class="${visible ? '' : 'hidden'} flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700" role="menuitem">
            <i class="fas ${icon} w-5 text-center text-[#06B6D4]"></i>
            <span>${label}</span>
        </a>
    `;
}

function wireNavbarSearch(homePath) {
    const submitSearch = input => {
        const query = String(input && input.value || '').trim();
        window.location.href = query ? `${homePath}?search=${encodeURIComponent(query)}` : homePath;
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
    });
}

function closeAccountDropdown() {
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

function wireAccountDropdown() {
    const wrap = document.getElementById('navbarAccountWrap');
    const button = document.getElementById('navbarAccountBtn');
    const menu = document.getElementById('navbarAccountMenu');

    if (!wrap || !button || !menu) return;

    button.addEventListener('click', event => {
        event.stopPropagation();

        const willOpen = menu.classList.contains('hidden');

        closeMobileMenu();

        menu.classList.toggle('hidden', !willOpen);
        button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.addEventListener('click', event => {
        if (!wrap.contains(event.target)) {
            closeAccountDropdown();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeAccountDropdown();
        }
    });
}

function wireMobileMenu() {
    const button = document.getElementById('navbarMobileMenuBtn');
    const menu = document.getElementById('navbarMobileMenu');

    if (!button || !menu) return;

    button.addEventListener('click', event => {
        event.stopPropagation();

        const willOpen = menu.classList.contains('hidden');

        closeAccountDropdown();

        menu.classList.toggle('hidden', !willOpen);
        button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.addEventListener('click', event => {
        if (!menu.contains(event.target) && !button.contains(event.target)) {
            closeMobileMenu();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMobileMenu();
        }
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
        button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });

    document.querySelectorAll('[data-theme-label]').forEach(label => {
        label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });

    document.querySelectorAll('[data-theme-icon]').forEach(icon => {
        icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'} text-[#06B6D4]`;
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
    const fullName = getFullName(user);
    const initials = getInitials(fullName || user.first_name || 'User');

    setText('navbarGreeting', user.first_name ? `Hi, ${user.first_name}` : 'Account');
    setText('navbarFullName', fullName || 'Your account');
    setText('navbarAvatarSmall', initials);
    setText('navbarAvatarLarge', initials);

    const sellerLink = document.getElementById('sellerDashboardLink');
    const adminLink = document.getElementById('adminDashboardLink');

    if (sellerLink) {
        sellerLink.href = routes.seller;
        sellerLink.classList.toggle('hidden', !(user.role === 'seller' || user.seller_status === 'approved_seller'));
    }

    if (adminLink) {
        adminLink.href = routes.admin;
        adminLink.classList.toggle('hidden', user.role !== 'admin');
    }
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

    if (!parts.length) return 'U';

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

    const token = localStorage.getItem('spider_token') || localStorage.getItem('token') || getCookieValue('spider_token');

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
        .reduce((found, part) => found || (part.startsWith(encodedName) ? decodeURIComponent(part.slice(encodedName.length)) : null), null);
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
