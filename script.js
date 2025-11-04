// script.js
// All prices shown in INR by converting from FakeStore (USD -> INR).
const INR_RATE = 82; // 1 USD = 82 INR (adjust if desired)

const API = "https://fakestoreapi.com/products";
const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cartIcon = document.getElementById("cartIcon");
const wishlistIcon = document.getElementById("wishlistIcon");
const cartSidebar = document.getElementById("cartSidebar");
const wishlistSidebar = document.getElementById("wishlistSidebar");
const cartItems = document.getElementById("cartItems");
const wishlistItems = document.getElementById("wishlistItems");
const cartCount = document.getElementById("cartCount");
const wishlistCount = document.getElementById("wishlistCount");
const cartTotal = document.getElementById("cartTotal");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartDiscount = document.getElementById("cartDiscount");
const discountRow = document.getElementById("discountRow");
const offerNotice = document.getElementById("offerNotice");
const offerText = document.getElementById("offerText");
const clearCartBtn = document.getElementById("clearCart");
const clearWishlistBtn = document.getElementById("clearWishlist");
const moveAllToCartBtn = document.getElementById("moveAllToCart");
const closeModal = document.getElementById("closeModal");
const modal = document.getElementById("productModal");
const addToCartModal = document.getElementById("addToCartModal");
const addToWishlistModal = document.getElementById("addToWishlistModal");
const checkoutBtn = document.getElementById("checkout");
const closeCartSidebar = document.getElementById("closeCartSidebar");
const closeWishlistSidebar = document.getElementById("closeWishlistSidebar");

// Quantity modal elements
const quantityModal = document.getElementById("quantityModal");
const closeQuantityModal = document.getElementById("closeQuantityModal");
const quantityInput = document.getElementById("quantityInput");
const decreaseQty = document.getElementById("decreaseQty");
const increaseQty = document.getElementById("increaseQty");
const confirmAddToCart = document.getElementById("confirmAddToCart");

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let selectedProductId = null;

// Offer configurations
const OFFERS = {
  FLAT_DISCOUNT: { threshold: 2000, discount: 0.20 },
  FREE_SHIPPING: { threshold: 2000 },
  BUY_2_GET_1: { categories: ["electronics", "jewelery"] }
};

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

// Check if product has Buy 2 Get 1 offer
function hasBuy2Get1Offer(product) {
  return OFFERS.BUY_2_GET_1.categories.includes(product.category);
}

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
    div.setAttribute('tabindex', '0');
    const priceINR = toINR(p.price);
    const isInWishlist = wishlist.some(item => item.id === p.id);
    const hasOffer = hasBuy2Get1Offer(p);
    
    div.innerHTML = `
      ${hasOffer ? '<div class="offer-badge">Buy 2 Get 1 🎁</div>' : ''}
      <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${p.id}); event.stopPropagation();">
        ${isInWishlist ? '❤️' : '🤍'}
      </button>
      <div class="img-wrap">
        <img src="${p.image}" alt="${p.title}">
      </div>
      <h3 title="${p.title}">${p.title.length > 70 ? p.title.slice(0, 70) + "…" : p.title}</h3>
      <p class="muted">${p.category}</p>
      <div class="card-meta">
        <div class="price">₹${priceINR}</div>
        <div class="btn-group">
          <button class="btn btn-primary" onclick="openQuantityModal(${p.id}); event.stopPropagation();">Add</button>
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
  
  // Add to cart handler
  addToCartModal.onclick = () => {
    closeProductModal();
    openQuantityModal(product.id);
  };
  
  // Add to wishlist handler
  addToWishlistModal.onclick = () => {
    toggleWishlist(product.id);
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
window.onclick = (e) => { 
  if (e.target === modal) closeProductModal(); 
  if (e.target === quantityModal) closeQuantityModalFunc();
};
window.addEventListener("keydown", (e) => { 
  if (e.key === "Escape") { 
    closeProductModal(); 
    closeQuantityModalFunc();
    cartSidebar.classList.remove("open");
    wishlistSidebar.classList.remove("open");
  }
});

// Quantity Modal Functions
function openQuantityModal(id) {
  selectedProductId = id;
  quantityInput.value = 1;
  quantityModal.style.display = "flex";
  quantityModal.setAttribute("aria-hidden", "false");
}

function closeQuantityModalFunc() {
  quantityModal.style.display = "none";
  quantityModal.setAttribute("aria-hidden", "true");
  selectedProductId = null;
}

closeQuantityModal.onclick = closeQuantityModalFunc;

decreaseQty.onclick = () => {
  let val = parseInt(quantityInput.value);
  if (val > 1) {
    quantityInput.value = val - 1;
  }
};

increaseQty.onclick = () => {
  let val = parseInt(quantityInput.value);
  quantityInput.value = val + 1;
};

confirmAddToCart.onclick = () => {
  const quantity = parseInt(quantityInput.value);
  if (quantity > 0 && selectedProductId) {
    addToCart(selectedProductId, quantity);
    closeQuantityModalFunc();
  }
};

// Wishlist Functions
function toggleWishlist(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  const existingIndex = wishlist.findIndex(item => item.id === id);
  
  if (existingIndex !== -1) {
    wishlist.splice(existingIndex, 1);
    showNotice("Removed from wishlist 💔");
  } else {
    wishlist.push({ 
      id: product.id, 
      title: product.title, 
      priceUSD: product.price, 
      image: product.image,
      category: product.category
    });
    showNotice("Added to wishlist ❤️");
  }
  
  updateWishlist();
  displayProducts(products.filter(p => {
    const query = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const matchesCategory = category === "all" || p.category === category;
    const matchesSearch = p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  }));
}

function updateWishlist() {
  wishlistItems.innerHTML = "";
  
  if (wishlist.length === 0) {
    wishlistItems.innerHTML = '<li style="padding: 20px; text-align: center; color: #657284;">Your wishlist is empty</li>';
  } else {
    wishlist.forEach(item => {
      const priceINR = Number(item.priceUSD) * INR_RATE;
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="item-info">
          <div class="title" title="${item.title}">${item.title.length > 36 ? item.title.slice(0,36) + "…" : item.title}</div>
          <div class="muted">₹${formatINR(priceINR)}</div>
        </div>
        <div class="item-controls">
          <button class="small" title="Add to Cart" onclick="moveToCart(${item.id})">🛒</button>
          <button class="small" title="Remove" onclick="removeFromWishlist(${item.id})">🗑️</button>
        </div>
      `;
      wishlistItems.appendChild(li);
    });
  }
  
  wishlistCount.textContent = wishlist.length;
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function removeFromWishlist(id) {
  wishlist = wishlist.filter(i => i.id !== id);
  updateWishlist();
  displayProducts(products.filter(p => {
    const query = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const matchesCategory = category === "all" || p.category === category;
    const matchesSearch = p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  }));
  showNotice("Removed from wishlist ❌");
}

