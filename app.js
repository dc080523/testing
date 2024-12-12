// Product data handling
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
    fs.writeFileSync(productsFile, JSON.stringify([], null, 2));
  }

  products.unshift(newProduct);  // Add product to the start of the list
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));

  res.json({ message: "Product added successfully!" });
});
