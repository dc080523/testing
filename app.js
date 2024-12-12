const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // Use environment variable for secret
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 600000 } // 10 minutes session expiration
}));

// File Upload Configuration
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Simple admin authentication (hardcoded for demonstration)
const adminCredentials = { username: "admin", password: "password" };

// Admin Login API
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === adminCredentials.username && password === adminCredentials.password) {
    req.session.adminLoggedIn = true;
    res.status(200).send("Login successful");
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// Admin authentication middleware
function checkAdmin(req, res, next) {
  if (!req.session.adminLoggedIn) {
    return res.status(403).send("Unauthorized access");
  }
  next();
}

// Add Product API
app.post("/add-product", checkAdmin, upload.single("productImage"), (req, res) => {
  const { productId, productName, productDescription, productPrice } = req.body;

  // Validate required fields
  if (!productId || !productName || !productPrice) {
    return res.status(400).send("All product fields (ID, Name, Price) are required.");
  }

  const newProduct = {
    id: productId,
    name: productName,
    description: productDescription,
    price: parseFloat(productPrice),
    image: req.file ? req.file.filename : null,
  };

  const productsFile = "./products.json";
  let products = [];
  try {
    products = JSON.parse(fs.readFileSync(productsFile, "utf-8"));
  } catch (error) {
    // If file doesn't exist, create an empty array and initialize the file
    fs.writeFileSync(productsFile, JSON.stringify([], null, 2));
  }

  products.unshift(newProduct);  // Add product to the start of the list
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));

  res.json({ message: "Product added successfully!" });
});

// Get Products API
app.get("/products", (req, res) => {
  const productsFile = "./products.json";
  let products = [];
  try {
    products = JSON.parse(fs.readFileSync(productsFile, "utf-8"));
  } catch (error) {
    products = [];  // Return an empty list if file doesn't exist or has issues
  }
  res.json(products);
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
