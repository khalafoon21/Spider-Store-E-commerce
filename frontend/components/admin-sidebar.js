function ensureAdminUiFeedbackScript() {
    if (window.AppUI || document.querySelector('script[data-ui-feedback]')) return;

    const script = document.createElement('script');
    script.src = '../../components/ui-feedback.js';
    script.dataset.uiFeedback = 'true';
    document.head.appendChild(script);
}

function ensureAdminAppStateScript() {
    if (window.AppState || document.querySelector('script[data-app-state]')) return;

    const script = document.createElement('script');
    script.src = '../../components/app-state.js';
    script.dataset.appState = 'true';
    document.head.appendChild(script);
}

function getStoredAdminToken() {
    if (window.AppState && typeof window.AppState.getToken === 'function') {
        return window.AppState.getToken();
    }

    return (
        localStorage.getItem('spider_token') ||
        localStorage.getItem('token') ||
        getCookieValue('spider_token')
    );
}

async function getLiveAdminRole(token) {
    const decodedRole = decodeAdminRole(token);

    if (decodedRole === 'admin') return decodedRole;

    try {
        const response = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json().catch(() => ({}));

        return result && result.data ? result.data.role : decodedRole;
    } catch (error) {
        return decodedRole;
    }
}

async function loadAdminSidebar(activePage) {
    ensureAdminAppStateScript();
    ensureAdminUiFeedbackScript();

    const token = getStoredAdminToken();
    const role = await getLiveAdminRole(token);

    if (!token || role !== 'admin') {
        window.location.href = '../auth/login.html';
        return;
    }

    const layout = document.getElementById('admin-layout') || document.body;

    document.documentElement.classList.add('overflow-x-hidden');
    document.body.classList.add('overflow-x-hidden');

    if (document.getElementById('adminSidebarRoot')) {
        setActiveAdminLink(activePage);
        return;
    }

    const sidebarHTML = `
        <div id="adminSidebarRoot">
            <div class="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-white shadow-md md:hidden">
                <a href="dashboard.html" class="text-xl font-black text-primary-500">
                    Spider<span class="text-white">Admin</span>
                </a>

                <button
                    type="button"
                    id="mobileMenuBtn"
                    class="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 hover:text-primary-500"
                    aria-label="فتح القائمة"
                    aria-expanded="false"
                    aria-controls="sidebar"
                >
                    <i class="fas fa-bars text-xl"></i>
                </button>
            </div>

            <div id="sidebarOverlay" class="fixed inset-0 z-40 hidden bg-black/50 md:hidden"></div>

            <aside
                id="sidebar"
                class="fixed right-0 top-0 z-50 flex h-screen w-64 translate-x-full flex-col overflow-y-auto border-l border-slate-800 bg-slate-950 text-white shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0"
            >
                <div class="flex min-h-20 items-center justify-between border-b border-slate-800 px-5">
                    <a href="dashboard.html" class="hidden text-2xl font-black text-primary-500 md:block">
                        Spider<span class="text-white">Admin</span>
                    </a>

                    <h2 class="text-xl font-black text-primary-500 md:hidden">القائمة</h2>

                    <button
                        type="button"
                        id="closeSidebarBtn"
                        class="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white md:hidden"
                        aria-label="إغلاق القائمة"
                    >
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <nav class="flex-1 space-y-2 p-4">
                    ${adminNavLink('dashboard.html', 'dashboard', activePage, 'fa-box-open', 'إدارة الطلبات')}
                    ${adminNavLink('add-product.html', 'add-product', activePage, 'fa-plus-circle', 'إضافة منتج')}
                    ${adminNavLink('manage-products.html', 'manage-products', activePage, 'fa-pen-to-square', 'المنتجات')}
                    ${adminNavLink('add-category.html', 'add-category', activePage, 'fa-tags', 'إضافة قسم')}
                    ${adminNavLink('manage-tags.html', 'manage-tags', activePage, 'fa-hashtag', 'إدارة الوسوم')}
                    ${adminNavLink('add-banner.html', 'add-banner', activePage, 'fa-images', 'إضافة سلايدر')}
                    ${adminNavLink('users.html', 'users', activePage, 'fa-users', 'إدارة المستخدمين')}
                    ${adminNavLink('sellers.html', 'sellers', activePage, 'fa-store', 'البائعين')}

                    <div class="my-4 border-t border-slate-800"></div>

                    <a href="../../index.html" class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-900 hover:text-primary-500">
                        <i class="fas fa-store w-5 text-center"></i>
                        <span>العودة للمتجر</span>
                    </a>

                    <button
                        type="button"
                        onclick="adminLogout()"
                        class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-bold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                        <i class="fas fa-sign-out-alt w-5 text-center"></i>
                        <span>تسجيل الخروج</span>
                    </button>
                </nav>
            </aside>
        </div>
    `;

    layout.insertAdjacentHTML('afterbegin', sidebarHTML);

    wireAdminSidebarEvents();
}

function adminNavLink(href, pageKey, activePage, icon, label) {
    const isActive = activePage === pageKey;

    return `
        <a
            href="${href}"
            data-admin-page="${pageKey}"
            class="admin-nav-link flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                isActive
                    ? 'bg-slate-800 text-primary-500 shadow-sm'
                    : 'text-slate-200 hover:bg-slate-900 hover:text-primary-500'
            }"
        >
            <i class="fas ${icon} w-5 text-center"></i>
            <span>${label}</span>
        </a>
    `;
}

function setActiveAdminLink(activePage) {
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        const isActive = link.dataset.adminPage === activePage;

        link.className = `admin-nav-link flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
            isActive
                ? 'bg-slate-800 text-primary-500 shadow-sm'
                : 'text-slate-200 hover:bg-slate-900 hover:text-primary-500'
        }`;
    });
}

function wireAdminSidebarEvents() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const openButton = document.getElementById('mobileMenuBtn');
    const closeButton = document.getElementById('closeSidebarBtn');

    if (!sidebar || !overlay || !openButton || !closeButton) return;

    function openSidebar() {
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        openButton.setAttribute('aria-expanded', 'true');
        document.body.classList.add('overflow-hidden');
    }

    function closeSidebar() {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('hidden');
        openButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('overflow-hidden');
    }

    openButton.addEventListener('click', () => {
        if (sidebar.classList.contains('translate-x-full')) {
            openSidebar();
        } else {
            closeSidebar();
        }
    });

    closeButton.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeSidebar();
        }
    });

    document.querySelectorAll('#sidebar a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });
}

function adminLogout() {
    if (window.AppState && typeof window.AppState.clearToken === 'function') {
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

    window.location.href = '../auth/login.html';
}

function logout() {
    adminLogout();
}

function decodeAdminRole(token) {
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role === 'customer' ? 'user' : payload.role;
    } catch (error) {
        return null;
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

window.loadAdminSidebar = loadAdminSidebar;
window.adminLogout = adminLogout;
window.logout = logout;
