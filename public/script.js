// JavaScript for Mars Craft Store

// Custom cursor movement
document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.querySelector('.cursor');
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
});

// Load and display products
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        const productList = document.querySelector('.product-list');
        
        if (products.length === 0) {
            productList.innerHTML = '<p class="no-products">No products available at the moment.</p>';
            return;
        }
        
        productList.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <div class="hover-text">View Details</div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="description">${product.description}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        document.querySelector('.product-list').innerHTML = 
            '<p class="error-message">Failed to load products. Please try again later.</p>';
    }
}

// Contact form handling
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');
    const submitBtn = contactForm.querySelector('.submit-btn');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Change button state
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Get form data
        const formData = {
            name: contactForm.querySelector('#name').value,
            email: contactForm.querySelector('#email').value,
            message: contactForm.querySelector('#message').value
        };

        try {
            const response = await fetch('http://localhost:3000/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                showNotification('Message sent successfully!', 'success');
                contactForm.reset();
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error) {
            // Show error message
            showNotification(error.message, 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = 'Send Message';
            submitBtn.disabled = false;
        }
    });
});

// Notification system
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add notification to page
    document.body.appendChild(notification);

    // Add styles dynamically
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 2rem';
    notification.style.borderRadius = '4px';
    notification.style.color = 'white';
    notification.style.background = type === 'success' ? '#000' : '#ff0000';
    notification.style.animation = 'slideIn 0.5s ease-out';
    notification.style.zIndex = '10000';

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Add notification animations to existing styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);
