# Product API Integration Guide

## Overview

This document describes how to integrate products from the Anitha Stores application into another website. The application provides a public API endpoint that returns all available products that can be displayed on your external website.

## Step-by-Step Integration Guide

### Step 1: Get Your API Server URL

First, you need to know your API server's base URL. This is the domain where your backend server is hosted.

**Examples:**
- `https://api.anithastores.com`
- `https://your-app.railway.app`
- `https://your-app.herokuapp.com`
- `http://localhost:5000` (for local testing)

The full API endpoint will be: `YOUR_API_URL/api/products/public`

### Step 2: Test the API Endpoint

Before integrating, test that the API is working:

1. **Open your browser** and visit: `YOUR_API_URL/api/products/public`
2. You should see a JSON response with products
3. If you see an error, check:
   - Is the server running?
   - Is the URL correct?
   - Are there any CORS issues? (check browser console)

### Step 3: Choose Your Integration Method

Choose based on your website's technology:

- **HTML/JavaScript Website**: Use the Vanilla JavaScript example
- **React Website**: Use the React/JavaScript example
- **PHP Website**: Use the PHP example
- **WordPress**: Use PHP code in a custom template or plugin
- **Other Framework**: Adapt the JavaScript example to your framework

### Step 4: Add the Code to Your Website

#### For HTML/JavaScript Website:

1. **Create or edit your products page** (e.g., `products.html`)
2. **Copy the Vanilla JavaScript example** from this document
3. **Replace** `https://your-api-domain.com` with your actual API URL
4. **Customize the styling** to match your website's design
5. **Save and test** the page

#### For React Website:

1. **Create a new component** (e.g., `ProductSection.jsx`)
2. **Copy the React example** code
3. **Replace** `https://your-api-domain.com` with your actual API URL
4. **Import and use** the component in your products page:
   ```jsx
   import ProductSection from './ProductSection';
   
   function ProductsPage() {
     return (
       <div>
         <h1>Our Products</h1>
         <ProductSection />
       </div>
     );
   }
   ```

#### For PHP Website:

1. **Create or edit your products page** (e.g., `products.php`)
2. **Copy the PHP example** code
3. **Replace** `https://your-api-domain.com` with your actual API URL
4. **Add your HTML structure** around the PHP code
5. **Save and test** the page

### Step 5: Configure CORS (If Needed)

If you get CORS errors when testing:

1. **Check your website's domain** (e.g., `https://yourwebsite.com`)
2. **Add it to the server's environment variables**:
   - Set `FRONTEND_URLS` environment variable on your server
   - Include your website URL: `FRONTEND_URLS=https://yourwebsite.com,https://www.yourwebsite.com`
3. **Restart your server** after updating environment variables
4. **Test again**

### Step 6: Customize the Display

Customize how products are displayed:

1. **Styling**: Modify CSS to match your website's design
2. **Layout**: Change grid/column layout as needed
3. **Fields**: Show/hide product fields (category, item code, etc.)
4. **Images**: Add placeholder images if `image_url` is null
5. **Pricing**: Format prices according to your currency

### Step 7: Add Error Handling

Ensure your code handles errors gracefully:

1. **Network errors**: Show a friendly message if API is unreachable
2. **Empty results**: Display "No products available" message
3. **Loading states**: Show a loading spinner while fetching
4. **Invalid data**: Handle missing or null product fields

### Step 8: Test Everything

Test your integration:

1. **Load the page** and verify products appear
2. **Check browser console** for any JavaScript errors
3. **Test with no products** (if possible) to see error handling
4. **Test on different devices** (mobile, tablet, desktop)
5. **Test with slow internet** to see loading states

### Step 9: Deploy and Monitor

1. **Deploy your website** with the new product section
2. **Monitor for errors** in browser console
3. **Check API response times** - if slow, consider caching
4. **Verify products update** when you add new products in the admin panel

### Quick Start Checklist

- [ ] Get API server URL
- [ ] Test API endpoint in browser
- [ ] Choose integration method (HTML/React/PHP)
- [ ] Copy example code
- [ ] Replace API URL with your actual URL
- [ ] Add code to your website
- [ ] Configure CORS if needed
- [ ] Customize styling and layout
- [ ] Add error handling
- [ ] Test thoroughly
- [ ] Deploy to production

## Public Products API Endpoint

### Endpoint Details

- **URL**: `GET /api/products/public`
- **Authentication**: Not required (public endpoint)
- **CORS**: Configured to allow cross-origin requests

### Response Format

The API returns a JSON response with the following structure:

```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "product_name": "Product Name",
      "item_code": "ITEM-001",
      "sku_code": "SKU-001",
      "category": "Electronics",
      "mrp": 1000.00,
      "discount": 10.00,
      "sell_rate": 900.00,
      "current_quantity": 50,
      "image_url": "https://example.com/image.jpg",
      "status": "STOCK"
    }
  ]
}
```

### Product Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Unique product identifier |
| `product_name` | String | Name of the product |
| `item_code` | String | Unique item code |
| `sku_code` | String | SKU code (may be null) |
| `category` | String | Product category |
| `mrp` | Decimal | Maximum Retail Price |
| `discount` | Decimal | Discount amount |
| `sell_rate` | Decimal | Final selling price |
| `current_quantity` | Integer | Available stock quantity |
| `image_url` | String | URL to product image (may be null) |
| `status` | String | Product status (always "STOCK" for public endpoint) |

### Filtering

The public endpoint automatically filters products to only return:
- Products with `status = 'STOCK'`
- Products with `current_quantity > 0` (in stock)
- Products with `sell_rate IS NOT NULL` (has a selling price)

