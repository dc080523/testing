const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// File Upload Configuration
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Products Data
const productsFile = "./products.json";
const getProducts = () => {
  try {
    return JSON.parse(fs.readFileSync(productsFile, "utf-8"));
  } catch (err) {
    return []; // If there's an error reading the file, return an empty array
  }
};

// Add Product API
app.post("/add-product", upload.single("productImage"), (req, res) => {
  const { productId, productName, productDescription, productPrice } = req.body;
  const newProduct = {
    id: productId,
    name: productName,
    description: productDescription,
    price: parseFloat(productPrice),
    image: req.file ? req.file.filename : null,
  };

  const products = getProducts();
  products.unshift(newProduct); // Add to the top of the list
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));

  res.json({ message: "Product added successfully!" });
});

// Get Products API
app.get("/products", (req, res) => {
  const products = getProducts();
  res.json(products);
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