function moveToCart(id) {
  openQuantityModal(id);
  wishlistSidebar.classList.remove("open");
}

clearWishlistBtn.onclick = () => {
  if (!wishlist.length) return;
  wishlist = [];
  updateWishlist();
  displayProducts(products.filter(p => {
    const query = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const matchesCategory = category === "all" || p.category === category;
    const matchesSearch = p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  }));
  showNotice("Wishlist cleared 🧹");
};

moveAllToCartBtn.onclick = () => {
  if (!wishlist.length) return;
  wishlist.forEach(item => {
    addToCart(item.id, 1);
  });
  wishlist = [];
  updateWishlist();
  displayProducts(products.filter(p => {
    const query = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const matchesCategory = category === "all" || p.category === category;
    const matchesSearch = p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  }));
  wishlistSidebar.classList.remove("open");
  showNotice("All items moved to cart 🛒");
};

closeWishlistSidebar.onclick = () => {
  wishlistSidebar.classList.remove("open");
};

wishlistIcon.onclick = () => {
  wishlistSidebar.classList.toggle("open");
  cartSidebar.classList.remove("open");
};

// Cart Functions with Offers
function calculateCartTotals() {
  let subtotalINR = 0;
  let discount = 0;
  
  cart.forEach(item => {
    const priceINR = Number(item.priceUSD) * INR_RATE;
    subtotalINR += priceINR * item.quantity;
  });
  
  // Apply flat 20% discount on orders above ₹2000
  if (subtotalINR >= OFFERS.FLAT_DISCOUNT.threshold) {
    discount = subtotalINR * OFFERS.FLAT_DISCOUNT.discount;
    discountRow.style.display = "flex";
    offerNotice.style.display = "flex";
    offerText.textContent = "You saved 20% on your order!";
  } else {
    discountRow.style.display = "none";
    offerNotice.style.display = "none";
  }
  
  const total = subtotalINR - discount;
  
  return { subtotalINR, discount, total };
}

function addToCart(id, quantity = 1) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ 
      id: product.id, 
      title: product.title, 
      priceUSD: product.price, 
      image: product.image, 
      quantity: quantity,
      category: product.category
    });
  }
  updateCart();
  showNotice("Item added to cart 🛒");
  cartSidebar.classList.add("open");
}

function updateCart() {
  cartItems.innerHTML = "";
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<li style="padding: 20px; text-align: center; color: #657284;">Your cart is empty</li>';
  } else {
    cart.forEach(item => {
      const priceINR = Number(item.priceUSD) * INR_RATE;
      const subtotalINR = priceINR * item.quantity;

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
  }

  const { subtotalINR, discount, total } = calculateCartTotals();
  
  cartSubtotal.textContent = formatINR(subtotalINR);
  cartDiscount.textContent = formatINR(discount);
  cartTotal.textContent = formatINR(total);
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
  wishlistSidebar.classList.remove("open");
};

// Checkout
checkoutBtn.onclick = () => {
  if (cart.length === 0) {
    showNotice("Your cart is empty!");
    return;
  }
  window.location.href = "checkout.html";
};

// Initialize cart and wishlist UI
updateCart();
updateWishlist();

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
window.addEventListener('load', () => {
  document.querySelectorAll('.product-card').forEach(c => {
    if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex','0');
  });
});
