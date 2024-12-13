const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Ensure the 'public/images' directory exists
const imagesDir = './public/images';
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// In-memory product data (for demo purposes)
let products = [
    {
        id: 'P001',
        name: 'Sample Product 1',
        description: 'A description for the first sample product.',
        price: '₱500.00',
        image: '/images/sample-product-1.jpg',
    },
    {
        id: 'P002',
        name: 'Sample Product 2',
        description: 'A description for the second sample product.',
        price: '₱800.00',
        image: '/images/sample-product-2.jpg',
    }
];

// Static files (for images)
app.use(express.static('public'));

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setting up session
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true,
}));

// Setup for file uploads using Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed.'));
    }
});

// Admin login credentials
const adminCredentials = { username: 'admin', password: 'admin123' };

// Serve HTML files for the frontend
app.use(express.static('frontend'));

// Admin Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminCredentials.username && password === adminCredentials.password) {
        req.session.isAdmin = true;
        res.redirect('/admin.html');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Admin Add Product Route (only accessible after login)
app.post('/add-product', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).send('Unauthorized');
    }

    const { id, name, description, price } = req.body;
    if (!id || !name || !description || !price) {
        return res.status(400).send('All product fields are required');
    }

    const newProduct = {
        id,
        name,
        description,
        price,
        image: '/images/' + req.file.filename,
    };
    products.unshift(newProduct);  // Add to the top of the list
    res.redirect('/');  // Redirect to homepage or product list after adding the product
});

// Admin Product List Route (only accessible after login)
app.get('/admin/products', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).send('Unauthorized');
    }

    res.json(products);  // Send the list of products to the admin
});

// Admin logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');  // Redirect to the homepage after logout
    });
});

// API to fetch all products (for the frontend)
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Admin session check route (checks if user is logged in as admin)
app.get('/check-admin-session', (req, res) => {
    if (req.session.isAdmin) {
        res.json({ isAdmin: true });
    } else {
        res.json({ isAdmin: false });
    }
});

// Home route (For checking that the server is up)
app.get('/', (req, res) => {
    res.send('Server is up 
