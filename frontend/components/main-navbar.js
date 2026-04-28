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

        const data = await response.json();
        const items = data.data || data.cart || [];
        badge.textContent = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
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
                        <span class="grid h-9 w-9 place-items-center rounded-xl bg-[#06B6D4] text-lg font-black text-white shadow-md shadow-cyan-200 sm:h-10 sm:w-10">S</span>
                        <span class="text-lg font-black tracking-normal sm:text-xl lg:text-2xl">Spider <span class="text-[#06B6D4]">Store</span></span>
                    </a>

                    <form id="navbarSearchForm" class="relative hidden min-w-0 flex-1 lg:block" role="search">
                        <i class="fas fa-search pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#06B6D4]"></i>
                        <input id="navbarSearchInput" type="search" placeholder="What are you looking for?" autocomplete="off"
                            class="h-12 w-full rounded-full border border-slate-200 bg-slate-50 py-0 pl-5 pr-12 text-[15px] text-slate-950 outline-none transition focus:border-[#06B6D4] focus:bg-white focus:ring-4 focus:ring-cyan-100">
                    </form>

                    <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2" dir="rtl">
                        <button type="button" class="hidden h-10 items-center rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 xl:inline-flex">
                            العربية | EN
                        </button>

                        ${token ? buildLoggedInAccount({ accountLabel, fullName, initials, routes, canSeeSeller, canSeeAdmin }) : buildGuestActions(routes)}

                        <a href="${routes.orders}" class="hidden h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 md:inline-flex">
                            <i class="fas fa-bag-shopping"></i>
                            <span>Orders</span>
                        </a>

                        <a href="${routes.wishlist}" class="hidden h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 md:inline-flex">
                            <i class="fas fa-heart"></i>
                            <span>Wishlist</span>
                        </a>

                        <a href="${routes.cart}" class="relative grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-950 transition hover:bg-cyan-50 hover:text-cyan-700" aria-label="Cart">
                            <i class="fas fa-cart-shopping text-lg"></i>
                            <span id="cartCountBadge" class="absolute -left-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#06B6D4] px-1 text-[11px] font-black leading-none text-white">0</span>
                        </a>

                        <button id="navbarMobileMenuBtn" type="button" class="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-950 transition hover:bg-cyan-50 hover:text-cyan-700 lg:hidden" aria-expanded="false" aria-controls="navbarMobileMenu">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </div>

                <form id="navbarMobileSearchForm" class="relative block lg:hidden" role="search">
                    <i class="fas fa-search pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#06B6D4]"></i>
                    <input id="navbarMobileSearchInput" type="search" placeholder="What are you looking for?" autocomplete="off"
                        class="h-11 w-full rounded-full border border-slate-200 bg-slate-50 py-0 pl-5 pr-12 text-[15px] text-slate-950 outline-none transition focus:border-[#06B6D4] focus:bg-white focus:ring-4 focus:ring-cyan-100">
                </form>

                <div id="navbarMobileMenu" class="hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 lg:hidden" dir="rtl">
                    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <a href="${routes.orders}" class="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
                            <i class="fas fa-bag-shopping text-[#06B6D4]"></i> Orders
                        </a>
                        <a href="${routes.wishlist}" class="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
                            <i class="fas fa-heart text-[#06B6D4]"></i> Wishlist
                        </a>
                        <button type="button" class="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
                            <i class="fas fa-language text-[#06B6D4]"></i> العربية | EN
                        </button>
                        <a href="${routes.help}" class="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
                            <i class="fas fa-circle-question text-[#06B6D4]"></i> Need Help?
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    `;
}

function buildGuestActions(routes) {
    return `
        <a href="${routes.login}" class="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700">
            <i class="fas fa-user"></i>
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
            <button id="navbarAccountBtn" type="button" class="inline-flex h-10 max-w-[150px] items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 sm:max-w-[190px]" aria-expanded="false" aria-haspopup="true">
                <span id="navbarAvatarSmall" class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-100 text-xs font-black uppercase text-cyan-700">${escapeHTML(initials)}</span>
                <span id="navbarGreeting" class="hidden truncate sm:inline">${accountLabel}</span>
                <i class="fas fa-chevron-down hidden text-[11px] text-slate-400 sm:inline"></i>
            </button>

            <div id="navbarAccountMenu" class="absolute left-0 top-[calc(100%+0.75rem)] z-50 hidden w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-2xl shadow-slate-900/15 sm:left-auto sm:right-0" role="menu">
                <div class="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-4">
                    <span id="navbarAvatarLarge" class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#06B6D4] text-sm font-black uppercase text-white">${escapeHTML(initials)}</span>
                    <div class="min-w-0 flex-1">
                        <p id="navbarFullName" class="truncate text-sm font-black text-slate-950">${escapeHTML(fullName)}</p>
                        <a href="${routes.profile}" class="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#06B6D4]">Your Profile <i class="fas fa-chevron-left text-[10px]"></i></a>
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

function wireAccountDropdown() {
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

function wireMobileMenu() {
    const button = document.getElementById('navbarMobileMenuBtn');
    const menu = document.getElementById('navbarMobileMenu');
    if (!button || !menu) return;

    const close = () => {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
    };

    button.addEventListener('click', event => {
        event.stopPropagation();
        const willOpen = menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !willOpen);
        button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.addEventListener('click', event => {
        if (!menu.contains(event.target) && !button.contains(event.target)) close();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') close();
    });
}

function hydrateNavbarUser(routes) {
    const token = getStoredToken();
    if (!token) return;

    fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
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
    return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function navbarLogout() {
    if (window.AppState) {
        window.AppState.clearToken();
        if (typeof window.AppState.clearCart === 'function') window.AppState.clearCart();
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
