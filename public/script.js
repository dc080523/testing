// Admin Add Product Page with loading state and image preview
document.querySelector("#add-product-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const submitButton = e.target.querySelector("button[type='submit']");
  const loadingText = document.createElement("span");
  loadingText.textContent = "Adding product...";
  submitButton.disabled = true;
  submitButton.appendChild(loadingText);

  try {
    const response = await fetch("/add-product", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to add product");
    }

    const result = await response.json();
    alert(result.message);
    e.target.reset();
    document.getElementById("image-preview").style.display = "none"; // Hide preview
  } catch (error) {
    console.error("Error adding product:", error);
    alert("An error occurred while adding the product. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.removeChild(loadingText);
  }
});

// Image preview for the product image
document.querySelector("#productImage")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const imagePreview = document.getElementById("image-preview");
    imagePreview.src = event.target.result;
    imagePreview.style.display = "block"; // Show the preview
  };
  reader.readAsDataURL(file);
});

// Ordering Page - Load Products
(async function loadProducts() {
  try {
    const response = await fetch("/products");
    
    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const products = await response.json();

    const productList = document.getElementById("product-list");
    products.forEach(product => {
      const productDiv = document.createElement("div");
      productDiv.innerHTML = `
        <h2>${product.name}</h2>
        <p>${product.description}</p>
        <p>₱${product.price}</p>
        <img src="/uploads/${product.image}" alt="${product.name}" width="200">
      `;
      productList.appendChild(productDiv);
    });
  } catch (error) {
    console.error("Error loading products:", error);
    const productList = document.getElementById("product-list");
    productList.innerHTML = "<p>Failed to load products. Please try again later.</p>";
  }
})();
