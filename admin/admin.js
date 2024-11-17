// DOM Elements
const loginForm = document.getElementById('login-form');
const dashboard = document.getElementById('dashboard');
const loginSection = document.getElementById('loginForm');
const addProductForm = document.getElementById('add-product-form');
const productList = document.getElementById('productList');
const logoutBtn = document.getElementById('logoutBtn');

// Check if user is logged in
const password = localStorage.getItem('adminPassword');
if (password) {
    showDashboard();
    loadProducts();
}

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminPassword', password);
            showDashboard();
            loadProducts();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
});

// Add Product Form Handler
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('productName').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('image', document.getElementById('productImage').files[0]);
    
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminPassword')}`
            },
            body: formData
        });
        
        if (response.ok) {
            addProductForm.reset();
            loadProducts();
            alert('Product added successfully!');
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to add product');
        }
    } catch (error) {
        alert('Failed to add product. Please try again.');
    }
});

// Load Products
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        productList.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-actions">
                    <button onclick="deleteProduct('${product.id}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

// Delete Product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminPassword')}`
            }
        });
        
        if (response.ok) {
            loadProducts();
            alert('Product deleted successfully!');
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete product');
        }
    } catch (error) {
        alert('Failed to delete product. Please try again.');
    }
}

// Logout Handler
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminPassword');
    showLoginForm();
});

// UI Helpers
function showDashboard() {
    loginSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

function showLoginForm() {
    dashboard.classList.add('hidden');
    loginSection.classList.remove('hidden');
}
