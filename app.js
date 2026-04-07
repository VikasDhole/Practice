// ── PRODUCTS DATA ──────────────────────────────────────────
const PRODUCTS = [
  { id: 1, name: "Wireless Headphones", price: 1299, category: "electronics", emoji: "🎧" },
  { id: 2, name: "Smart Watch",         price: 2499, category: "electronics", emoji: "⌚" },
  { id: 3, name: "Running Shoes",       price: 899,  category: "footwear",    emoji: "👟" },
  { id: 4, name: "Leather Sandals",     price: 499,  category: "footwear",    emoji: "👡" },
  { id: 5, name: "Tote Bag",            price: 699,  category: "bags",        emoji: "👜" },
  { id: 6, name: "Backpack",            price: 1199, category: "bags",        emoji: "🎒" },
  { id: 7, name: "Non-stick Pan",       price: 599,  category: "kitchen",     emoji: "🍳" },
  { id: 8, name: "Coffee Maker",        price: 1899, category: "kitchen",     emoji: "☕" },
  { id: 9, name: "Casual T-Shirt",      price: 399,  category: "fashion",     emoji: "👕" },
  { id: 10, name: "Denim Jacket",       price: 1599, category: "fashion",     emoji: "🧥" },
  { id: 11, name: "Bluetooth Speaker",  price: 999,  category: "electronics", emoji: "🔊" },
  { id: 12, name: "Sneakers",           price: 1099, category: "footwear",    emoji: "👠" },
];

// ── ADMIN CREDENTIALS ───────────────────────────────────────
const ADMIN = { email: "admin@shopeasy.com", password: "admin123" };

// ── STATE ───────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let currentCat = "all";
let searchQuery = "";

// ── ON LOAD ──────────────────────────────────────────────────
window.onload = function () {
  renderProducts();
  updateCartCount();
  updateNavUser();
};

// ── UPDATE NAV USER BUTTON ───────────────────────────────────
function updateNavUser() {
  const btn = document.getElementById("user-btn");
  if (currentUser) {
    if (currentUser.isAdmin) {
      btn.textContent = "👑 Admin";
      btn.style.background = "rgba(251,191,36,0.3)";
    } else {
      btn.textContent = "👤 " + currentUser.name;
      btn.style.background = "rgba(255,255,255,0.2)";
    }
  } else {
    btn.textContent = "👤 Login";
    btn.style.background = "";
  }
}

function handleUserBtn() {
  if (currentUser) {
    if (currentUser.isAdmin) showPage("admin");
    else showPage("orders");
  } else {
    showPage("login");
  }
}

// ── PRODUCTS ─────────────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById("products");
  let list = PRODUCTS;
  if (currentCat !== "all") list = list.filter(p => p.category === currentCat);
  if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  grid.innerHTML = list.map(p => `
    <div class="product-card">
      <div class="emoji">${p.emoji}</div>
      <h3>${p.name}</h3>
      <div class="price">₹${p.price}</div>
      <div class="category">${p.category}</div>
      <button onclick="addToCart(${p.id})">Add to Cart</button>
    </div>
  `).join("");
}

function filterCat(cat, btn) {
  currentCat = cat;
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderProducts();
}

function filterProducts(val) { searchQuery = val; renderProducts(); }

