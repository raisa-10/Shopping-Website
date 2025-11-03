// script.js
// All prices shown in INR by converting from FakeStore (USD -> INR).
const INR_RATE = 82; // 1 USD = 82 INR (adjust if desired)

const API = "https://fakestoreapi.com/products";
const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cartIcon = document.getElementById("cartIcon");
const cartSidebar = document.getElementById("cartSidebar");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCart");
const closeModal = document.getElementById("closeModal");
const modal = document.getElementById("productModal");
const addToCartModal = document.getElementById("addToCartModal");
const checkoutBtn = document.getElementById("checkout");
const closeCartSidebar = document.getElementById("closeCartSidebar");

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Create a small inline notice for user feedback (replaces alerts)
function showNotice(message) {
  let notice = document.getElementById("noticeInline");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "noticeInline";
    notice.style.position = "fixed";
    notice.style.top = "20px";
    notice.style.right = "20px";
    notice.style.background = "#0b74ff";
    notice.style.color = "#fff";
    notice.style.padding = "10px 16px";
    notice.style.borderRadius = "10px";
    notice.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    notice.style.fontWeight = "600";
    notice.style.zIndex = "9999";
    document.body.appendChild(notice);
  }
  notice.textContent = message;
  notice.style.display = "block";
  setTimeout(() => {
    notice.style.display = "none";
  }, 2500);
}

// Helper: convert USD to INR and format
function toINR(value) {
  const inr = Number(value) * INR_RATE;
  return inr.toFixed(2);
}

function formatINR(value) {
  const num = Number(value);
  return num.toFixed(2);
}

// Fetch products
async function fetchProducts() {
  try {
    const res = await fetch(API);
    products = await res.json();
    displayProducts(products);
    populateCategories(products);
  } catch (err) {
    console.error("Failed to fetch products:", err);
    productContainer.innerHTML = `<p style="padding:20px; color:#333">Unable to load products right now. Try again later.</p>`;
  }
}
fetchProducts();

// Display products
function displayProducts(items) {
  productContainer.innerHTML = "";

  if (!items || items.length === 0) {
    const no = document.createElement("div");
    no.className = "no-products";
    no.textContent = "No products found.";
    productContainer.appendChild(no);
    return;
  }

  items.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("product-card");
    div.setAttribute('tabindex', '0'); // accessible
    const priceINR = toINR(p.price);
    div.innerHTML = `
      <div class="img-wrap">
        <img src="${p.image}" alt="${p.title}">
      </div>
      <h3 title="${p.title}">${p.title.length > 70 ? p.title.slice(0, 70) + "…" : p.title}</h3>
      <p class="muted">${p.category}</p>
      <div class="card-meta">
        <div class="price">₹${priceINR}</div>
        <div class="btn-group">
          <button class="btn btn-primary" onclick="addToCart(${p.id}); event.stopPropagation();">Add</button>
          <button class="btn btn-outline" onclick="openModalById(${p.id}); event.stopPropagation();">Details</button>
        </div>
      </div>
    `;
    div.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON" && !e.target.closest("button")) openModal(p);
    });
    productContainer.appendChild(div);
  });
}

// Populate category filter
function populateCategories(productsList) {
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  const categories = [...new Set(productsList.map(p => p.category))];
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = capitalize(cat);
    categoryFilter.appendChild(opt);
  });
}

// Capitalize helper
function capitalize(str) {
  if (!str) return str;
  return str.split(" ").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

// Search and Filter
searchInput.addEventListener("input", filterProducts);
categoryFilter.addEventListener("change", filterProducts);

function filterProducts() {
  const query = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const filtered = products.filter(p => {
    const matchesCategory = category === "all" || p.category === category;
    const matchesSearch = p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  displayProducts(filtered);
}

// Modal Functions
function openModal(product) {
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("modalImage").src = product.image;
  document.getElementById("modalImage").alt = product.title;
  document.getElementById("modalName").textContent = product.title;
  document.getElementById("modalDescription").textContent = product.description;
  document.getElementById("modalPrice").textContent = `₹${toINR(product.price)}`;
  document.getElementById("modalRating").textContent = product.rating?.rate ?? "—";
  // attach the add handler
  addToCartModal.onclick = () => {
    addToCart(product.id);
    closeProductModal();
  };
}

function openModalById(id) {
  const p = products.find(x => x.id === id);
  if (p) openModal(p);
}

function closeProductModal() {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

closeModal.onclick = closeProductModal;
window.onclick = (e) => { if (e.target === modal) closeProductModal(); };
window.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeProductModal(); cartSidebar.classList.remove("open"); }} );

// Cart Functions
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(item => item.id === id);
  if (existing) existing.quantity++;
  else cart.push({ id: product.id, title: product.title, priceUSD: product.price, image: product.image, quantity: 1 });
  updateCart();
  showNotice("Item added to cart 🛒");
  cartSidebar.classList.add("open");
}

function updateCart() {
  cartItems.innerHTML = "";
  let totalINR = 0;
  cart.forEach(item => {
    const priceINR = Number(item.priceUSD) * INR_RATE;
    const subtotalINR = priceINR * item.quantity;
    totalINR += subtotalINR;

    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="item-info">
        <div class="title" title="${item.title}">${item.title.length > 36 ? item.title.slice(0,36) + "…" : item.title}</div>
        <div class="muted">₹${formatINR(priceINR)} × ${item.quantity}</div>
      </div>
      <div class="item-controls">
        <button class="small" onclick="changeQty(${item.id}, -1)">-</button>
        <div style="min-width:26px; text-align:center; font-weight:700;">${item.quantity}</div>
        <button class="small" onclick="changeQty(${item.id}, 1)">+</button>
        <button class="small" title="Remove" onclick="removeItem(${item.id})">🗑️</button>
      </div>
    `;
    cartItems.appendChild(li);
  });

  cartTotal.textContent = formatINR(totalINR);
  cartCount.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
  localStorage.setItem("cart", JSON.stringify(cart));
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) removeItem(id);
  }
  updateCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  updateCart();
  showNotice("Item removed ❌");
}

clearCartBtn.onclick = () => {
  if (!cart.length) return;
  cart = [];
  updateCart();
  showNotice("Cart cleared 🧹");
};

closeCartSidebar.onclick = () => {
  cartSidebar.classList.remove("open");
};

cartIcon.onclick = () => {
  cartSidebar.classList.toggle("open");
};

// Checkout
checkoutBtn.onclick = () => {
  window.location.href = "checkout.html";
};

// Initialize cart UI
updateCart();

// Timer (offer)
let countdown = 5 * 60;
const timerEl = document.getElementById("timer");
const timerInterval = setInterval(() => {
  if (countdown > 0) countdown--;
  const m = String(Math.floor(countdown / 60)).padStart(2, "0");
  const s = String(countdown % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
  if (countdown <= 0) {
    clearInterval(timerInterval);
    timerEl.textContent = "00:00";
  }
}, 1000);

// ensure dynamically-created product cards are tabbable immediately
// (we now set tabindex when creating cards, so this is kept for compatibility)
window.addEventListener('load', () => {
  document.querySelectorAll('.product-card').forEach(c => {
    if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex','0');
  });
});