Products are ordered by `created_at DESC` (newest first).

## Integration Examples

### JavaScript/React Example

```javascript
// Fetch products from the API
async function fetchProducts() {
  try {
    const response = await fetch('https://your-api-domain.com/api/products/public');
    const data = await response.json();
    
    if (data.success) {
      return data.products;
    } else {
      throw new Error('Failed to fetch products');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// React component example
import React, { useState, useEffect } from 'react';

function ProductSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const productsData = await fetchProducts();
      setProducts(productsData);
      setLoading(false);
    }
    loadProducts();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="products-grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          {product.image_url && (
            <img src={product.image_url} alt={product.product_name} />
          )}
          <h3>{product.product_name}</h3>
          <p className="category">{product.category}</p>
          <div className="pricing">
            <span className="mrp">MRP: ₹{product.mrp}</span>
            {product.discount > 0 && (
              <span className="discount">Save ₹{product.discount}</span>
            )}
            <span className="price">₹{product.sell_rate}</span>
          </div>
          <p className="stock">In Stock: {product.current_quantity} units</p>
        </div>
      ))}
    </div>
  );
}

export default ProductSection;
```

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Products</title>
  <style>
    .products-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .product-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .product-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 4px;
    }
    .price {
      font-size: 1.2em;
      font-weight: bold;
      color: #2c3e50;
    }
    .mrp {
      text-decoration: line-through;
      color: #999;
    }
  </style>
</head>
<body>
  <div id="products-container" class="products-container"></div>

  <script>
    const API_URL = 'https://your-api-domain.com/api/products/public';

    async function fetchProducts() {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.success) {
          displayProducts(data.products);
        }
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('products-container').innerHTML = 
          '<p>Error loading products. Please try again later.</p>';
      }
    }

    function displayProducts(products) {
      const container = document.getElementById('products-container');
      
      if (products.length === 0) {
        container.innerHTML = '<p>No products available at the moment.</p>';
        return;
      }

      container.innerHTML = products.map(product => `
        <div class="product-card">
          ${product.image_url ? 
            `<img src="${product.image_url}" alt="${product.product_name}">` : 
            '<div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">No Image</div>'
          }
          <h3>${product.product_name}</h3>
          <p><strong>Category:</strong> ${product.category || 'Uncategorized'}</p>
          <p><strong>Item Code:</strong> ${product.item_code}</p>
          <div class="pricing">
            ${product.mrp ? `<span class="mrp">MRP: ₹${product.mrp}</span><br>` : ''}
            ${product.discount > 0 ? `<span>Discount: ₹${product.discount}</span><br>` : ''}
            <span class="price">Price: ₹${product.sell_rate}</span>
          </div>
          <p><strong>Stock:</strong> ${product.current_quantity} units</p>
        </div>
      `).join('');
    }

    // Load products when page loads
    fetchProducts();
  </script>
</body>
</html>
```

### PHP Example

```php
<?php
$apiUrl = 'https://your-api-domain.com/api/products/public';

// Fetch products
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    
    if ($data['success'] && !empty($data['products'])) {
        $products = $data['products'];
        
        foreach ($products as $product) {
            echo '<div class="product-card">';
            echo '<h3>' . htmlspecialchars($product['product_name']) . '</h3>';
            echo '<p>Category: ' . htmlspecialchars($product['category']) . '</p>';
            echo '<p>Price: ₹' . number_format($product['sell_rate'], 2) . '</p>';
            echo '<p>Stock: ' . $product['current_quantity'] . ' units</p>';
            echo '</div>';
        }
    } else {
        echo '<p>No products available.</p>';
    }
} else {
    echo '<p>Error loading products.</p>';
}
?>
```

## CORS Configuration

The API server is configured to allow cross-origin requests. To ensure your website can access the API:

1. **Development**: All origins are allowed in development mode
2. **Production**: The server allows:
   - Origins specified in `FRONTEND_URL` environment variable
   - Origins specified in `FRONTEND_URLS` (comma-separated)
   - Vercel domains (*.vercel.app)
   - Localhost (for testing)

If you need to add your website's domain to the allowed origins, update the `FRONTEND_URLS` environment variable on the server:

```bash
FRONTEND_URLS=https://your-website.com,https://www.your-website.com
```

## Error Handling

The API may return errors in the following format:

```json
{
  "error": "Internal server error"
}
```

Always check the `success` field in the response before accessing the `products` array.

## Best Practices

1. **Caching**: Consider implementing client-side caching to reduce API calls
2. **Error Handling**: Always handle network errors and API errors gracefully
3. **Loading States**: Show loading indicators while fetching products
4. **Image Handling**: Handle cases where `image_url` might be null
5. **Rate Limiting**: The API has rate limiting, so avoid making too many requests in a short time
6. **HTTPS**: Always use HTTPS when making API calls in production

## API Base URL

Replace `https://your-api-domain.com` with your actual API server URL. The API endpoint will be:

```
https://your-api-domain.com/api/products/public
```

## Testing the API

You can test the API endpoint using:

1. **Browser**: Simply visit the URL in your browser
2. **cURL**:
   ```bash
   curl https://your-api-domain.com/api/products/public
   ```
3. **Postman**: Create a GET request to the endpoint
4. **JavaScript Console**:
   ```javascript
   fetch('https://your-api-domain.com/api/products/public')
     .then(res => res.json())
     .then(data => console.log(data));
   ```

## Support

For issues or questions about the API integration, please contact the development team.

