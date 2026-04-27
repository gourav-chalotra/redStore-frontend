// Change this to your Render backend URL after deployment (e.g., https://your-app.onrender.com/api)
const API_URL = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
    ? 'http://localhost:5001/api'
    : 'https://redstore-backend-a5vl.onrender.com/api'; // Live Render backend URL

// Cart Logic
let cart = JSON.parse(localStorage.getItem('redstore_cart')) || [];

function addToCart(product) {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    alert('Item added to cart!');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function updateQuantity(index, qty) {
    if (qty < 1) return;
    cart[index].quantity = parseInt(qty);
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('redstore_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartIcon = document.querySelector('.navbar a[href="cart.html"]');
    if (cartIcon) {
        let badge = cartIcon.querySelector('.cart-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.style.cssText = 'background: #ff523b; color: #fff; padding: 2px 6px; border-radius: 50%; font-size: 10px; vertical-align: top; margin-left: -10px;';
            cartIcon.appendChild(badge);
        }
        badge.innerText = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function renderCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 50px;">Your cart is empty.</td></tr>';
        updateTotals();
        return;
    }

    let html = '<tr><th>Product</th><th>Quantity</th><th>Subtotal</th></tr>';
    cart.forEach((item, index) => {
        html += `
            <tr>
                <td>
                    <div class="cart-info">
                        <img src="${item.image}">
                        <div>
                            <p>${item.name}</p>
                            <small>Price: ₹${item.price.toFixed(2)}</small>
                            <br>
                            <a href="#" onclick="removeFromCart(${index})">Remove</a>
                        </div>
                    </div>
                </td>
                <td><input type="number" value="${item.quantity}" onchange="updateQuantity(${index}, this.value)"></td>
                <td>₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `;
    });
    container.innerHTML = html;
    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.175; // 17.5% tax
    const total = subtotal + tax;

    if (document.getElementById('subtotal')) document.getElementById('subtotal').innerText = `₹${subtotal.toFixed(2)}`;
    if (document.getElementById('tax')) document.getElementById('tax').innerText = `₹${tax.toFixed(2)}`;
    if (document.getElementById('total-price')) document.getElementById('total-price').innerText = `₹${total.toFixed(2)}`;
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const orderId = 'ORD' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    alert(`Order is placed successfully!\nOrder ID: ${orderId}`);
    
    // Clear cart after purchase
    cart = [];
    saveCart();
    renderCart();
}

// Auth Logic
async function handleRegister(e) {
    e.preventDefault();
    const username = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;

    try {
        console.log(`Attempting fetch to: ${API_URL}/register`);
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Registration successful! Please login.');
            login(); // Switch to login form
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (err) {
        console.error('Registration Error:', err);
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
            alert('CORS or Network Error: Could not connect to the backend.\n1. Ensure the backend is running.\n2. Check if the URL is correct: ' + API_URL);
        } else {
            alert('Server Error: ' + err.message);
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Logging in...';
    btn.disabled = true;

    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
        console.log(`Attempting login to: ${API_URL}/login`);
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('redstore_token', data.token);
            localStorage.setItem('redstore_user', JSON.stringify(data.user));
            alert(`Welcome back, ${data.user.username}! Redirecting to home...`);
            window.location.href = 'index.html';
        } else {
            alert(data.error || 'Login failed');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        console.error('Login Error:', err);
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
            alert('CORS or Network Error: Could not connect to the backend.\nCheck if the server is running at: ' + API_URL);
        } else {
            alert('Server Error: ' + err.message);
        }
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('redstore_user'));
    const profileSection = document.getElementById('ProfileSection');
    const loginForm = document.getElementById('LoginForm');
    const regForm = document.getElementById('RegForm');
    const formBtn = document.querySelector('.form-btn');
    const authItem = document.getElementById('auth-item');

    if (user) {
        // Update Navbar to show Logout instead of Account
        if (authItem) {
            authItem.innerHTML = `<a href="#" onclick="logout()" style="color: #ff0000;">Logout</a>`;
        }

        // Update Account Page Profile View
        if (profileSection) {
            const container = document.getElementById('FormContainer');
            const sidebar = document.getElementById('DashboardSidebar');
            const authToggle = document.getElementById('AuthToggle');
            const refreshTime = document.getElementById('refresh-time');

            if (container) {
                container.style.width = '1000px';
                container.style.height = 'auto';
                container.style.minHeight = '600px';
                container.style.padding = '40px';
                container.style.background = '#f8f9fa';
                container.style.boxShadow = 'none';
            }
            if (sidebar) sidebar.style.display = 'block';
            if (authToggle) authToggle.style.display = 'none';
            if (refreshTime) refreshTime.innerText = new Date().toLocaleString();

            profileSection.style.display = 'block';
            if (loginForm) loginForm.style.display = 'none';
            if (regForm) regForm.style.display = 'none';

            document.getElementById('profile-username').innerText = user.username;
            document.getElementById('profile-email-input').value = user.email || '';
            document.getElementById('profile-phone-input').value = user.phone || '';
            document.getElementById('profile-dob-input').value = user.dob || '';
            
            // New fields from dashboard
            if (document.getElementById('profile-fname')) document.getElementById('profile-fname').value = user.fname || '';
            if (document.getElementById('profile-lname')) document.getElementById('profile-lname').value = user.lname || '';
            // Country and Address are also handled similarly if they have IDs
        }
    }
 else {
        // Show Login link if not logged in
        if (authItem) {
            authItem.innerHTML = `<a href="account.html">Login</a>`;
        }
    }
}

async function saveProfile() {
    const user = JSON.parse(localStorage.getItem('redstore_user'));
    if (!user) return;

    const updatedData = {
        email: document.getElementById('profile-email-input').value,
        phone: document.getElementById('profile-phone-input').value,
        dob: document.getElementById('profile-dob-input').value,
        fname: document.getElementById('profile-fname') ? document.getElementById('profile-fname').value : user.fname,
        lname: document.getElementById('profile-lname') ? document.getElementById('profile-lname').value : user.lname,
        // Add other fields as needed
    };

    try {
        console.log(`Attempting profile update to: ${API_URL}/update-profile`);
        const res = await fetch(`${API_URL}/update-profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('redstore_token')}`
            },
            body: JSON.stringify(updatedData)
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('redstore_user', JSON.stringify(data.user));
            alert('Profile updated successfully in Database!');
        } else {
            alert(data.error || 'Update failed');
        }
    } catch (err) {
        console.error('Profile Update Error:', err);
        alert('Server Error: Could not save profile. Check connection to ' + API_URL);
    }
}

function logout() {
    localStorage.removeItem('redstore_token');
    localStorage.removeItem('redstore_user');
    window.location.reload();
}

// Product Logic
async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const products = await res.json();
        return products;
    } catch (err) {
        console.error('Error fetching products:', err);
        return [];
    }
}

function renderProductsList(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'col-4';
        div.innerHTML = `
            <img src="${product.image}">
            <h4>${product.name}</h4>
            <div class="rating">
                ${Array(Math.floor(product.rating)).fill('<i class="fa fa-star"></i>').join('')}
                ${product.rating % 1 !== 0 ? '<i class="fa fa-star-half-o"></i>' : ''}
            </div>
            <p>₹${product.price.toFixed(2)}</p>
            <button class="btn" onclick='addToCart(${JSON.stringify(product)})'>Add To Cart</button>
        `;
        container.appendChild(div);
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('RegForm')) {
        document.getElementById('RegForm').addEventListener('submit', handleRegister);
    }
    if (document.getElementById('LoginForm')) {
        document.getElementById('LoginForm').addEventListener('submit', handleLogin);
    }
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }
    
    // Render products on index and products pages
    if (document.getElementById('featured-products') || document.getElementById('all-products')) {
        const products = await fetchProducts();
        renderProductsList(products.slice(0, 4), 'featured-products');
        renderProductsList(products, 'all-products');
    }
    updateCartCount();
    checkAuth();
});