// ── CART ─────────────────────────────────────────────────────
function addToCart(id) {
  const p = PRODUCTS.find(p => p.id === id);
  const ex = cart.find(c => c.id === id);
  if (ex) ex.qty++; else cart.push({ ...p, qty: 1 });
  saveCart(); updateCartCount();
  showToast(`${p.emoji} ${p.name} added to cart!`);
}

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function updateCartCount() {
  document.getElementById("cart-count").textContent = cart.reduce((s, c) => s + c.qty, 0);
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  if (cart.length === 0) {
    container.innerHTML = "<p style='color:#999;text-align:center;padding:30px'>🛒 Cart is empty</p>";
    totalEl.innerHTML = ""; return;
  }
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span>${item.emoji} ${item.name} × ${item.qty}</span>
      <span>₹${item.price * item.qty}</span>
      <button onclick="removeFromCart(${item.id})">Remove</button>
    </div>`).join("");
  totalEl.innerHTML = `<strong>Total: ₹${cart.reduce((s,c) => s + c.price*c.qty, 0)}</strong>`;
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart(); updateCartCount(); renderCart();
}

// ── PLACE ORDER ──────────────────────────────────────────────
async function placeOrder() {
  if (!currentUser) { showToast("⚠️ Please login first!"); showPage("login"); return; }
  if (cart.length === 0) { showToast("⚠️ Cart is empty!"); return; }

  const order = {
    id: "ORD" + Date.now(),
    user: currentUser.name,
    email: currentUser.email,
    items: cart,
    total: cart.reduce((s, c) => s + c.price * c.qty, 0),
    date: new Date().toLocaleString(),
    status: "Confirmed"
  };

  try {
    const res = await fetch("http://localhost:3000/place-order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const data = await res.json();
    if (data.success) {
      cart = []; saveCart(); updateCartCount();
      showToast("✅ Order placed!"); showPage("orders");
    }
  } catch {
    let orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    cart = []; saveCart(); updateCartCount();
    showToast("✅ Order saved locally!"); showPage("orders");
  }
}

// ── ORDERS ───────────────────────────────────────────────────
async function renderOrders() {
  const container = document.getElementById("orders-list");
  let orders = [];
  try {
    const res = await fetch("http://localhost:3000/get-orders");
    orders = await res.json();
  } catch {
    orders = JSON.parse(localStorage.getItem("orders") || "[]");
  }

  if (currentUser && !currentUser.isAdmin) {
    orders = orders.filter(o => o.email === currentUser.email);
  }

  if (orders.length === 0) {
    container.innerHTML = "<p style='color:#999;text-align:center;padding:30px'>📦 No orders yet</p>"; return;
  }

  container.innerHTML = orders.reverse().map(o => `
    <div class="order-card">
      <div class="order-id">🆔 ${o.id}</div>
      <div>👤 <strong>${o.user}</strong> &nbsp;|&nbsp; 📧 ${o.email}</div>
      <div style="margin:4px 0">🛍 ${o.items.map(i=>`${i.emoji} ${i.name}×${i.qty}`).join(", ")}</div>
      <div>💰 <strong>₹${o.total}</strong> &nbsp;|&nbsp; 📅 ${o.date}</div>
      <span class="order-status">✅ ${o.status}</span>
    </div>`).join("");
}

// ── LOGIN ─────────────────────────────────────────────────────
async function login() {
  const name  = document.getElementById("login-name").value.trim();
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-pass").value.trim();
  const msg   = document.getElementById("login-msg");

  if (!email || !pass) { msg.style.color="red"; msg.textContent="Enter email and password!"; return; }

  // ADMIN LOGIN
  if (email === ADMIN.email && pass === ADMIN.password) {
    currentUser = { name: "Admin", email: ADMIN.email, isAdmin: true };
    localStorage.setItem("user", JSON.stringify(currentUser));
    updateNavUser();
    msg.style.color = "orange";
    msg.textContent = "👑 Admin login successful!";
    setTimeout(() => showPage("admin"), 700);
    return;
  }

  // NORMAL USER
  if (!name) { msg.style.color="red"; msg.textContent="Please enter your name!"; return; }

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pass })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = { name: data.user.name, email: data.user.email, isAdmin: false };
      localStorage.setItem("user", JSON.stringify(currentUser));
      updateNavUser();
      msg.style.color = "green";
      msg.textContent = `✅ Welcome back, ${currentUser.name}!`;
    }
  } catch {
    currentUser = { name, email, isAdmin: false };
    localStorage.setItem("user", JSON.stringify(currentUser));
    updateNavUser();
    msg.style.color = "green";
    msg.textContent = `✅ Welcome, ${name}!`;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("user");
  updateNavUser();
  showPage("home");
  showToast("👋 Logged out successfully!");
}

// ── ADMIN PANEL ──────────────────────────────────────────────
async function renderAdmin() {
  if (!currentUser || !currentUser.isAdmin) {
    document.getElementById("admin-content").innerHTML =
      "<p style='color:red;text-align:center;padding:40px'>⛔ Admin access only!</p>"; return;
  }

  let db = { users: [], orders: [] };
  try {
    const res = await fetch("http://localhost:3000/get-db");
    db = await res.json();
  } catch {
    db.orders = JSON.parse(localStorage.getItem("orders") || "[]");
  }

  const revenue = db.orders.reduce((s, o) => s + o.total, 0);

  document.getElementById("admin-content").innerHTML = `
    <div class="admin-stats">
      <div class="stat-card">👥<br/><strong>${db.users.length}</strong><br/><small>Users</small></div>
      <div class="stat-card">📦<br/><strong>${db.orders.length}</strong><br/><small>Orders</small></div>
      <div class="stat-card">💰<br/><strong>₹${revenue}</strong><br/><small>Revenue</small></div>
    </div>

    <h3>👥 Registered Users</h3>
    <table class="db-table">
      <tr><th>#</th><th>Name</th><th>Email</th></tr>
      ${db.users.length === 0
        ? "<tr><td colspan='3' style='color:#999;text-align:center'>No users registered yet</td></tr>"
        : db.users.map((u,i) => `<tr><td>${i+1}</td><td>${u.name}</td><td>${u.email}</td></tr>`).join("")}
    </table>

    <h3 style="margin-top:28px">📦 All Orders</h3>
    <table class="db-table">
      <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th></tr>
      ${db.orders.length === 0
        ? "<tr><td colspan='6' style='color:#999;text-align:center'>No orders yet</td></tr>"
        : db.orders.slice().reverse().map(o => `
          <tr>
            <td style="font-size:0.75rem;color:#666">${o.id}</td>
            <td>${o.user}<br/><small style="color:#999">${o.email}</small></td>
            <td>${o.items.map(i=>`${i.emoji}×${i.qty}`).join(" ")}</td>
            <td><strong>₹${o.total}</strong></td>
            <td style="font-size:0.8rem">${o.date}</td>
            <td><span class="order-status">✅ ${o.status}</span></td>
          </tr>`).join("")}
    </table>
  `;
}

// ── PAGE NAVIGATION ───────────────────────────────────────────
function showPage(name) {
  ["home","cart","orders","login","admin"].forEach(p =>
    document.getElementById("page-" + p).style.display = "none"
  );
  document.getElementById("page-" + name).style.display = "block";
  if (name === "cart")   renderCart();
  if (name === "orders") renderOrders();
  if (name === "admin")  renderAdmin();
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.style.display = "block";
  setTimeout(() => t.style.display = "none", 2500);
}
