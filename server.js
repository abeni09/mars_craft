const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/admin', express.static('admin'));
app.use('/uploads', express.static('uploads'));

// File paths
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');

// Helper function to read/write JSON
async function readProducts() {
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeProducts(products) {
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `New Contact Form Submission from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const today = new Date();
        const expectedPassword = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}@${process.env.COMPANY_NAME}`;
        
        if (token !== expectedPassword) {
            throw new Error('Invalid token');
        }
        
        next();
    } catch (error) {
        console.log(error);
        
        res.status(401).json({ message: 'Invalid authentication token' });
    }
};

// Admin routes
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    const today = new Date();
    const expectedPassword = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}@${process.env.COMPANY_NAME}`;

    if (password === expectedPassword) {
        res.json({ token: expectedPassword });
    } else {
        res.status(401).json({ message: 'Invalid password' });
    }
});

// Authentication verification route
app.get('/api/authenticate', authenticateAdmin, (req, res) => {
    res.json({ message: 'Authenticated' });
});

// Product Routes
app.get('/api/products', async (req, res) => {
    try {
        const products = await readProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/products', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!name || !description || !imagePath) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const products = await readProducts();
        const newProduct = {
            id: Date.now().toString(),
            name,
            description,
            image: imagePath
        };

        products.push(newProduct);
        await writeProducts(products);

        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Failed to add product' });
    }
});

app.put('/api/products/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const products = await readProducts();
        const productIndex = products.findIndex(p => p.id === id);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update the product
        const updatedProduct = {
            ...products[productIndex],
            name: name || products[productIndex].name,
            description: description || products[productIndex].description,
        };

        // If a new image is uploaded, update the image path
        if (req.file) {
            // Delete old image if it exists
            const oldImagePath = path.join(__dirname, products[productIndex].image);
            try {
                await fs.unlink(oldImagePath);
            } catch (error) {
                console.error('Error deleting old image:', error);
            }
            updatedProduct.image = `/uploads/${req.file.filename}`;
        }

        products[productIndex] = updatedProduct;
        await writeProducts(products);

        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product' });
    }
});

app.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const products = await readProducts();
        const productIndex = products.findIndex(p => p.id === id);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const deletedProduct = products[productIndex];
        products.splice(productIndex, 1);
        await writeProducts(products);

        // Delete product image if it exists
        if (deletedProduct.image) {
            const imagePath = path.join(__dirname, 'public', deletedProduct.image);
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.error('Error deleting product image:', error);
            }
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port localhost:${port}`);
});
