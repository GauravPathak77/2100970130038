const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Cache to store product data
let productCache = {};
let accessToken = null;

// Function to fetch access token
const fetchAccessToken = async () => {
    try {
        const response = await axios.post('http://20.244.56.144/test/auth', {
            companyName: "goMart",
            clientID: "4284630c-99a9-441d-8eaf-e5fae7cc34d8",
            clientSecret: "JlEJMZXlCjJSTMqo",
            ownerName: "Gaurav",
            ownerEmail: "gauravpathak182@gmail.com",
            rollNo: "2100970130038"
        });
        accessToken = response.data.accessToken;
    } catch (error) {
        console.error('Error fetching access token:', error);
    }
};

// Helper function to fetch products from test API
const fetchProducts = async (company, category, minPrice, maxPrice, top) => {
    const url = `http://20.244.56.144/test/companies/${company}/categories/${category}/products?top=${top}&minPrice=${minPrice}&maxPrice=${maxPrice}`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};

// Endpoint to get top N products
app.get('/categories/:category/products', async (req, res) => {
    const { category } = req.params;
    const { n, page = 1, minPrice = 0, maxPrice = Infinity, sort = 'price', order = 'asc' } = req.query;

    console.log('Received Request:');
    console.log('Category:', category);
    console.log('Query Parameters:', { n, page, minPrice, maxPrice, sort, order });

    if (n > 10) {
        console.log('Error: n exceeds maximum limit of 10');
        return res.status(400).json({ error: 'n exceeds maximum limit of 10' });
    }

    try {
        let products = [];

        const companies = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];
        for (let company of companies) {
            const companyProducts = await fetchProducts(company, category, minPrice, maxPrice, n);
            products = products.concat(companyProducts);
        }

        // Sort products
        products.sort((a, b) => {
            if (order === 'asc') {
                return a[sort] - b[sort];
            } else {
                return b[sort] - a[sort];
            }
        });

        // Paginate products
        const paginatedProducts = products.slice((page - 1) * n, page * n);
        console.log('Paginated Products:', paginatedProducts);

        res.json(paginatedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: error.message });
    }
});


// Endpoint to get product details
app.get('/categories/:category/products/:productid', async (req, res) => {
    const { category, productid } = req.params;

    // Assuming we store the product details in the cache
    const product = productCache[productid];

    if (product) {
        console.log("Product Details: ", product);
        res.json(product);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
