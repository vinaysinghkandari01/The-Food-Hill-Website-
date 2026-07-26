/**
 * Food Hill – Main Web Application Logic (app.js)
 * ─────────────────────────────────────────────────────────────
 * Drives Cart, Checkout, Menu Filtering/Search, Table Booking,
 * Wishlist, Admin Modal, Mobile Navigation, and SEO/A11y helpers.
 */

'use strict';

(function () {
  console.log('Food Hill App Initializing...');

  /* ─── CONSTANTS & LOCAL STORAGE KEYS ─── */
  const CART_KEY = 'fh_cart';
  const WISHLIST_KEY = 'fh_wishlist';
  const ORDERS_KEY = 'fh_orders';
  const PROMO_CODES = { 'FOODHILL20': 0.20, 'MOMO10': 0.10, 'WELCOME50': 50 }; // 20%, 10%, ₹50 off

  /* ─── STATE MANAGEMENT ─── */
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  let wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  let activePromo = null;

  /* ─── DEFAULT MENU DATABASE ─── */
  const MENU_DATA = [
    { id: 'm1', name: 'Classic Steam Momos', desc: 'Juicy filling, delicate wrapper, pure Himalayan simplicity.', price: 120, category: 'steamed', tag: 'Bestseller', tagType: 'gold', emoji: '🥟', rating: 4.9, prepTime: '15 mins' },
    { id: 'm2', name: 'Chilli Momo', desc: 'Tossed in our legendary fiery chili sauce with bell peppers.', price: 150, category: 'spicy', tag: '🔥 Spicy', tagType: 'spicy', emoji: '🌶️', rating: 4.8, prepTime: '18 mins' },
    { id: 'm3', name: 'Gravy Momo', desc: 'Slow-simmered rich tomato and butter-infused gravy bath.', price: 160, category: 'gravy', tag: "Chef's Pick", tagType: 'gold', emoji: '🍯', rating: 4.9, prepTime: '20 mins' },
    { id: 'm4', name: 'Veg Momo', desc: 'Garden-fresh veggies, cabbage, paneer, and aromatic mountain spices.', price: 110, category: 'veg', tag: '🌱 Veg', tagType: 'veg', emoji: '🥬', rating: 4.7, prepTime: '12 mins' },
    { id: 'm5', name: 'Tandoori Momo', desc: 'Smoky, charred, marinated in tandoori spices and flame-kissed.', price: 180, category: 'spicy', tag: '🔥 New', tagType: 'spicy', emoji: '🔥', rating: 5.0, prepTime: '22 mins' },
    { id: 'm6', name: 'Cheese Momo', desc: 'Melted mozarella & cheddar cheese inside a golden steamed pocket.', price: 170, category: 'special', tag: 'Crowd Fave', tagType: 'gold', emoji: '🧀', rating: 4.8, prepTime: '15 mins' },
    { id: 'm7', name: 'Kurkure Crunchy Momo', desc: 'Crispy cornflake crusted fried momos served with garlic mayo.', price: 190, category: 'special', tag: 'Chef Special', tagType: 'spicy', emoji: '🍗', rating: 4.9, prepTime: '20 mins' },
    { id: 'm8', name: 'Afghani Malai Momo', desc: 'Rich cashewnut cream & yogurt marinade roasted to velvety perfection.', price: 200, category: 'gravy', tag: 'Premium', tagType: 'gold', emoji: '🧈', rating: 4.9, prepTime: '25 mins' },
    { id: 'm9', name: 'Soup Thukpa Momo', desc: 'Steaming bowl of spicy Himalayan broth noodles with 4 momos.', price: 165, category: 'steamed', tag: 'Comfort Food', tagType: 'veg', emoji: '🍜', rating: 4.8, prepTime: '18 mins' }
  ];

  /* ─── SECURITY HELPER: XSS ESCAPING ─── */
  function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ─── TOAST SYSTEM ─── */
  function showAppToast(msg, type = 'info') {
    let toast = document.getElementById('globalAppToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalAppToast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    const iconMap = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `<span class="toast-icon">${iconMap[type] || '✨'}</span><span>${sanitize(msg)}</span>`;
    toast.className = `app-toast show ${type}`;

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.className = 'app-toast';
    }, 3200);
  }

  /* ─── CART FUNCTIONS ─── */
  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
  }

  function addToCart(itemId, qty = 1) {
    const item = MENU_DATA.find(m => m.id === itemId);
    if (!item) return;

    const existing = cart.find(c => c.id === itemId);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ ...item, qty: qty });
    }
    saveCart();
    showAppToast(`Added ${item.name} to cart! 🥟`, 'success');
  }

  function updateCartItemQty(itemId, newQty) {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    const existing = cart.find(c => c.id === itemId);
    if (existing) {
      existing.qty = newQty;
      saveCart();
    }
  }

  function removeFromCart(itemId) {
    const idx = cart.findIndex(c => c.id === itemId);
    if (idx !== -1) {
      const item = cart[idx];
      cart.splice(idx, 1);
      saveCart();
      showAppToast(`Removed ${item.name} from cart`, 'info');
    }
  }

  function clearCart() {
    cart = [];
    activePromo = null;
    saveCart();
  }

  function getCartSummary() {
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    let delivery = subtotal > 0 ? (subtotal >= 300 ? 0 : 40) : 0;
    
    let discount = 0;
    if (activePromo) {
      if (typeof activePromo.value === 'number' && activePromo.value < 1) {
        discount = Math.round(subtotal * activePromo.value);
      } else {
        discount = Math.min(subtotal, activePromo.value);
      }
    }

    const total = Math.max(0, subtotal + tax + delivery - discount);
    return { itemCount, subtotal, tax, delivery, discount, total };
  }

  function updateCartUI() {
    // 1. Badge counters
    const summary = getCartSummary();
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(b => {
      b.textContent = summary.itemCount;
      b.style.display = summary.itemCount > 0 ? 'flex' : 'none';
    });

    // 2. Cart Drawer contents
    const cartListEl = document.getElementById('cartDrawerList');
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartTaxEl = document.getElementById('cartTax');
    const cartDeliveryEl = document.getElementById('cartDelivery');
    const cartDiscountEl = document.getElementById('cartDiscount');
    const cartDiscountRow = document.getElementById('cartDiscountRow');
    const cartTotalEl = document.getElementById('cartTotal');
    const cartEmptyState = document.getElementById('cartEmptyState');
    const cartFooter = document.getElementById('cartDrawerFooter');

    if (cartListEl) {
      if (cart.length === 0) {
        cartListEl.style.display = 'none';
        if (cartEmptyState) cartEmptyState.style.display = 'flex';
        if (cartFooter) cartFooter.style.display = 'none';
      } else {
        if (cartEmptyState) cartEmptyState.style.display = 'none';
        cartListEl.style.display = 'block';
        if (cartFooter) cartFooter.style.display = 'block';

        cartListEl.innerHTML = cart.map(item => `
          <div class="cart-item-card" data-id="${item.id}">
            <div class="cart-item-emoji">${item.emoji}</div>
            <div class="cart-item-details">
              <h4 class="cart-item-title">${sanitize(item.name)}</h4>
              <div class="cart-item-price">₹${item.price}</div>
            </div>
            <div class="cart-item-controls">
              <button class="cart-qty-btn decrease-qty" aria-label="Decrease quantity" data-id="${item.id}">-</button>
              <span class="cart-qty-num">${item.qty}</span>
              <button class="cart-qty-btn increase-qty" aria-label="Increase quantity" data-id="${item.id}">+</button>
            </div>
            <button class="cart-remove-btn" aria-label="Remove item" data-id="${item.id}">🗑️</button>
          </div>
        `).join('');
      }
    }

    if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${summary.subtotal}`;
    if (cartTaxEl) cartTaxEl.textContent = `₹${summary.tax}`;
    if (cartDeliveryEl) cartDeliveryEl.textContent = summary.delivery === 0 ? 'FREE' : `₹${summary.delivery}`;
    if (cartTotalEl) cartTotalEl.textContent = `₹${summary.total}`;

    if (cartDiscountEl && cartDiscountRow) {
      if (summary.discount > 0) {
        cartDiscountRow.style.display = 'flex';
        cartDiscountEl.textContent = `-₹${summary.discount}`;
      } else {
        cartDiscountRow.style.display = 'none';
      }
    }
  }

  /* ─── MENU RENDER & FILTERING ─── */
  function renderMenu(items) {
    const menuGrid = document.getElementById('menuGridContainer');
    if (!menuGrid) return;

    if (items.length === 0) {
      menuGrid.innerHTML = `
        <div class="menu-empty-state">
          <div class="empty-icon">🥟</div>
          <h3>No Momos Found</h3>
          <p>Try searching for another dish or selecting a different category.</p>
        </div>
      `;
      return;
    }

    menuGrid.innerHTML = items.map(item => {
      const isWishlisted = wishlist.includes(item.id);
      return `
        <div class="menu-card menu-card--enhanced ${item.category === 'spicy' ? 'menu-card--hot' : ''}" data-id="${item.id}" data-category="${item.category}">
          <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${item.id}" aria-label="Add to Wishlist" title="Wishlist">
            ${isWishlisted ? '❤️' : '🤍'}
          </button>
          <div class="menu-emoji">${item.emoji}</div>
          <div class="menu-info">
            <div class="menu-header-row">
              <h3>${sanitize(item.name)}</h3>
              <span class="menu-rating">⭐ ${item.rating}</span>
            </div>
            <p>${sanitize(item.desc)}</p>
            <div class="menu-meta-row">
              <span class="menu-tag menu-tag--${item.tagType}">${sanitize(item.tag)}</span>
              <span class="menu-time">⏱️ ${item.prepTime}</span>
            </div>
            <div class="menu-card-bottom">
              <div class="menu-price">₹${item.price}</div>
              <button class="btn-add-cart" data-id="${item.id}" type="button">
                <span>Add to Cart</span>
                <span class="cart-btn-icon">🛒</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function setupMenuFilters() {
    let currentCategory = 'all';
    let searchQuery = '';
    let sortOrder = 'default';

    function filterAndRender() {
      let filtered = [...MENU_DATA];

      // 1. Category filter
      if (currentCategory !== 'all') {
        filtered = filtered.filter(item => item.category === currentCategory);
      }

      // 2. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(q) || 
          item.desc.toLowerCase().includes(q)
        );
      }

      // 3. Sorting
      if (sortOrder === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortOrder === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortOrder === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      }

      renderMenu(filtered);
    }

    // Category Tabs click listeners
    const categoryTabs = document.querySelectorAll('.menu-cat-btn');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        filterAndRender();
      });
    });

    // Search input listener
    const searchInput = document.getElementById('menuSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value;
        filterAndRender();
      });
    }

    // Sort select listener
    const sortSelect = document.getElementById('menuSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        sortOrder = e.target.value;
        filterAndRender();
      });
    }

    // Initial render
    filterAndRender();
  }

  /* ─── WISHLIST HANDLER ─── */
  function toggleWishlist(itemId) {
    const idx = wishlist.indexOf(itemId);
    const item = MENU_DATA.find(m => m.id === itemId);
    if (idx !== -1) {
      wishlist.splice(idx, 1);
      showAppToast(`Removed ${item ? item.name : 'item'} from wishlist`, 'info');
    } else {
      wishlist.push(itemId);
      showAppToast(`Saved ${item ? item.name : 'item'} to wishlist! ❤️`, 'success');
    }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));

    const searchInput = document.getElementById('menuSearchInput');
    const sortSelect = document.getElementById('menuSortSelect');
    const activeTab = document.querySelector('.menu-cat-btn.active');
    
    let currentCategory = activeTab ? activeTab.dataset.category : 'all';
    let searchQuery = searchInput ? searchInput.value : '';
    let sortOrder = sortSelect ? sortSelect.value : 'default';

    let filtered = [...MENU_DATA];
    if (currentCategory !== 'all') filtered = filtered.filter(i => i.category === currentCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
    }
    if (sortOrder === 'price-low') filtered.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') filtered.sort((a, b) => b.price - a.price);
    else if (sortOrder === 'rating') filtered.sort((a, b) => b.rating - a.rating);

    renderMenu(filtered);
  }

  /* ─── CHECKOUT & ORDER FLOW ─── */
  function setupCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    const openCheckoutBtn = document.getElementById('cartCheckoutBtn');
    const closeCheckoutBtn = document.getElementById('checkoutModalClose');
    const checkoutForm = document.getElementById('checkoutForm');
    const orderSuccessOverlay = document.getElementById('orderSuccessOverlay');
    const orderSuccessClose = document.getElementById('orderSuccessClose');

    function populateCheckoutSummary() {
      const checkoutItemsList = document.getElementById('checkoutItemsSummary');
      const checkoutTotalAmount = document.getElementById('checkoutTotalAmount');
      const summary = getCartSummary();

      if (checkoutItemsList) {
        checkoutItemsList.innerHTML = cart.map(item => `
          <div class="ck-summary-item">
            <span>${item.qty}× ${sanitize(item.name)}</span>
            <span>₹${item.price * item.qty}</span>
          </div>
        `).join('');
      }

      if (checkoutTotalAmount) {
        checkoutTotalAmount.textContent = `₹${summary.total}`;
      }
    }

    if (openCheckoutBtn) {
      openCheckoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
          showAppToast('Your cart is empty!', 'warning');
          return;
        }
        populateCheckoutSummary();
        closeCartDrawer();
        if (checkoutModal) {
          checkoutModal.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      });
    }

    if (closeCheckoutBtn && checkoutModal) {
      closeCheckoutBtn.addEventListener('click', () => {
        checkoutModal.classList.remove('open');
        document.body.style.overflow = '';
      });
    }

    if (checkoutForm) {
      checkoutForm.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = checkoutForm.querySelector('button[type="submit"]');

        const name = document.getElementById('ckName')?.value.trim();
        const phone = document.getElementById('ckPhone')?.value.trim();
        const address = document.getElementById('ckAddress')?.value.trim();
        const payment = document.querySelector('input[name="ckPayment"]:checked')?.value || 'COD';

        let valid = true;
        if (!name || name.length < 2) {
          showAppToast('Please enter a valid full name.', 'warning');
          valid = false;
        } else if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
          showAppToast('Please enter a valid 10-digit phone number.', 'warning');
          valid = false;
        } else if (!address || address.length < 5) {
          showAppToast('Please enter your complete delivery address.', 'warning');
          valid = false;
        }

        if (!valid) return;

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('loading');
        }

        await new Promise(r => setTimeout(r, 1400));

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        }

        const summary = getCartSummary();
        const orderId = 'FH-' + Math.floor(100000 + Math.random() * 900000);
        const newOrder = {
          orderId: orderId,
          date: new Date().toISOString(),
          items: [...cart],
          amount: summary.total,
          customer: { name, phone, address },
          paymentMethod: payment,
          status: 'Confirmed'
        };

        const existingOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        existingOrders.unshift(newOrder);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(existingOrders));

        clearCart();

        if (checkoutModal) checkoutModal.classList.remove('open');

        if (orderSuccessOverlay) {
          document.getElementById('successOrderId').textContent = orderId;
          document.getElementById('successOrderTotal').textContent = `₹${newOrder.amount}`;
          document.getElementById('successCustomerName').textContent = name;
          orderSuccessOverlay.classList.add('open');
        }
      });
    }

    if (orderSuccessClose && orderSuccessOverlay) {
      orderSuccessClose.addEventListener('click', () => {
        orderSuccessOverlay.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  }

  /* ─── TABLE BOOKING FLOW ─── */
  function setupTableBooking() {
    const bookingModal = document.getElementById('tableBookingModal');
    const openBookingBtns = document.querySelectorAll('.btn-book-table');
    const closeBookingBtn = document.getElementById('tableBookingClose');
    const bookingForm = document.getElementById('tableBookingForm');

    openBookingBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (bookingModal) {
          bookingModal.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    if (closeBookingBtn && bookingModal) {
      closeBookingBtn.addEventListener('click', () => {
        bookingModal.classList.remove('open');
        document.body.style.overflow = '';
      });
    }

    if (bookingForm) {
      bookingForm.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = bookingForm.querySelector('button[type="submit"]');

        const name = document.getElementById('tbName')?.value.trim();
        const phone = document.getElementById('tbPhone')?.value.trim();
        const date = document.getElementById('tbDate')?.value;
        const time = document.getElementById('tbTime')?.value;
        const guests = document.getElementById('tbGuests')?.value;

        if (!name || !phone || !date || !time) {
          showAppToast('Please fill in all required fields.', 'warning');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('loading');
        }

        await new Promise(r => setTimeout(r, 1200));

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        }

        bookingForm.reset();
        if (bookingModal) bookingModal.classList.remove('open');
        document.body.style.overflow = '';

        showAppToast(`Table reserved for ${sanitize(name)} (${guests} guests) on ${date} at ${time}! 🎉`, 'success');
      });
    }
  }

  /* ─── ADMIN PANEL MODAL ─── */
  function setupAdminModal() {
    const adminModal = document.getElementById('adminModal');
    const openAdminBtns = document.querySelectorAll('.open-admin-btn');
    const closeAdminBtn = document.getElementById('adminModalClose');

    openAdminBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (adminModal) {
          populateAdminStats();
          adminModal.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    if (closeAdminBtn && adminModal) {
      closeAdminBtn.addEventListener('click', () => {
        adminModal.classList.remove('open');
        document.body.style.overflow = '';
      });
    }

    function populateAdminStats() {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      const users = JSON.parse(localStorage.getItem('fh_users') || '[]');
      const revenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

      const totalOrdersEl = document.getElementById('adminTotalOrders');
      const totalRevenueEl = document.getElementById('adminTotalRevenue');
      const totalUsersEl = document.getElementById('adminTotalUsers');
      const recentOrdersList = document.getElementById('adminRecentOrdersList');

      if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
      if (totalRevenueEl) totalRevenueEl.textContent = `₹${revenue}`;
      if (totalUsersEl) totalUsersEl.textContent = users.length;

      if (recentOrdersList) {
        if (orders.length === 0) {
          recentOrdersList.innerHTML = '<p class="text-muted" style="color:var(--clr-muted)">No orders placed yet.</p>';
        } else {
          recentOrdersList.innerHTML = orders.slice(0, 5).map(o => `
            <div class="admin-order-row" style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:8px">
              <div>
                <strong>${o.orderId}</strong> — ${sanitize(o.customer.name)} (${o.items.length} items)
              </div>
              <div style="display:flex;gap:8px">
                <span class="badge badge--gold">₹${o.amount}</span>
                <span class="badge">${o.status}</span>
              </div>
            </div>
          `).join('');
        }
      }
    }
  }

  /* ─── MOBILE DRAWER & NAVIGATION ─── */
  function setupMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');
    const mobileNavClose = document.getElementById('mobileNavClose');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (hamburgerBtn && mobileNavDrawer) {
      hamburgerBtn.addEventListener('click', () => {
        mobileNavDrawer.classList.add('open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      });
    }

    if (mobileNavClose && mobileNavDrawer) {
      mobileNavClose.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('open');
        if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    }

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (mobileNavDrawer) mobileNavDrawer.classList.remove('open');
        if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ─── CART DRAWER OPEN/CLOSE ─── */
  function openCartDrawer() {
    const cartDrawer = document.getElementById('cartDrawer');
    if (cartDrawer) {
      cartDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCartDrawer() {
    const cartDrawer = document.getElementById('cartDrawer');
    if (cartDrawer) {
      cartDrawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function setupCartDrawer() {
    const cartTriggers = document.querySelectorAll('.open-cart-trigger');
    const closeBtn = document.getElementById('cartDrawerClose');
    const backdrop = document.getElementById('cartDrawerBackdrop');
    const applyPromoBtn = document.getElementById('applyPromoBtn');
    const promoInput = document.getElementById('promoCodeInput');

    cartTriggers.forEach(btn => btn.addEventListener('click', openCartDrawer));
    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
    if (backdrop) backdrop.addEventListener('click', closeCartDrawer);

    const cartListEl = document.getElementById('cartDrawerList');
    if (cartListEl) {
      cartListEl.addEventListener('click', e => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('increase-qty')) {
          const item = cart.find(c => c.id === id);
          if (item) updateCartItemQty(id, item.qty + 1);
        } else if (e.target.classList.contains('decrease-qty')) {
          const item = cart.find(c => c.id === id);
          if (item) updateCartItemQty(id, item.qty - 1);
        } else if (e.target.classList.contains('cart-remove-btn')) {
          removeFromCart(id);
        }
      });
    }

    if (applyPromoBtn && promoInput) {
      applyPromoBtn.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();
        if (!code) return;
        if (PROMO_CODES[code] !== undefined) {
          activePromo = { code: code, value: PROMO_CODES[code] };
          showAppToast(`Promo code '${code}' applied! 🎉`, 'success');
          updateCartUI();
        } else {
          showAppToast('Invalid promo code. Try FOODHILL20!', 'warning');
        }
      });
    }
  }

  /* ─── CONTACT FORM HANDLER ─── */
  window.handleFormSubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    const inputs = form.querySelectorAll('input, textarea');
    let valid = true;

    inputs.forEach(input => {
      if (input.hasAttribute('required') && !input.value.trim()) {
        valid = false;
      }
    });

    if (!valid) {
      showAppToast('Please fill out all required fields.', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending... ⏳';
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message 🥟';
      }
      form.reset();
      showAppToast('Thank you! Your message has been received. We will respond shortly.', 'success');
    }, 1200);
  };

  /* ─── EVENT DELEGATION FOR MENU CARDS ─── */
  document.addEventListener('click', e => {
    const addCartBtn = e.target.closest('.btn-add-cart');
    if (addCartBtn) {
      const itemId = addCartBtn.dataset.id;
      addToCart(itemId, 1);
      addCartBtn.classList.add('added');
      setTimeout(() => addCartBtn.classList.remove('added'), 800);
      return;
    }

    const wishlistBtn = e.target.closest('.wishlist-btn');
    if (wishlistBtn) {
      const itemId = wishlistBtn.dataset.id;
      toggleWishlist(itemId);
      return;
    }
  });

  /* ─── ESCAPE KEY CLOSE ALL MODALS ─── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      const checkoutModal = document.getElementById('checkoutModal');
      const tableBookingModal = document.getElementById('tableBookingModal');
      const adminModal = document.getElementById('adminModal');
      const orderSuccessOverlay = document.getElementById('orderSuccessOverlay');

      if (checkoutModal) checkoutModal.classList.remove('open');
      if (tableBookingModal) tableBookingModal.classList.remove('open');
      if (adminModal) adminModal.classList.remove('open');
      if (orderSuccessOverlay) orderSuccessOverlay.classList.remove('open');

      document.body.style.overflow = '';
    }
  });

  /* ─── INITIALIZATION ON DOM LOAD ─── */
  document.addEventListener('DOMContentLoaded', () => {
    setupMenuFilters();
    setupCartDrawer();
    setupCheckout();
    setupTableBooking();
    setupAdminModal();
    setupMobileMenu();
    updateCartUI();
  });

})();
