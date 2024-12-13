const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

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

// Ensure the public/images directory exists
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Static files (for images)
app.use(express.static('public'));

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setting up session with secure cookie in production
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true if in production (HTTPS)
    }
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

const upload = multer({ storage: storage });

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
    const newProduct = {
        id,
        name,
        description,
        price,
        image: '/images/' + req.file.filename,
    };
    products.unshift(newProduct);  // Add to the top of the list
    res.redirect('/admin.html');  // Redirect to the admin page after adding the product
});

// API to fetch all products (for the frontend)
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Admin logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin.html');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
