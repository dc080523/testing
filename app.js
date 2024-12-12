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
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
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

// Add Product API
app.post("/add-product", upload.single("productImage"), (req, res) => {
  if (!req.session.adminLoggedIn) {
    return res.status(403).send("Unauthorized access");
  }

  const { productId, productName, productDescription, productPrice } = req.body;
  const newProduct = {
    id: productId,
    name: productName,
    description: productDescription,
    price: parseFloat(productPrice),
    image: req.file ? req.file.filename : null,
  };

  const productsFile = "./products.json";
  const products = JSON.parse(fs.readFileSync(productsFile, "utf-8"));
  products.unshift(newProduct);  // Add to the top of the list
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));

  res.json({ message: "Product added successfully!" });
});

// Get Products API
app.get("/products", (req, res) => {
  const productsFile = "./products.json";
  const products = JSON.parse(fs.readFileSync(productsFile, "utf-8"));
  res.json(products);
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
