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

// In-memory orders data (for demo purposes)
let orders = [];

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

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
        return res.status(403).send('Unauthorized');
    }
    next();
};

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
        req.fileValidationError = 'Only image files are allowed.';
        return cb(null, false);
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
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin Add Product Route (only accessible after login)
app.post('/add-product', isAdmin, upload.single('image'), (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).send(req.fileValidationError);
    }

    let { id, name, description, price } = req.body;

    // Validate product ID
    const idRegex = /^[a-zA-Z0-9]{1,20}$/;
    if (!id || !idRegex.test(id)) {
        return res.status(400).send('Error: Product ID must be alphanumeric and up to 20 characters.');
    }

    // Validate product Name
    const nameRegex = /^[a-zA-Z\s]{1,20}$/;
    if (!name || !nameRegex.test(name)) {
        return res.status(400).send('Error: Product Name must only contain alphabetic characters and spaces, up to 20 characters.');
    }

    // Validate product Description
    const descriptionRegex = /^[a-zA-Z0-9\s]{1,50}$/;
    if (!description || !descriptionRegex.test(description)) {
        return res.status(400).send('Error: Product Description must be alphanumeric and up to 50 characters.');
    }

    // Validate product Price
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!price || !priceRegex.test(price)) {
        return res.status(400).send('Error: Product Price must be a number without the peso sign (e.g., 500.00).');
    }

    // Automatically prepend the peso sign to the price
    price = '₱' + price;

    // Check if image file exists
    if (!req.file) {
        return res.status(400).send('Error: Product image is required.');
    }

    const newProduct = {
        id,
        name,
        description,
        price,
        image: '/images/' + req.file.filename,
    };

    products.unshift(newProduct);  // Add to the top of the list
    res.json({ success: true, product: newProduct });
});

// Admin Product List Route (only accessible after login)
app.get('/admin/products', isAdmin, (req, res) => {
    res.json(products);  // Send the list of products to the admin
});

// Admin Delete Product Route (only accessible after login)
app.delete('/admin/products/:id', isAdmin, (req, res) => {
    const { id } = req.params;

    // Find the index of the product to delete
    const productIndex = products.findIndex(product => product.id === id);
    
    // If product not found, return an error
    if (productIndex === -1) {
        return res.status(404).json({ message: 'Product not found.' });
    }

    // Delete the product from the array
    const deletedProduct = products.splice(productIndex, 1);

    // Optionally, delete the image file from the filesystem if necessary
    const imagePath = './public' + deletedProduct[0].image;
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);  // Delete the image file
    }

    res.json({ success: true, message: 'Product deleted successfully', product: deletedProduct[0] });
});

// Admin logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/index.html');  // Redirect to homepage after logout
    });
});

// API to fetch all products (for the frontend)
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Admin session check route (checks if user is logged in as admin)
app.get('/check-admin-session', (req, res) => {
    res.json({ isAdmin: req.session.isAdmin || false });
});

// API to handle placing an order
app.post('/api/orders', (req, res) => {
    const { products: orderedProducts, name, email, address, phone } = req.body;

    // Basic validation for the order data
    if (!orderedProducts || orderedProducts.length === 0) {
        return res.status(400).json({ message: 'At least one product must be selected.' });
    }
    if (!name || !email || !address || !phone) {
        return res.status(400).json({ message: 'All shipping information must be provided.' });
    }

    // Create the order object
    const newOrder = {
        id: orders.length + 1, // Simple ID generation
        products: orderedProducts, // List of product IDs
        name,
        email,
        address,
        phone,
        status: 'Pending', // Default status
    };

    // Save the order to the orders array
    orders.push(newOrder);

    // Send a success response
    res.json({ message: 'Order placed successfully!', order: newOrder });
});

// Optional: Add a route to get the list of orders (for admin purposes)
app.get('/admin/orders', isAdmin, (req, res) => {
    res.json(orders); // Send the list of orders to the admin
});

// Home route (For checking that the server is up)
app.get('/', (req, res) => {
    res.send('Server is up and running!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${po
