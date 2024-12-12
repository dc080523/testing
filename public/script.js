// Admin Add Product Page
document.querySelector("#add-product-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);

  const response = await fetch("/add-product", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  alert(result.message);
  e.target.reset();
});

// Ordering Page
(async function loadProducts() {
  const response = await fetch("/products");
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
})();
