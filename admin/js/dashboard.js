// Function to load products
async function loadProducts() {
    const token = localStorage.getItem('adminToken');
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
        alert('Failed to load products. Please try again.');
    }
}

// Function to display products
function displayProducts(products) {
    const productGrid = document.getElementById('productGrid');
    if (products.length === 0) {
        productGrid.innerHTML = '<p>No products available.</p>';
        return;
    }

    productGrid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-details">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="openEditModal('${product.id}', '${product.name}', '${product.description}', '${product.image}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/authenticate', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem('adminToken');
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        console.error('Failed to authenticate:', error);
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    const addProductForm = document.getElementById('add-product-form');
    const productGrid = document.getElementById('productGrid');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('edit-product-form');
    const closeModal = document.querySelector('.close');

    // Modal handling
    closeModal.onclick = () => {
        editModal.style.display = 'none';
    }

    window.onclick = (event) => {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    }

    // Load products
    loadProducts();

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

    // Global functions for edit modal
    window.openEditModal = (id, name, description, image) => {
        document.getElementById('editProductId').value = id;
        document.getElementById('editProductName').value = name;
        document.getElementById('editProductDescription').value = description;
        const currentImage = document.getElementById('currentProductImage');
        currentImage.src = image;
        currentImage.style.display = 'block';
        document.getElementById('editModal').style.display = 'block';
    };

    // Handle edit form submission
    document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        // alert(token);
        
        const productId = document.getElementById('editProductId').value;
        const formData = new FormData();

        formData.append('name', document.getElementById('editProductName').value);
        formData.append('description', document.getElementById('editProductDescription').value);

        const imageFile = document.getElementById('editProductImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                document.getElementById('editModal').style.display = 'none';
                loadProducts(); // Refresh the product list
            } else {
                //logout automatically
                const error = await response.json();
                // alert(error.message || 'Failed to update product');
                localStorage.removeItem('adminToken');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Failed to update product');
        }
    });
});
