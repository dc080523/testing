window.onload = async () => {
    const productList = document.getElementById('product-list');
    
    try {
        const response = await fetch('https://independent-renewal-production.up.railway.app/api/products');
        const products = await response.json();
        
        console.log(products);  // Debug Produc data
        
        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product');
            
            productDiv.innerHTML = `
                <h2>${product.name}</h2>
                <p>${product.description}</p>
                <p><strong>${product.price}</strong></p>
                <img src="${product.image}" alt="${product.name}">
            `;
            
            productList.appendChild(productDiv);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    }
};
