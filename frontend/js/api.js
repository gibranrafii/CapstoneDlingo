// ============================================================
// API Utility - Centralized API calls
// ============================================================

const API_BASE = 'http://localhost:3000/api';

// Get auth token from localStorage
const getToken = () => localStorage.getItem('token');
const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};

// Generic API call
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const defaultHeaders = { 'Content-Type': 'application/json' };
  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      // Handle auth errors
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('login')) {
          window.location.href = '/frontend/login.html';
        }
      }
      throw { status: response.status, ...data };
    }

    if (!response.ok) {
      throw { status: response.status, ...data };
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    throw { success: false, message: 'Gagal terhubung ke server. Periksa koneksi Anda.' };
  }
};

// Auth APIs
const authAPI = {
  register: (data) => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiCall('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiCall('/auth/me'),
  updateProfile: (data) => apiCall('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// Product APIs
const productAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/products${query ? '?' + query : ''}`);
  },
  getManage: () => apiCall('/products/manage'),
  getById: (id) => apiCall(`/products/${id}`),
  getCategories: () => apiCall('/products/categories'),
  create: (formData) => apiCall('/products', { method: 'POST', body: formData }),
  update: (id, formData) => apiCall(`/products/${id}`, { method: 'PUT', body: formData }),
  delete: (id) => apiCall(`/products/${id}`, { method: 'DELETE' }),
};

// Order APIs
const orderAPI = {
  getAll: () => apiCall('/orders'),
  getById: (id) => apiCall(`/orders/${id}`),
  create: (data) => apiCall('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) => apiCall(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// Livestock APIs
const livestockAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/livestock${query ? '?' + query : ''}`);
  },
  getById: (id) => apiCall(`/livestock/${id}`),
  create: (data) => apiCall('/livestock', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/livestock/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/livestock/${id}`, { method: 'DELETE' }),
  addControl: (id, data) => apiCall(`/livestock/${id}/control`, { method: 'POST', body: JSON.stringify(data) }),
};

// User APIs
const userAPI = {
  getAll: () => apiCall('/users'),
  getById: (id) => apiCall(`/users/${id}`),
  create: (data) => apiCall('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/users/${id}`, { method: 'DELETE' }),
  getDashboardStats: () => apiCall('/users/dashboard/stats'),
};

// ============================================================
// Cart (localStorage)
// ============================================================
const cartManager = {
  get: () => { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } },
  save: (cart) => localStorage.setItem('cart', JSON.stringify(cart)),
  add: (product, qty = 1) => {
    const cart = cartManager.get();
    const existing = cart.find(i => i.id_produk === product.id_produk);
    if (existing) {
      existing.jumlah = Math.min(existing.jumlah + qty, product.stok);
    } else {
      cart.push({ id_produk: product.id_produk, nama_produk: product.nama_produk, harga: product.harga, satuan: product.satuan, jumlah: qty, stok: product.stok, gambar: product.gambar });
    }
    cartManager.save(cart);
    cartManager.updateBadge();
    return cart;
  },
  remove: (id_produk) => {
    const cart = cartManager.get().filter(i => i.id_produk !== id_produk);
    cartManager.save(cart);
    cartManager.updateBadge();
    return cart;
  },
  updateQty: (id_produk, qty) => {
    const cart = cartManager.get().map(i => i.id_produk === id_produk ? { ...i, jumlah: qty } : i).filter(i => i.jumlah > 0);
    cartManager.save(cart);
    cartManager.updateBadge();
    return cart;
  },
  clear: () => { localStorage.removeItem('cart'); cartManager.updateBadge(); },
  total: () => cartManager.get().reduce((sum, i) => sum + (i.harga * i.jumlah), 0),
  count: () => cartManager.get().reduce((sum, i) => sum + i.jumlah, 0),
  updateBadge: () => {
    const badges = document.querySelectorAll('.cart-count');
    const count = cartManager.count();
    badges.forEach(b => { b.textContent = count; b.style.display = count > 0 ? 'flex' : 'none'; });
  },
};

// ============================================================
// Toast Notifications
// ============================================================
const toast = {
  container: null,
  init() {
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  },
  show(message, type = 'success', duration = 4000) {
    this.init();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
    this.container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },
  success: (msg) => toast.show(msg, 'success'),
  error: (msg) => toast.show(msg, 'error'),
  warning: (msg) => toast.show(msg, 'warning'),
  info: (msg) => toast.show(msg, 'info'),
};

// ============================================================
// Utility Functions
// ============================================================
const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
};

const getProductImageUrl = (gambar) => {
  if (!gambar) return null;
  if (gambar.startsWith('http')) return gambar;
  return `http://localhost:3000${gambar}`;
};

const getStatusBadge = (status) => {
  const map = {
    pending: 'badge-pending',
    dikonfirmasi: 'badge-dikonfirmasi',
    diproses: 'badge-diproses',
    dikirim: 'badge-dikirim',
    selesai: 'badge-selesai',
    dibatalkan: 'badge-dibatalkan',
  };
  const labels = {
    pending: 'Menunggu',
    dikonfirmasi: 'Dikonfirmasi',
    diproses: 'Diproses',
    dikirim: 'Dikirim',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
  };
  return `<span class="badge ${map[status] || ''}">${labels[status] || status}</span>`;
};

const requireAuth = (allowedRoles = []) => {
  const user = getUser();
  const token = getToken();
  if (!token || !user) {
    window.location.href = '/frontend/login.html';
    return null;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    window.location.href = '/frontend/login.html';
    return null;
  }
  return user;
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = '/frontend/login.html';
};

// Initialize cart badge on page load
document.addEventListener('DOMContentLoaded', () => {
  cartManager.updateBadge();
});
