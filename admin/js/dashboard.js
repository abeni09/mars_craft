document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    const addProductForm = document.getElementById('add-product-form');
    const productGrid = document.getElementById('productGrid');

    // Load products
    async function loadProducts() {
        try {
            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const products = await response.json();
                displayProducts(products);
            } else {
                throw new Error('Failed to load products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            productGrid.innerHTML = '<div class="error-message">Failed to load products</div>';
        }
    }

    // Display products in grid
    function displayProducts(products) {
        if (!products.length) {
            productGrid.innerHTML = '<div class="no-products">No products found</div>';
            return;
        }

        productGrid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-details">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Handle new product submission
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
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert('Product added successfully');
                addProductForm.reset();
                loadProducts();
            } else {
                throw new Error('Failed to add product');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product. Please try again.');
        }
    });

    // Handle product deletion
    window.deleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Product deleted successfully');
                loadProducts();
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product. Please try again.');
        }
    };

    // Handle logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    });

    // Initial load
    loadProducts();
});
