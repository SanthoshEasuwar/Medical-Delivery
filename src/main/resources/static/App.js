/* ============================================================
   MedDelivery — App.js  (Full Rewrite)
   ============================================================ */

'use strict';

const API = '/api';

/* ─── STATE ─── */
let allMeds       = [];
let allStores     = [];
let storeMeds     = [];
let storeOrders   = [];
let storeRxs      = [];
let cart          = JSON.parse(localStorage.getItem('mdCart') || '[]');
let activeStoreId = null;
let loginRole     = 'PATIENT';
let regRole       = 'PATIENT';
let currentUser   = null;
let editingMedId  = null;   // tracks which med is being edited

/* ════════════════════════════════════════
   AUTH
   ════════════════════════════════════════ */

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabReg').classList.toggle('active', !isLogin);
  const slider = document.getElementById('tabSlider');
  slider.style.transform = isLogin ? 'translateX(0)' : 'translateX(calc(100% + 4px))';
  document.getElementById('formLogin').classList.toggle('active', isLogin);
  document.getElementById('formRegister').classList.toggle('active', !isLogin);
}

function setLoginRole(role) {
  loginRole = role;
  document.getElementById('lrPatient').classList.toggle('active', role === 'PATIENT');
  document.getElementById('lrStore').classList.toggle('active', role === 'STORE');
}

function setRegRole(role) {
  regRole = role;
  document.getElementById('rrPatient').classList.toggle('active', role === 'PATIENT');
  document.getElementById('rrStore').classList.toggle('active', role === 'STORE');
}

async function login() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { toast('Please fill in all fields.', 'err'); return; }
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: loginRole })
    });
    if (!res.ok) throw new Error(await res.text());
    currentUser = await res.json();
    localStorage.setItem('mdUser', JSON.stringify(currentUser));
    onLoginSuccess();
  } catch (e) {
    toast('Login failed: ' + e.message, 'err');
  }
}

async function register() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name || !email || !password) { toast('Please fill in all fields.', 'err'); return; }
  if (password.length < 6) { toast('Password must be at least 6 characters.', 'err'); return; }
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: regRole })
    });
    if (!res.ok) throw new Error(await res.text());
    toast('Account created! Please sign in.', 'ok');
    switchTab('login');
    document.getElementById('loginEmail').value = email;
  } catch (e) {
    toast('Registration failed: ' + e.message, 'err');
  }
}

function onLoginSuccess() {
  if (currentUser && currentUser.role === 'ADMIN') {
    onAdminLoginSuccess();
    return;
  }
  showApp();
  renderUserChip();
  buildNav();

  if (currentUser.role === 'STORE') {
    go('store');
    initOwnerDashboard();
  } else {
    document.getElementById('heroTag').textContent = `👋 Welcome, ${currentUser.name || 'there'}!`;
    if (currentUser.email) {
      document.getElementById('trackEmail').value = currentUser.email;
      document.getElementById('pEmail').value     = currentUser.email;
    }
    document.getElementById('pName').value = currentUser.name || '';
    go('home');
    initPatient();
    loadPatientPrescriptionRequests();
    if (currentUser.email) trackOrders();
  }

  updateCartUI();
  toast(`Welcome back, ${currentUser.name || currentUser.email}! 🎉`, 'ok');
}

function logout() {
  // Hide admin page if it was open
  const adminPage = document.getElementById('page-admin');
  if (adminPage) adminPage.style.display = 'none';
  adminUsers = []; adminStores = []; adminOrders = []; adminRxs = [];
  currentUser = null;
  localStorage.removeItem('mdUser');
  cart = [];
  saveCart();
  updateCartUI();
  showAuth();
  toast('Signed out successfully.', '');
}

/* ─── SCREEN SWITCHES ─── */
function showAuth() {
  document.getElementById('authScreen').classList.add('active');
  document.getElementById('mainApp').classList.remove('active');
}
function showApp() {
  document.getElementById('authScreen').classList.remove('active');
  document.getElementById('mainApp').classList.add('active');
}

/* ─── USER CHIP ─── */
function renderUserChip() {
  if (!currentUser) return;
  const initials = (currentUser.name || currentUser.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('userAv').textContent = initials;
  document.getElementById('userName').textContent = currentUser.name || currentUser.email || '—';
  const badge = document.getElementById('roleBadge');
  if (currentUser.role === 'STORE') {
    badge.textContent = 'Store'; badge.className = 'role-badge store';
  } else if (currentUser.role === 'ADMIN') {
    badge.textContent = 'Admin'; badge.className = 'role-badge admin';
  } else {
    badge.textContent = 'Patient'; badge.className = 'role-badge';
  }
}

/* ─── NAV ─── */
function buildNav() {
  const nc  = document.getElementById('navTabs');
  const fab = document.getElementById('cartFab');
  if (!currentUser) { nc.innerHTML = ''; fab.style.display = 'none'; return; }

  if (currentUser.role === 'STORE') {
    nc.innerHTML = `<button class="nav-tab active" data-page="store" onclick="go('store')">🏪 My Store</button>`;
    fab.style.display = 'none';
  } else {
    nc.innerHTML = `
      <button class="nav-tab active" data-page="home"         onclick="go('home')">🏠 Home</button>
      <button class="nav-tab"        data-page="medicines"    onclick="go('medicines')">💊 Browse</button>
      <button class="nav-tab"        data-page="prescription" onclick="go('prescription')">📄 Prescription</button>
      <button class="nav-tab"        data-page="orders"       onclick="go('orders')">📦 My Orders</button>
    `;
    fab.style.display = 'flex';
  }
}

/* ─── PAGE NAVIGATION ─── */
function go(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.page === page);
  });
  if (page === 'medicines' && allMeds.length === 0) initPatient();
  if (page === 'prescription') loadPatientPrescriptionRequests();
}

/* ════════════════════════════════════════
   STORE OWNER DASHBOARD
   ════════════════════════════════════════ */

async function initOwnerDashboard() {
  // Set welcome text
  const name = currentUser.name || currentUser.email || 'Owner';
  const el = document.getElementById('ownerWelcomeName');
  if (el) el.textContent = `Welcome back, ${name}! 👋`;

  await loadOwnerStore(); // find myStore, set sidebar info
  await Promise.all([
    loadStoreInventory(),
    loadStoreOrders(),
    loadStorePrescriptionRequests()
  ]);
  updateDashboardStats();
  renderHomeLowStock();
  renderHomeRecentOrders();
}

let myStore = null;

async function loadOwnerStore() {
  try {
    const res = await fetch(`${API}/stores`);
    if (!res.ok) throw new Error();
    const stores = await res.json();
    myStore = stores.find(s => s.ownerId === currentUser.id) || null;
    if (myStore) {
      const nameEl = document.getElementById('sidebarStoreName');
      const subEl  = document.getElementById('sidebarStoreSub');
      if (nameEl) nameEl.textContent = myStore.storeName || 'My Pharmacy';
      if (subEl)  subEl.textContent  = myStore.location  || 'Store Owner';
    }
  } catch { myStore = null; }
}

/* ─── OWNER TAB SWITCH ─── */
function switchOwnerTab(tab) {
  document.querySelectorAll('.owner-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => {
    b.classList.toggle('active', b.dataset.ownerTab === tab);
  });
  const el = document.getElementById('otab-' + tab);
  if (el) el.classList.add('active');

  if (tab === 'profile') {
    if (myStore) {
      document.getElementById('editStoreName').value = myStore.storeName || '';
      document.getElementById('editStoreLocation').value = myStore.location || '';
      document.getElementById('editStoreAddress').value = myStore.address || '';
    }
  }
}

