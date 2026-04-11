function loadMainNavbar() {
    // 1. تحديد مستوى الفولدر عشان نظبط المسارات (../)
    // لو إحنا في الصفحة الرئيسية، المسار فاضي. لو جوه صفحات، بنرجع لورا.
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('frontend/');
    const pathPrefix = isHomePage ? '' : '../../';
    const authPathPrefix = isHomePage ? 'pages/auth/' : '../auth/';
    const cartPathPrefix = isHomePage ? 'pages/cart/' : '../cart/';
    const profilePathPrefix = isHomePage ? 'pages/profile/' : '../profile/';

    const token = localStorage.getItem('spider_token');

    const navbarHTML = `
    <nav class="bg-primary-600 text-white shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
            <a href="${pathPrefix}index.html" class="text-2xl font-bold tracking-wider hover:text-secondary-500 smooth-transition">
                Spider<span class="text-secondary-500">Store</span>
            </a>

            <div class="hidden md:flex flex-1 mx-12 relative">
                <input type="text" id="searchInput" placeholder="ابحث عن المنتجات..." 
                    class="w-full pl-10 pr-4 py-2 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary-500 border-none shadow-sm">
                <button onclick="typeof searchProducts === 'function' ? searchProducts() : window.location.href='${pathPrefix}index.html'" class="absolute left-0 top-0 h-full px-4 bg-secondary-500 text-white rounded-l-md hover:bg-yellow-500 smooth-transition">
                    <i class="fas fa-search"></i>
                </button>
            </div>

            <div class="flex items-center gap-6">
                <a href="${token ? profilePathPrefix + 'profile.html' : authPathPrefix + 'login.html'}" id="authLink" class="hover:text-secondary-500 smooth-transition text-sm font-medium">
                    <i class="fas fa-user ml-1"></i> ${token ? 'حسابي' : 'دخول'}
                </a> 
                
                <a href="${cartPathPrefix}cart.html" class="relative hover:text-secondary-500 smooth-transition flex items-center">
                    <i class="fas fa-shopping-cart text-xl"></i>
                    <span id="cartCountBadge" class="absolute -top-2 -right-2 bg-secondary-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">0</span>
                </a>
            </div>
        </div>
    </nav>
    `;

    // حقن الناف بار في أول الـ body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // تحديث رقم السلة فوراً
    updateGlobalCartCount();
}

function updateGlobalCartCount() {
    let cart = JSON.parse(localStorage.getItem('spider_cart')) || [];
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCountBadge');
    if (badge) badge.textContent = totalItems;
}

// تشغيل الدالة تلقائياً
loadMainNavbar();