/* ─── STATS ─── */
function updateDashboardStats() {
  const totalOrders = storeOrders.length;
  const revenue     = storeOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const medCount    = storeMeds.length;
  const pendingRx   = storeRxs.filter(r => r.status === 'PENDING').length;

  setText('statTotalOrders', totalOrders);
  setText('statRevenue', '₹' + revenue.toFixed(0));
  setText('statMedCount', medCount);
  setText('statPendingRx', pendingRx);

  // Update badges
  const ordBadge = document.getElementById('pendingOrdersBadge');
  const rxBadge  = document.getElementById('pendingRxBadge');
  const newOrders = storeOrders.filter(o => o.orderStatus === 'PLACED').length;
  if (ordBadge) { ordBadge.textContent = newOrders; ordBadge.style.display = newOrders ? 'inline-block' : 'none'; }
  if (rxBadge)  { rxBadge.textContent = pendingRx;  rxBadge.style.display  = pendingRx  ? 'inline-block' : 'none'; }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ─── HOME TAB PANELS ─── */
function renderHomeLowStock() {
  const el = document.getElementById('homeLowStock');
  if (!el) return;
  const low = storeMeds.filter(m => (m.stock || 0) <= 10);
  if (!low.length) {
    el.innerHTML = `<div class="owner-empty"><div class="oe-icon">✅</div><div class="oe-title">All stocked up!</div></div>`;
    return;
  }
  el.innerHTML = `<div class="lsp-head"><div class="lsp-title">⚠️ ${low.length} medicine${low.length > 1 ? 's' : ''} low</div></div>` +
    low.map(m => `
      <div class="lsp-item">
        <div>
          <div class="lsp-med">${m.name}</div>
          <div class="lsp-stock">${m.stock === 0 ? 'Out of stock' : m.stock + ' units left'}</div>
        </div>
        <button class="tbl-btn edit" onclick="switchOwnerTab('inventory');openEditPanel(${m.id})">Update</button>
      </div>`).join('');
}

function renderHomeRecentOrders() {
  const el = document.getElementById('homeRecentOrders');
  if (!el) return;
  const recent = [...storeOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
  if (!recent.length) {
    el.innerHTML = `<div class="owner-empty"><div class="oe-icon">📭</div><div class="oe-title">No orders yet</div></div>`;
    return;
  }
  el.innerHTML = recent.map(o => `
    <div class="activity-item">
      <div class="ai-dot order"></div>
      <div class="ai-text"><strong>Order #${o.id}</strong> — ${o.customerName || '—'} &nbsp;<span class="spill spill-${o.orderStatus}">${(o.orderStatus || '').replace('_', ' ')}</span></div>
      <div class="ai-time">₹${(o.totalAmount || 0).toFixed(0)}</div>
    </div>`).join('');
}

/* ─── INVENTORY ─── */
async function loadStoreInventory() {
  if (!myStore) return;
  try {
    const res = await fetch(`${API}/medicines?storeId=${myStore.id}`);
    if (!res.ok) throw new Error();
    storeMeds = await res.json();
  } catch { storeMeds = []; }
  renderInventoryTable();
}

function renderInventoryTable(list) {
  const data  = list !== undefined ? list : storeMeds;
  const tbody = document.getElementById('invTableBody');
  const label = document.getElementById('invCountLabel');
  if (label) label.textContent = data.length + ' items';
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="owner-empty"><div class="oe-icon">📦</div><div class="oe-title">No medicines yet</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(m => {
    const stockCls = m.stock === 0 ? 'low' : m.stock <= 10 ? 'low' : 'ok';
    const stockLbl = m.stock === 0 ? '⚠ Out of stock' : m.stock;
    return `
      <tr>
        <td><div class="med-name-cell">${m.name}</div>${m.description ? `<div style="font-size:12px;color:#94a3b8">${m.description}</div>` : ''}</td>
        <td>${m.category ? `<span class="cat-chip">${m.category}</span>` : '<span style="color:#cbd5e1">—</span>'}</td>
        <td style="font-weight:600">₹${(m.price || 0).toFixed(2)}</td>
        <td><span class="stock-num ${stockCls}">${stockLbl}</span></td>
        <td>
          <div class="action-btns">
            <button class="tbl-btn edit" onclick="openEditPanel(${m.id})">✏ Edit</button>
            <button class="tbl-btn del"  onclick="deleteMedicine(${m.id})">🗑 Remove</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function filterInventory() {
  const q = (document.getElementById('invSearch').value || '').toLowerCase();
  renderInventoryTable(q ? storeMeds.filter(m => (m.name || '').toLowerCase().includes(q)) : undefined);
}

/* ─── INLINE EDIT PANEL ─── */
function openEditPanel(id) {
  const med = storeMeds.find(m => m.id === id);
  if (!med) return;
  editingMedId = id;

  document.getElementById('eName').value  = med.name        || '';
  document.getElementById('ePrice').value = med.price       ?? '';
  document.getElementById('eStock').value = med.stock       ?? '';
  document.getElementById('eCat').value   = med.category    || '';
  document.getElementById('eDesc').value  = med.description || '';

  const panel = document.getElementById('editPanel');
  panel.classList.add('open');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeEditPanel() {
  editingMedId = null;
  document.getElementById('editPanel').classList.remove('open');
}

async function saveEditMedicine() {
  if (!editingMedId) return;
  const med = storeMeds.find(m => m.id === editingMedId);
  if (!med) return;

  const name  = document.getElementById('eName').value.trim();
  const price = parseFloat(document.getElementById('ePrice').value);
  const stock = parseInt(document.getElementById('eStock').value);
  const cat   = document.getElementById('eCat').value;
  const desc  = document.getElementById('eDesc').value.trim();

  if (!name || isNaN(price) || isNaN(stock)) { toast('Name, price and stock are required.', 'err'); return; }
  if (price <= 0) { toast('Price must be greater than 0.', 'err'); return; }
  if (stock < 0)  { toast('Stock cannot be negative.', 'err'); return; }
  if (storeMeds.some(m => m.id !== editingMedId && (m.name || '').toLowerCase() === name.toLowerCase())) {
    toast('Another medicine already uses this name.', 'err'); return;
  }

  const payload = { id: med.id, name, price, stock, category: cat, description: desc, storeId: med.storeId };

  try {
    const res = await fetch(`${API}/medicines/${editingMedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    toast('Medicine updated successfully!', 'ok');
    closeEditPanel();
    await loadStoreInventory();
    updateDashboardStats();
    renderHomeLowStock();
  } catch (e) {
    toast('Failed to update: ' + e.message, 'err');
  }
}

async function addMedicine() {
  const name  = document.getElementById('newMedName').value.trim();
  const price = parseFloat(document.getElementById('newMedPrice').value);
  const stock = parseInt(document.getElementById('newMedStock').value);
  const cat   = document.getElementById('newMedCat').value;
  const desc  = document.getElementById('newMedDesc').value.trim();

  if (!name || isNaN(price) || isNaN(stock)) { toast('Please fill Name, Price, and Stock.', 'err'); return; }
  if (price <= 0) { toast('Price must be greater than 0.', 'err'); return; }
  if (stock < 0)  { toast('Stock cannot be negative.', 'err'); return; }
  if (storeMeds.some(m => (m.name || '').toLowerCase() === name.toLowerCase())) {
    toast('This medicine already exists in your inventory.', 'err'); return;
  }

  const payload = { name, price, stock, category: cat, description: desc, storeId: currentUser.storeId || null };

  try {
    const res = await fetch(`${API}/medicines/my?ownerId=${currentUser.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    toast(`✅ ${name} added to inventory!`, 'ok');
    ['newMedName', 'newMedPrice', 'newMedStock', 'newMedDesc'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('newMedCat').value = '';
    await loadStoreInventory();
    updateDashboardStats();
  } catch (e) {
    toast('Failed to add medicine: ' + e.message, 'err');
  }
}

async function deleteMedicine(id) {
  if (!confirm('Remove this medicine from inventory?')) return;
  try {
    const res = await fetch(`${API}/medicines/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    toast('Medicine removed.', 'ok');
    await loadStoreInventory();
    updateDashboardStats();
    renderHomeLowStock();
  } catch (e) {
    toast('Failed to remove: ' + e.message, 'err');
  }
}

/* ─── ORDERS ─── */
async function loadStoreOrders() {
  if (!myStore) return;
  try {
    const res = await fetch(`${API}/orders/store/${myStore.id}`);
    if (!res.ok) throw new Error();
    storeOrders = await res.json();
  } catch { storeOrders = []; }
  renderOrders();
}

function renderOrders() {
  const el        = document.getElementById('ownerOrdersContainer');
  const filter    = (document.getElementById('orderStatusFilter') || {}).value || '';
  const data      = filter ? storeOrders.filter(o => o.orderStatus === filter) : storeOrders;
  if (!el) return;

  if (!data.length) {
    el.innerHTML = `<div class="owner-empty"><div class="oe-icon">📭</div><div class="oe-title">${filter ? 'No orders with this status' : 'No orders yet'}</div></div>`;
    return;
  }

  el.innerHTML = data.map(o => {
    const rxLink = o.prescriptionUrl
      ? `<a class="rx-link" href="${o.prescriptionUrl}" target="_blank">📎 View Prescription</a>`
      : '';
    return `
      <div class="owner-order-card">
        <div class="ooc-top">
          <div>
            <div class="ooc-id">Order #${o.id}</div>
            <div class="ooc-meta">👤 ${o.customerName || '—'} &nbsp;·&nbsp; 📞 ${o.customerPhone || '—'}</div>
            <div class="ooc-meta">📍 ${o.deliveryAddress || '—'}</div>
            <div class="ooc-meta" style="color:#94a3b8;font-size:12px">${o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</div>
          </div>
          <span class="spill spill-${o.orderStatus}">${(o.orderStatus || '').replace('_', ' ')}</span>
        </div>
        <div class="ooc-items">${(o.items || []).map(i => `${i.medicineName} × ${i.quantity} — ₹${((i.subtotal || i.unitPrice * i.quantity) || 0).toFixed(2)}`).join('<br/>')}</div>
        ${rxLink}
        <div class="ooc-bottom">
          <div class="ooc-total">Total: ₹${(o.totalAmount || 0).toFixed(2)}</div>
          <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)">
            <option value="PLACED"           ${o.orderStatus === 'PLACED'           ? 'selected' : ''}>📋 Placed</option>
            <option value="CONFIRMED"        ${o.orderStatus === 'CONFIRMED'        ? 'selected' : ''}>✅ Confirmed</option>
            <option value="OUT_FOR_DELIVERY" ${o.orderStatus === 'OUT_FOR_DELIVERY' ? 'selected' : ''}>🚚 Out for Delivery</option>
            <option value="DELIVERED"        ${o.orderStatus === 'DELIVERED'        ? 'selected' : ''}>📦 Delivered</option>
          </select>
        </div>
      </div>`;
  }).join('');
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API}/orders/${orderId}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await res.text());
    toast('Order status updated.', 'ok');
    await loadStoreOrders();
    updateDashboardStats();
    renderHomeRecentOrders();
  } catch (e) {
    toast('Failed to update order: ' + e.message, 'err');
    await loadStoreOrders();
  }
}

/* ─── PRESCRIPTIONS (STORE OWNER) ─── */
async function loadStorePrescriptionRequests() {
  if (!myStore) return;
  try {
    const res = await fetch(`${API}/prescriptions/store/${myStore.id}`);
    if (!res.ok) throw new Error();
    storeRxs = await res.json();
  } catch { storeRxs = []; }
  renderPrescriptions();
}

function renderPrescriptions() {
  const el     = document.getElementById('ownerRxContainer');
  const filter = (document.getElementById('rxStatusFilter') || {}).value || '';
  const data   = filter ? storeRxs.filter(r => r.status === filter) : storeRxs;
  if (!el) return;

  if (!data.length) {
    el.innerHTML = `<div class="owner-empty"><div class="oe-icon">📄</div><div class="oe-title">${filter ? 'No prescriptions with this status' : 'No prescription requests yet'}</div></div>`;
    return;
  }

  el.innerHTML = data.map(r => {
    const status      = r.status || 'PENDING';
    const orderStatus = r.orderStatus || '';
    // FIX: prescriptionUrl is set by backend as /api/prescriptions/{id}/file
    const rxUrl = r.prescriptionUrl || '';

    const meds    = r.medicineSummary ? `<div class="rx-info-box"><strong>Medicines</strong>${r.medicineSummary}</div>` : '';
    const bill    = r.billAmount != null ? `<div class="rx-info-box"><strong>Bill Amount</strong>₹${Number(r.billAmount).toFixed(2)}</div>` : '';
    const msg     = r.storeMessage    ? `<div class="rx-info-box"><strong>Your Note</strong>${r.storeMessage}</div>` : '';
    const pNote   = r.patientNote     ? `<div class="rx-info-box" style="grid-column:1/-1"><strong>Patient Note</strong>${r.patientNote}</div>` : '';

    // Respond form (only for PENDING)
    const respondForm = status === 'PENDING' ? `
      <div class="rx-respond-form" id="rxForm-${r.id}" style="display:none">
        <h4>✅ Confirm Prescription</h4>
        <div class="rx-form-grid">
          <div><label style="font-size:12px;font-weight:600;color:#166534;display:block;margin-bottom:4px">Bill Amount (₹)</label>
               <input class="rx-inp" type="number" id="rxBill-${r.id}" placeholder="0.00" step="0.01"/></div>
          <div><label style="font-size:12px;font-weight:600;color:#166534;display:block;margin-bottom:4px">Medicine Summary</label>
               <input class="rx-inp" type="text" id="rxMeds-${r.id}" placeholder="e.g. Paracetamol 10 tabs, Vitamin D3…"/></div>
        </div>
        <div class="rx-form-grid-full">
          <label style="font-size:12px;font-weight:600;color:#166534;display:block;margin-bottom:4px">Message to Patient</label>
          <input class="rx-inp" type="text" id="rxMsg-${r.id}" value="Your medicines are available. Please proceed with the bill."/>
        </div>
        <div class="rx-action-btns">
          <button class="btn-send" onclick="submitRxResponse(${r.id},'CONFIRMED')">Send Confirmation</button>
          <button class="btn-cancel-rx" onclick="hideRxForm(${r.id})">Cancel</button>
        </div>
      </div>
      <div class="rx-reject-form" id="rxRejectForm-${r.id}" style="display:none">
        <h4>❌ Decline Prescription</h4>
        <div class="rx-form-grid-full">
          <label style="font-size:12px;font-weight:600;color:#991b1b;display:block;margin-bottom:4px">Reason</label>
          <input class="rx-inp" type="text" id="rxRejectMsg-${r.id}" value="Some medicines are not available." style="border-color:#fecaca"/>
        </div>
        <div class="rx-action-btns">
          <button class="btn-reject" onclick="submitRxResponse(${r.id},'NOT_CONFIRMED')">Send Decline</button>
          <button class="btn-cancel-rx" onclick="hideRxForm(${r.id})">Cancel</button>
        </div>
      </div>
      <div class="rx-action-btns" id="rxBtns-${r.id}" style="margin-top:12px">
        <button class="btn-confirm" onclick="showRxForm(${r.id},'confirm')">✅ Confirm & Bill</button>
        <button class="btn-reject"  onclick="showRxForm(${r.id},'reject')">❌ Decline</button>
      </div>` : '';

    // Delivery status update (only for CONFIRMED)
    const deliveryCtrl = status === 'CONFIRMED' ? `
      <div style="margin-top:12px;display:flex;align-items:center;gap:10px">
        <span style="font-size:13px;font-weight:600;color:#334155">Delivery Status:</span>
        <select class="status-select" onchange="updatePrescriptionOrderStatus(${r.id}, this.value)">
          <option value="PLACED"           ${orderStatus === 'PLACED'           ? 'selected' : ''}>📋 Placed</option>
          <option value="CONFIRMED"        ${orderStatus === 'CONFIRMED'        ? 'selected' : ''}>✅ Confirmed</option>
          <option value="OUT_FOR_DELIVERY" ${orderStatus === 'OUT_FOR_DELIVERY' ? 'selected' : ''}>🚚 Out for Delivery</option>
          <option value="DELIVERED"        ${orderStatus === 'DELIVERED'        ? 'selected' : ''}>📦 Delivered</option>
        </select>
      </div>` : '';

    return `
      <div class="rx-card">
        <div class="rx-card-top">
          <div>
            <div class="rx-id">Prescription #${r.id}</div>
            <div class="rx-patient">👤 ${r.patientName || '—'} &nbsp;·&nbsp; 📞 ${r.patientPhone || '—'}</div>
            <div class="rx-patient">📍 ${r.deliveryAddress || '—'}</div>
            <div class="rx-patient" style="color:#94a3b8;font-size:12px">${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
          </div>
          <span class="spill spill-${status}">${status.replace('_', ' ')}</span>
        </div>
        ${rxUrl ? `<a class="rx-link" href="${rxUrl}" target="_blank">📷 View Prescription Image</a>` : '<div style="font-size:13px;color:#ef4444">⚠ No prescription file</div>'}
        <div class="rx-info-row" style="margin-top:12px">
          ${pNote}
          ${meds}
          ${bill}
          ${msg}
        </div>
        ${respondForm}
        ${deliveryCtrl}
      </div>`;
  }).join('');
}

function showRxForm(id, type) {
  const btnDiv = document.getElementById(`rxBtns-${id}`);
  const confirm = document.getElementById(`rxForm-${id}`);
  const reject  = document.getElementById(`rxRejectForm-${id}`);
  if (btnDiv) btnDiv.style.display = 'none';
  if (type === 'confirm' && confirm) { confirm.style.display = 'block'; if (reject) reject.style.display = 'none'; }
  if (type === 'reject'  && reject)  { reject.style.display  = 'block'; if (confirm) confirm.style.display = 'none'; }
}

function hideRxForm(id) {
  const btnDiv  = document.getElementById(`rxBtns-${id}`);
  const confirm = document.getElementById(`rxForm-${id}`);
  const reject  = document.getElementById(`rxRejectForm-${id}`);
  if (btnDiv)  btnDiv.style.display  = 'flex';
  if (confirm) confirm.style.display = 'none';
  if (reject)  reject.style.display  = 'none';
}

async function submitRxResponse(id, status) {
  let medicineSummary, billAmount, storeMessage;

  if (status === 'CONFIRMED') {
    medicineSummary = (document.getElementById(`rxMeds-${id}`) || {}).value || '';
    const billText  = (document.getElementById(`rxBill-${id}`) || {}).value || '0';
    storeMessage    = (document.getElementById(`rxMsg-${id}`) || {}).value || '';
    billAmount      = parseFloat(billText);
    if (isNaN(billAmount) || billAmount < 0) { toast('Enter a valid bill amount.', 'err'); return; }
  } else {
    medicineSummary = '';
    billAmount      = 0;
    storeMessage    = (document.getElementById(`rxRejectMsg-${id}`) || {}).value || 'Not available.';
  }

  const params = new URLSearchParams({ status, medicineSummary, billAmount: String(billAmount), storeMessage });
  try {
    const res = await fetch(`${API}/prescriptions/${id}/response?${params.toString()}`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await res.text());
    toast('Response sent to patient.', 'ok');
    await loadStorePrescriptionRequests();
    updateDashboardStats();
  } catch (e) {
    toast('Failed to respond: ' + e.message, 'err');
  }
}

async function updatePrescriptionOrderStatus(id, status) {
  try {
    const res = await fetch(`${API}/prescriptions/${id}/order-status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await res.text());
    toast('Prescription delivery status updated.', 'ok');
    await loadStorePrescriptionRequests();
  } catch (e) {
    toast('Failed to update: ' + e.message, 'err');
    await loadStorePrescriptionRequests();
  }
}

/* ─── ORDER HISTORY TAB ─── */
function renderHistory() {
  const el = document.getElementById('ownerHistoryContainer');
  const q  = ((document.getElementById('historySearch') || {}).value || '').toLowerCase();
  if (!el) return;

  let data = [...storeOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  if (q) data = data.filter(o =>
    (o.customerName || '').toLowerCase().includes(q) ||
    String(o.id).includes(q) ||
    (o.customerEmail || '').toLowerCase().includes(q)
  );

  if (!data.length) {
    el.innerHTML = `<div class="owner-empty"><div class="oe-icon">📊</div><div class="oe-title">${q ? 'No matching orders' : 'No orders yet'}</div></div>`;
    return;
  }

  el.innerHTML = `
    <div class="inv-table-wrap">
      <table class="inv-table">
        <thead>
          <tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          ${data.map(o => `
            <tr>
              <td style="font-weight:700;color:#6366f1">#${o.id}</td>
              <td>
                <div class="med-name-cell">${o.customerName || '—'}</div>
                <div style="font-size:12px;color:#94a3b8">${o.customerEmail || ''} · ${o.customerPhone || ''}</div>
                <div style="font-size:12px;color:#64748b">${o.deliveryAddress || ''}</div>
              </td>
              <td style="font-size:13px">${(o.items || []).map(i => `${i.medicineName} ×${i.quantity}`).join(', ')}</td>
              <td style="font-weight:700">₹${(o.totalAmount || 0).toFixed(2)}</td>
              <td><span class="spill spill-${o.orderStatus}">${(o.orderStatus || '').replace('_', ' ')}</span></td>
              <td style="font-size:12px;color:#94a3b8">${o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ════════════════════════════════════════
   PATIENT — DATA LOADING
   ════════════════════════════════════════ */

async function initPatient() {
  await Promise.all([loadMeds(), loadStores()]);
}

async function loadMeds() {
  try {
    const res = await fetch(`${API}/medicines`);
    if (!res.ok) throw new Error();
    allMeds = await res.json();
  } catch {
    allMeds = [];
    toast('⚠️ Cannot connect to backend server.', 'err');
  }
  document.getElementById('kpiMeds').textContent = allMeds.length + '+';
  renderHome();
  renderAll();
}

async function loadStores() {
  try {
    const res = await fetch(`${API}/stores`);
    if (!res.ok) throw new Error();
    allStores = await res.json();
    buildStoreChips();
    buildStoreSelect();
    buildPrescriptionStoreSelect();
  } catch { allStores = []; }
}

function buildStoreChips() {
  const el = document.getElementById('storeChips');
  el.innerHTML = '<button class="chip active" onclick="setStore(null,this)">All Stores</button>';
  allStores.forEach(s => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = '🏥 ' + s.storeName;
    b.onclick = function () { setStore(s.id, this); };
    el.appendChild(b);
  });
}

function buildStoreSelect() {
  const sel = document.getElementById('cStore');
  sel.disabled = false;
  sel.innerHTML = '<option value="">— Select a Store —</option>';
  allStores.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.storeName + (s.location ? ' — ' + s.location : '');
    sel.appendChild(opt);
  });
}

function buildPrescriptionStoreSelect() {
  const sel = document.getElementById('pStore');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Select a Store —</option>';
  allStores.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.storeName + (s.location ? ' — ' + s.location : '');
    sel.appendChild(opt);
  });
}

function setStore(storeId, btn) {
  activeStoreId = storeId;
  document.querySelectorAll('.store-chips .chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterMeds();
}

/* ════════════════════════════════════════
   PATIENT — RENDERING
   ════════════════════════════════════════ */

function medEmoji(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('vitamin') || n.includes('d3'))               return '🌿';
  if (n.includes('amoxicillin') || n.includes('azithromycin')) return '🦠';
  if (n.includes('paracetamol') || n.includes('dolo') || n.includes('ibuprofen')) return '💊';
  if (n.includes('metformin') || n.includes('insulin'))        return '🩸';
  if (n.includes('amlodipine') || n.includes('atorvastatin'))  return '❤️';
  if (n.includes('cetirizine'))                                return '🤧';
  if (n.includes('omeprazole') || n.includes('pantoprazole'))  return '🫃';
  return '💉';
}

function stockTag(stock) {
  if (stock === 0)  return ['tag-out', 'Out of Stock'];
  if (stock <= 10)  return ['tag-low', 'Low Stock'];
  return ['tag-in', 'In Stock'];
}

function cardHTML(m) {
  const [tagCls, tagTxt] = stockTag(m.stock);
  const inCart    = cart.find(c => c.id === m.id);
  const storeLbl  = m.storeName ? `<div class="med-store-lbl">🏥 ${m.storeName}</div>` : '';
  const actionBtn = `<button class="add-btn" onclick="addToCart(${m.id})" ${m.stock === 0 ? 'disabled' : ''}>
    ${m.stock === 0 ? 'Out of Stock' : inCart ? '✅ Added' : '➕ Add to Cart'}
  </button>`;

  return `
    <div class="med-card">
      <div class="med-img">
        ${medEmoji(m.name)}
        <span class="stock-tag ${tagCls}">${tagTxt}</span>
      </div>
      <div class="med-body">
        ${storeLbl}
        <div class="med-name">${m.name}</div>
        <div class="med-foot">
          <div>
            <div class="med-price">₹${(m.price || 0).toFixed(2)}</div>
            <div class="med-stock-info">Stock: ${m.stock}</div>
          </div>
          ${actionBtn}
        </div>
      </div>
    </div>`;
}

function emptyHTML(icon, title, sub = '') {
  return `<div class="empty-state" style="grid-column:1/-1">
    <div class="es-icon">${icon}</div>
    <div class="es-title">${title}</div>
    ${sub ? `<p class="es-sub">${sub}</p>` : ''}
  </div>`;
}

function renderHome(list) {
  const data = (list || allMeds).slice(0, 8);
  const el   = document.getElementById('homeGrid');
  if (!el) return;
  el.innerHTML = data.length
    ? data.map(m => cardHTML(m)).join('')
    : emptyHTML('🔌', 'Backend not connected', 'Start your Spring Boot server and refresh.');
}

function renderAll(list) {
  const data = list !== undefined ? list : allMeds;
  const el   = document.getElementById('allGrid');
  if (!el) return;
  el.innerHTML = data.length
    ? data.map(m => cardHTML(m)).join('')
    : emptyHTML('🔍', 'No medicines found', 'Try a different search or filter.');
}

function heroSearchFn(q) {
  if (!q) { renderHome(); return; }
  const r = allMeds.filter(m => (m.name || '').toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  document.getElementById('homeGrid').innerHTML = r.length
    ? r.map(m => cardHTML(m)).join('')
    : emptyHTML('🔍', `No results for "${q}"`);
}

function doHeroSearch() {
  const q = document.getElementById('heroSearch').value;
  go('medicines');
  document.getElementById('medSearch').value = q;
  filterMeds();
}

function filterMeds() {
  const q = (document.getElementById('medSearch').value || '').toLowerCase();
  let r = [...allMeds];
  if (activeStoreId != null) r = r.filter(m => m.storeId === activeStoreId);
  if (q) r = r.filter(m => (m.name || '').toLowerCase().includes(q));
  renderAll(r);
}

/* ════════════════════════════════════════
   CART
   ════════════════════════════════════════ */

function addToCart(id) {
  const med = allMeds.find(m => m.id === id);
  if (!med || med.stock === 0) return;
  if (cart.length > 0 && cart[0].storeId !== med.storeId) {
    toast('⚠️ Cart has items from a different store. Clear your cart first.', 'err'); return;
  }
  const existing = cart.find(c => c.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ id: med.id, name: med.name, price: med.price, qty: 1, storeId: med.storeId, emo: medEmoji(med.name) }); }
  saveCart();
  updateCartUI();
  renderHome();
  renderAll();
  toast(`✅ ${med.name} added to cart!`, 'ok');
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
  renderDrawer();
}

function saveCart()    { localStorage.setItem('mdCart', JSON.stringify(cart)); }
function clearCart()   {
  if (!confirm('Clear your cart?')) return;
  cart = []; saveCart(); updateCartUI(); renderDrawer(); renderHome(); renderAll();
}

function updateCartUI() {
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotal').textContent = '₹' + total.toFixed(2);
}

function renderDrawer() {
  const el = document.getElementById('cdBody');
  if (!cart.length) {
    el.innerHTML = `<div class="empty-state"><div class="es-icon">🛒</div><div class="es-title">Cart is empty</div><p class="es-sub">Add medicines to get started.</p></div>`;
    return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-emo">${item.emo}</div>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-price">₹${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div class="qty-row">
        <button class="q-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="q-num">${item.qty}</span>
        <button class="q-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>`).join('');
}

function toggleCart() {
  const isOpen = document.getElementById('cartDrawer').classList.contains('open');
  if (!isOpen) renderDrawer();
  document.getElementById('scrim').classList.toggle('open', !isOpen);
  document.getElementById('cartDrawer').classList.toggle('open', !isOpen);
}

function goCheckout() {
  if (!cart.length) { toast('Your cart is empty!', 'err'); return; }
  toggleCart();
  const el    = document.getElementById('checkoutSummary');
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  el.innerHTML = `
    <div class="os-title">🧾 Order Summary</div>
    ${cart.map(i => `<div class="os-row"><span>${i.name} × ${i.qty}</span><span>₹${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
    <div class="os-total"><span>Total</span><span>₹${total.toFixed(2)}</span></div>`;
  if (currentUser) {
    document.getElementById('cName').value  = currentUser.name  || '';
    document.getElementById('cEmail').value = currentUser.email || '';
  }
  if (cart.length > 0 && cart[0].storeId) {
    const storeSelect  = document.getElementById('cStore');
    storeSelect.value    = cart[0].storeId;
    storeSelect.disabled = true;
  }
  go('checkout');
}

async function placeOrder() {
  const name    = document.getElementById('cName').value.trim();
  const email   = document.getElementById('cEmail').value.trim();
  const phone   = document.getElementById('cPhone').value.trim();
  const addr    = document.getElementById('cAddr').value.trim();
  const storeId = document.getElementById('cStore').value;
  if (!name || !email || !phone || !addr) { toast('Please fill all required fields.', 'err'); return; }
  if (!storeId) { toast('Please select a store.', 'err'); return; }

  const payload = {
    customerName: name, customerEmail: email, customerPhone: phone,
    deliveryAddress: addr, storeId: parseInt(storeId),
    items: cart.map(c => ({ medicineId: c.id, quantity: c.qty }))
  };
  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    const order = await res.json();
    cart = []; saveCart(); updateCartUI();
    toast(`🎉 Order #${order.id} placed successfully!`, 'ok');
    document.getElementById('trackEmail').value = email;
    go('orders');
    trackOrders();
  } catch (e) {
    toast('❌ Order failed: ' + e.message, 'err');
  }
}

/* ════════════════════════════════════════
   PATIENT — ORDER TRACKING
   ════════════════════════════════════════ */

const STEPS       = ['PLACED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const STEP_LABELS = { PLACED: 'Placed', CONFIRMED: 'Confirmed', OUT_FOR_DELIVERY: 'On the Way', DELIVERED: 'Delivered' };

async function trackOrders() {
  const email = document.getElementById('trackEmail').value.trim();
  if (!email) { toast('Enter your email address.', 'err'); return; }
  const el = document.getElementById('orderList');
  el.innerHTML = '<div class="loader-ring"></div>';
  try {
    const res = await fetch(`${API}/orders/track?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error();
    const orders = await res.json();
    if (!orders.length) { el.innerHTML = emptyHTML('📭', 'No orders found', 'No orders were found for this email.'); return; }
    el.innerHTML = orders.map(o => {
      const idx = STEPS.indexOf(o.orderStatus);
      const stepsHTML = STEPS.map((s, i) => {
        const cls = i < idx ? 'p-step done' : i === idx ? 'p-step current' : 'p-step';
        return `<div class="${cls}"><div class="p-dot">${i < idx ? '✓' : i + 1}</div><div class="p-lbl">${STEP_LABELS[s]}</div></div>`;
      }).join('');
      const rxLink = o.prescriptionUrl ? `<a class="prescription-link" href="${o.prescriptionUrl}" target="_blank">View Prescription</a>` : '';
      return `<div class="order-card">
        <div class="oc-top">
          <div>
            <div class="oc-id">Order #${o.id}</div>
            <div class="oc-date">${o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</div>
          </div>
          <span class="status-pill s-${o.orderStatus}">${(o.orderStatus || '').replace('_', ' ')}</span>
        </div>
        <div class="progress-bar">${stepsHTML}</div>
        <div class="oc-items">${(o.items || []).map(i => `${i.medicineName} × ${i.quantity}`).join(', ')}</div>
        ${rxLink}
        <div class="oc-total">Total: ₹${(o.totalAmount || 0).toFixed(2)}</div>
      </div>`;
    }).join('');
  } catch {
    el.innerHTML = emptyHTML('🔌', 'Cannot connect to server', 'Make sure your backend is running.');
  }
}

/* ════════════════════════════════════════
   PATIENT — PRESCRIPTION
   ════════════════════════════════════════ */

function isValidPrescriptionFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  const ext     = (file.name.split('.').pop() || '').toLowerCase();
  return allowed.includes(file.type) || ['jpg', 'jpeg', 'png', 'pdf'].includes(ext);
}

async function submitPrescriptionRequest() {
  const patientName    = document.getElementById('pName').value.trim();
  const patientEmail   = document.getElementById('pEmail').value.trim();
  const patientPhone   = document.getElementById('pPhone').value.trim();
  const storeId        = document.getElementById('pStore').value;
  const deliveryAddress = document.getElementById('pAddr').value.trim();
  const patientNote    = document.getElementById('pNote').value.trim();
  const prescription   = document.getElementById('pFile').files[0];

  if (!patientName || !patientEmail || !patientPhone || !storeId || !deliveryAddress) {
    toast('Please fill all required prescription fields.', 'err'); return;
  }
  if (!prescription) { toast('Please upload your prescription.', 'err'); return; }
  if (!isValidPrescriptionFile(prescription)) { toast('Prescription must be a JPG, PNG, or PDF file.', 'err'); return; }

  const form = new FormData();
  form.append('patientId',       currentUser.id);
  form.append('storeId',         storeId);
  form.append('patientName',     patientName);
  form.append('patientEmail',    patientEmail);
  form.append('patientPhone',    patientPhone);
  form.append('deliveryAddress', deliveryAddress);
  form.append('patientNote',     patientNote);
  form.append('prescription',    prescription);

  try {
    const res = await fetch(`${API}/prescriptions`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(await res.text());
    toast('Prescription submitted to store. 📄', 'ok');
    document.getElementById('pNote').value = '';
    document.getElementById('pFile').value = '';
    loadPatientPrescriptionRequests();
  } catch (e) {
    toast('Failed to submit prescription: ' + e.message, 'err');
  }
}

async function loadPatientPrescriptionRequests() {
  const el = document.getElementById('prescriptionRequestList');
  if (!el || !currentUser || currentUser.role !== 'PATIENT') return;
  el.innerHTML = '<div class="loader-ring"></div>';
  try {
    const res  = await fetch(`${API}/prescriptions/patient/${currentUser.id}`);
    if (!res.ok) throw new Error();
    const reqs = await res.json();
    el.innerHTML = reqs.length
      ? reqs.map(r => patientRxCardHTML(r)).join('')
      : emptyHTML('📄', 'No prescription requests yet', 'Upload a prescription and the store will respond here.');
  } catch {
    el.innerHTML = emptyHTML('🔌', 'Cannot connect to server', 'Make sure Spring Boot is running.');
  }
}

function patientRxCardHTML(r) {
  const status      = r.status || 'PENDING';
  const orderStatus = r.orderStatus || '';
  // prescriptionUrl is set by backend as /api/prescriptions/{id}/file
  const rxUrl = r.prescriptionUrl || '';

  const bill        = r.billAmount != null ? `<div class="oc-total">Bill: ₹${Number(r.billAmount).toFixed(2)}</div>` : '';
  const meds        = r.medicineSummary ? `<div class="oc-items"><strong>Medicines:</strong> ${r.medicineSummary}</div>` : '';
  const msg         = r.storeMessage    ? `<div class="oc-items"><strong>Store note:</strong> ${r.storeMessage}</div>` : '';
  const pNote       = r.patientNote     ? `<div class="oc-items"><strong>Your note:</strong> ${r.patientNote}</div>` : '';
  const delStatus   = status === 'CONFIRMED' && orderStatus
    ? `<div class="oc-items"><strong>Delivery status:</strong> <span class="spill spill-${orderStatus}">${orderStatus.replace('_', ' ')}</span></div>`
    : '';

  return `<div class="order-card">
    <div class="oc-top">
      <div>
        <div class="oc-id">Prescription #${r.id}</div>
        <div class="oc-date">${r.storeName || 'Selected store'}</div>
        <div class="oc-date" style="color:#94a3b8;font-size:12px">${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
      </div>
      <span class="status-pill s-${status}">${status.replace('_', ' ')}</span>
    </div>
    ${rxUrl ? `<a class="prescription-link" href="${rxUrl}" target="_blank">View Prescription</a>` : ''}
    ${pNote}${meds}${bill}${msg}${delStatus}
  </div>`;
}

/* ════════════════════════════════════════
   TOAST
   ════════════════════════════════════════ */

function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.getElementById('toastStack').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ════════════════════════════════════════
   BOOT
   ════════════════════════════════════════ */
(function boot() {
  const saved = localStorage.getItem('mdUser');
  if (saved) {
    try { currentUser = JSON.parse(saved); onLoginSuccess(); }
    catch { showAuth(); }
  } else {
    showAuth();
  }
  updateCartUI();
})();
/* ════════════════════════════════════════
   ADMIN — STATE
   ════════════════════════════════════════ */
let adminUsers    = [];
let adminStores   = [];
let adminOrders   = [];
let adminRxs      = [];

/* ════════════════════════════════════════
   ADMIN — AUTH
   ════════════════════════════════════════ */
function showAdminLogin() {
  document.getElementById('adminLoginForm').style.display = 'block';
  document.getElementById('adminEmail').focus();
}
function hideAdminLogin() {
  document.getElementById('adminLoginForm').style.display = 'none';
  document.getElementById('adminEmail').value = '';
  document.getElementById('adminPassword').value = '';
}

async function adminLogin() {
  const email    = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  if (!email || !password) { toast('Enter admin email and password.', 'err'); return; }
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'ADMIN' })
    });
    if (!res.ok) throw new Error(await res.text());
    currentUser = await res.json();
    localStorage.setItem('mdUser', JSON.stringify(currentUser));
    onAdminLoginSuccess();
  } catch (e) {
    toast('Admin login failed: ' + e.message, 'err');
  }
}

function onAdminLoginSuccess() {
  // Hide auth screen
  document.getElementById('authScreen').classList.remove('active');
  // Show .app so the navbar is visible
  document.getElementById('mainApp').classList.add('active');
  // Show the admin dashboard page (it lives outside .app but that's fine)
  const adminPage = document.getElementById('page-admin');
  adminPage.style.display = 'block';
  // Hide all regular .page divs that might have been active
  document.querySelectorAll('.app .page').forEach(p => p.classList.remove('active'));

  renderUserChip();      // Sets name/badge in navbar
  buildAdminNav();       // Sets nav tabs to show "Admin Panel"
  loadAdminDashboard();
  toast('\uD83D\uDEE1\uFE0F Welcome, Admin ' + (currentUser.name || '') + '!', 'ok');
}

function renderAdminNav() {
  renderUserChip();
  buildAdminNav();
}

function renderUserChipAdmin() {
  const initials = (currentUser.name || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avEl = document.getElementById('userAv');
  const nameEl = document.getElementById('userName');
  const badge = document.getElementById('roleBadge');
  if (avEl) avEl.textContent = initials;
  if (nameEl) nameEl.textContent = currentUser.name || 'Admin';
  if (badge) { badge.textContent = 'Admin'; badge.className = 'role-badge admin'; }
}

function buildAdminNav() {
  const nc  = document.getElementById('navTabs');
  const fab = document.getElementById('cartFab');
  if (nc) nc.innerHTML = `<button class="nav-tab active" onclick="go('admin')">🛡️ Admin Panel</button>`;
  if (fab) fab.style.display = 'none';
}

/* ════════════════════════════════════════
   ADMIN — DASHBOARD INIT
   ════════════════════════════════════════ */
async function loadAdminDashboard() {
  try {
    const res = await fetch(`${API}/admin/stats`);
    if (!res.ok) throw new Error();
    const s = await res.json();
    setText('aStatUsers',    s.totalUsers    || 0);
    setText('aStatStores',   s.totalStores   || 0);
    setText('aStatOrders',   s.totalOrders   || 0);
    setText('aStatRevenue',  '₹' + (s.totalRevenue || 0).toFixed(0));
    setText('aStatPatients', s.totalPatients || 0);
    setText('aStatRx',       s.totalRx       || 0);
    setText('aStatPendingRx',s.pendingRx     || 0);
  } catch {
    toast('Could not load admin stats.', 'err');
  }
}

/* ─── Admin Tab Switch ─── */
function switchAdminTab(tab) {
  document.querySelectorAll('#page-admin .owner-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#page-admin .sidebar-item').forEach(b => {
    b.classList.toggle('active', b.dataset.adminTab === tab);
  });
  const el = document.getElementById('atab-' + tab);
  if (el) el.classList.add('active');

  // Lazy-load data when tab first opened
  if (tab === 'users'         && adminUsers.length   === 0) loadAdminUsers('');
  if (tab === 'stores'        && adminStores.length  === 0) loadAdminStores();
  if (tab === 'orders'        && adminOrders.length  === 0) loadAdminOrders('');
  if (tab === 'prescriptions' && adminRxs.length     === 0) loadAdminPrescriptions('');
}

/* ════════════════════════════════════════
   ADMIN — USERS
   ════════════════════════════════════════ */
async function loadAdminUsers(roleFilter) {
  const tbody = document.getElementById('adminUsersTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px"><div class="loader-ring"></div></td></tr>';
  try {
    const url = roleFilter ? `${API}/admin/users?role=${roleFilter}` : `${API}/admin/users`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    adminUsers = await res.json();
  } catch { adminUsers = []; toast('Could not load users.', 'err'); }
  renderAdminUsersTable(adminUsers);
}

function renderAdminUsersTable(data) {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:#94a3b8">No users found</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(u => {
    if (u.role === 'ADMIN') return ''; // Don't show admin users in table
    const statusTxt = u.active !== false
      ? '<span class="status-chip-active">✅ Active</span>'
      : '<span class="status-chip-blocked">🚫 Blocked</span>';
    const blockLbl = u.active !== false ? 'Block' : 'Unblock';
    const blockCls = u.active !== false ? 'warn' : 'edit';
    return `
      <tr>
        <td style="font-weight:700;color:#6366f1">${u.id}</td>
        <td><div class="med-name-cell">${u.name || '—'}</div></td>
        <td style="font-size:13px;color:#64748b">${u.email}</td>
        <td><span class="role-chip role-chip-${u.role}">${u.role}</span></td>
        <td>${statusTxt}</td>
        <td>
          <div class="action-btns">
            <button class="tbl-btn ${blockCls}" onclick="adminToggleBlock(${u.id})">${blockLbl}</button>
            <button class="tbl-btn del" onclick="adminDeleteUser(${u.id})">🗑 Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function filterAdminUsersTable() {
  const q = (document.getElementById('adminUserSearch').value || '').toLowerCase();
  const filtered = q ? adminUsers.filter(u =>
    (u.name || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  ) : adminUsers;
  renderAdminUsersTable(filtered);
}

async function adminToggleBlock(userId) {
  try {
    const res = await fetch(`${API}/admin/users/${userId}/block`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await res.text());
    const updated = await res.json();
    // Update local state
    const idx = adminUsers.findIndex(u => u.id === userId);
    if (idx > -1) adminUsers[idx] = updated;
    renderAdminUsersTable(adminUsers);
    toast(updated.active ? '✅ User unblocked.' : '🚫 User blocked.', 'ok');
  } catch (e) {
    toast('Failed to update user: ' + e.message, 'err');
  }
}

async function adminDeleteUser(userId) {
  if (!confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API}/admin/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    adminUsers = adminUsers.filter(u => u.id !== userId);
    renderAdminUsersTable(adminUsers);
    toast('User deleted.', 'ok');
    loadAdminDashboard(); // Refresh stats
  } catch (e) {
    toast('Failed to delete user: ' + e.message, 'err');
  }
}

/* ════════════════════════════════════════
   ADMIN — STORES
   ════════════════════════════════════════ */
async function loadAdminStores() {
  const tbody = document.getElementById('adminStoresTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px"><div class="loader-ring"></div></td></tr>';
  try {
    const res = await fetch(`${API}/admin/stores`);
    if (!res.ok) throw new Error();
    adminStores = await res.json();
  } catch { adminStores = []; toast('Could not load stores.', 'err'); }
  renderAdminStoresTable(adminStores);
}

function renderAdminStoresTable(data) {
  const tbody = document.getElementById('adminStoresTableBody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:#94a3b8">No stores found</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td style="font-weight:700;color:#6366f1">${s.id}</td>
      <td><div class="med-name-cell">${s.storeName || '—'}</div></td>
      <td style="font-size:13px;color:#64748b">Owner ID: ${s.ownerId || '—'}</td>
      <td>${s.location || '—'}</td>
      <td style="font-size:13px">${s.address || '—'}</td>
      <td>
        <button class="tbl-btn del" onclick="adminDeleteStore(${s.id})">🗑 Delete</button>
      </td>
    </tr>`).join('');
}

function filterAdminStoresTable() {
  const q = (document.getElementById('adminStoreSearch').value || '').toLowerCase();
  const filtered = q ? adminStores.filter(s =>
    (s.storeName || '').toLowerCase().includes(q) ||
    (s.location  || '').toLowerCase().includes(q)
  ) : adminStores;
  renderAdminStoresTable(filtered);
}

async function adminDeleteStore(storeId) {
  if (!confirm('Delete this store? All associated data may be affected.')) return;
  try {
    const res = await fetch(`${API}/admin/stores/${storeId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    adminStores = adminStores.filter(s => s.id !== storeId);
    renderAdminStoresTable(adminStores);
    toast('Store deleted.', 'ok');
    loadAdminDashboard();
  } catch (e) {
    toast('Failed to delete store: ' + e.message, 'err');
  }
}

/* ════════════════════════════════════════
   ADMIN — ORDERS
   ════════════════════════════════════════ */
async function loadAdminOrders(statusFilter) {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px"><div class="loader-ring"></div></td></tr>';
  try {
    const url = statusFilter ? `${API}/admin/orders?status=${statusFilter}` : `${API}/admin/orders`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    adminOrders = await res.json();
  } catch { adminOrders = []; toast('Could not load orders.', 'err'); }
  renderAdminOrdersTable(adminOrders);
}

function renderAdminOrdersTable(data) {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:#94a3b8">No orders found</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(o => `
    <tr>
      <td style="font-weight:700;color:#6366f1">#${o.id}</td>
      <td>
        <div class="med-name-cell">${o.customerName || '—'}</div>
        <div style="font-size:12px;color:#94a3b8">${o.customerEmail || ''}</div>
      </td>
      <td style="font-size:13px;color:#64748b">Store #${o.storeId || '—'}</td>
      <td style="font-size:12px">${o.orderItems ? o.orderItems.length + ' item(s)' : '—'}</td>
      <td style="font-weight:700">₹${(o.totalAmount || 0).toFixed(2)}</td>
      <td><span class="spill spill-${o.orderStatus}">${(o.orderStatus || '').replace('_', ' ')}</span></td>
      <td style="font-size:12px;color:#94a3b8">${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
      <td>
        <select class="status-select" style="font-size:12px" onchange="adminUpdateOrderStatus(${o.id}, this.value)">
          <option value="PLACED"           ${o.orderStatus === 'PLACED'           ? 'selected' : ''}>📋 Placed</option>
          <option value="CONFIRMED"        ${o.orderStatus === 'CONFIRMED'        ? 'selected' : ''}>✅ Confirmed</option>
          <option value="OUT_FOR_DELIVERY" ${o.orderStatus === 'OUT_FOR_DELIVERY' ? 'selected' : ''}>🚚 Out for Delivery</option>
          <option value="DELIVERED"        ${o.orderStatus === 'DELIVERED'        ? 'selected' : ''}>📦 Delivered</option>
        </select>
      </td>
    </tr>`).join('');
}

function filterAdminOrdersTable() {
  const q = (document.getElementById('adminOrderSearch').value || '').toLowerCase();
  const filtered = q ? adminOrders.filter(o =>
    (o.customerName || '').toLowerCase().includes(q) ||
    String(o.id).includes(q) ||
    (o.customerEmail || '').toLowerCase().includes(q)
  ) : adminOrders;
  renderAdminOrdersTable(filtered);
}

async function adminUpdateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API}/admin/orders/${orderId}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await res.text());
    toast('Order status updated.', 'ok');
    const idx = adminOrders.findIndex(o => o.id === orderId);
    if (idx > -1) adminOrders[idx].orderStatus = status;
  } catch (e) {
    toast('Failed to update order: ' + e.message, 'err');
  }
}

/* ════════════════════════════════════════
   ADMIN — PRESCRIPTIONS
   ════════════════════════════════════════ */
async function loadAdminPrescriptions(statusFilter) {
  const tbody = document.getElementById('adminRxTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px"><div class="loader-ring"></div></td></tr>';
  try {
    const url = statusFilter ? `${API}/admin/prescriptions?status=${statusFilter}` : `${API}/admin/prescriptions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    adminRxs = await res.json();
  } catch { adminRxs = []; toast('Could not load prescriptions.', 'err'); }
  renderAdminRxTable(adminRxs);
}

function renderAdminRxTable(data) {
  const tbody = document.getElementById('adminRxTableBody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:#94a3b8">No prescription requests found</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td style="font-weight:700;color:#6366f1">#${r.id}</td>
      <td>
        <div class="med-name-cell">${r.patientName || '—'}</div>
        <div style="font-size:12px;color:#94a3b8">${r.patientEmail || ''}</div>
      </td>
      <td style="font-size:13px;color:#64748b">Store #${r.storeId || '—'}</td>
      <td style="font-size:13px">${r.patientPhone || '—'}</td>
      <td style="font-size:12px">${r.deliveryAddress || '—'}</td>
      <td style="font-weight:700">${r.billAmount != null ? '₹' + Number(r.billAmount).toFixed(2) : '—'}</td>
      <td><span class="spill spill-${r.status || 'PENDING'}">${(r.status || 'PENDING').replace('_', ' ')}</span></td>
      <td style="font-size:12px;color:#94a3b8">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
      <td>
        ${r.prescriptionFilePath
          ? `<a class="rx-link" href="/api/prescriptions/${r.id}/file" target="_blank">📷 View</a>`
          : '<span style="color:#94a3b8;font-size:12px">None</span>'}
      </td>
    </tr>`).join('');
}

/* Admin logout is already handled in the main logout() function above */

async function updateStoreProfile() {
  const name = document.getElementById('editStoreName').value;
  const loc = document.getElementById('editStoreLocation').value;
  const addr = document.getElementById('editStoreAddress').value;
  if (!name) return toast('Store name required', 'err');
  if (!myStore) return toast('Store data not loaded', 'err');
  try {
    const res = await fetch(`${API}/stores/${myStore.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName: name, location: loc, address: addr, ownerId: currentUser.id })
    });
    if (!res.ok) throw new Error();
    toast('Profile updated!', 'ok');
    document.getElementById('sidebarStoreName').textContent = name;
  } catch {
    toast('Failed to update profile', 'err');
  }
}
