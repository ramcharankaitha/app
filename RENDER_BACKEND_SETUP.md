# Render Backend + Railway Database Setup Guide

## Your Setup
- **Database**: Railway
- **Backend API**: Render
- **Website**: Vercel (auto-ashy-five.vercel.app)

## Step 1: Find Your Render Backend URL

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click on your backend service** (the one running your Node.js/Express server)
3. **Copy the URL** - it will look like:
   - `https://your-app-name.onrender.com`
   - Or your custom domain if configured

4. **Test the API endpoint**:
   - Visit: `https://your-app-name.onrender.com/api/products/public`
   - You should see JSON with products
   - **This is your API_URL**

## Step 2: Configure CORS on Render

Since your backend is on Render, you need to add your website domain to CORS:

### Option A: Using Render Environment Variables

1. **Go to Render Dashboard** → Your Service → **Environment**
2. **Add Environment Variable**:
   - **Key**: `FRONTEND_URLS`
   - **Value**: `https://auto-ashy-five.vercel.app,https://www.auto-ashy-five.vercel.app`
3. **Save Changes** - Render will automatically restart your service

### Option B: Check Your Backend Code

Make sure your `server/server.js` has CORS configured. It should already have this, but verify:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : []),
    ].filter(Boolean);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Allow Vercel domains
    const isVercelDomain = origin && (origin.includes('.vercel.app') || origin.includes('vercel.app'));
    
    if (isVercelDomain || allowedOrigins.some(allowed => {
      const normalizedOrigin = origin ? origin.replace(/\/$/, '').toLowerCase() : '';
      const normalizedAllowed = allowed.replace(/\/$/, '').toLowerCase();
      return normalizedOrigin === normalizedAllowed;
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

## Step 3: Add Products Integration Script

In your `app-uiux/index.html`, add this script **before the closing `</body>` tag**:

```html
<!-- Anitha Stores Products Integration -->
<script>
(function() {
  'use strict';

  // ⚠️ STEP 1: Replace with your Render backend URL
  // Example: https://your-app-name.onrender.com
  const API_URL = 'https://YOUR_RENDER_APP_NAME.onrender.com/api/products/public';

  // Category mapping
  const CATEGORY_MAPPING = {
    'Pressure Cookers': ['Pressure Cooker', 'Cooker', 'Pressure'],
    'Electric Appliances': ['Electric', 'Mixer', 'Grinder', 'Rice Cooker', 'Induction', 'Appliance'],
    'Cookware & Utensils': ['Cookware', 'Utensil', 'Non-stick', 'Kadai', 'Tawa', 'Pan', 'Cookware Set'],
    'Storage Containers': ['Container', 'Storage', 'Lunch Box', 'Water Bottle', 'Airtight'],
    'Home Essentials': ['Home', 'Essential', 'Household', 'Cleaning', 'Organizer'],
    'Gift Items': ['Gift', 'Gift Set', 'Decorative'],
    'Kitchen Tools': ['Tool', 'Knife', 'Peeler', 'Chopper', 'Kitchen Accessory', 'Accessory']
  };

  let allProducts = [];
  let isLoading = false;

  async function fetchProducts() {
    if (isLoading) return;
    isLoading = true;
    
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.products) {
        allProducts = data.products;
        displayProductsByCategory();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      isLoading = false;
    }
  }

  function matchCategory(productCategory) {
    if (!productCategory) return null;
    const categoryLower = productCategory.toLowerCase();
    
    for (const [websiteCategory, keywords] of Object.entries(CATEGORY_MAPPING)) {
      for (const keyword of keywords) {
        if (categoryLower.includes(keyword.toLowerCase())) {
          return websiteCategory;
        }
      }
    }
    return null;
  }

  function groupProductsByCategory() {
    const grouped = {};
    Object.keys(CATEGORY_MAPPING).forEach(category => {
      grouped[category] = [];
    });
    
    allProducts.forEach(product => {
      const matchedCategory = matchCategory(product.category);
      if (matchedCategory) {
        grouped[matchedCategory].push(product);
      }
    });
    
    return grouped;
  }

  function createProductCard(product) {
    const imageUrl = product.image_url || '';
    const discount = product.discount > 0 ? 
      `<span style="display:block;color:#28a745;font-size:0.9em;margin-bottom:8px;font-weight:600;">Save ₹${formatPrice(product.discount)}</span>` : '';
    const mrp = product.mrp ? 
      `<span style="display:block;text-decoration:line-through;color:#999;font-size:0.85em;margin-bottom:5px;">MRP: ₹${formatPrice(product.mrp)}</span>` : '';
    
    const imageHtml = imageUrl ? 
      `<img src="${imageUrl}" alt="${escapeHtml(product.product_name)}" 
            style="width:100%;height:100%;object-fit:cover;"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />` : '';
    
    return `
      <div class="product-card" data-aos="fade-up" style="background: var(--bg-primary); border-radius: 24px; overflow: hidden; box-shadow: var(--shadow-md); transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; border: 1px solid rgba(0, 0, 0, 0.05);">
        <div class="product-image" style="width: 100%; height: 280px; position: relative; overflow: hidden; background: ${imageUrl ? 'url(' + imageUrl + ')' : 'rgba(211, 47, 47, 0.05)'}; background-size: cover; background-position: center;">
          ${imageHtml}
          <div style="display: ${imageUrl ? 'none' : 'flex'}; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem; opacity: 0.4;">
            🏪
          </div>
        </div>
        <div class="product-content" style="padding: 2.5rem; position: relative; z-index: 1; text-align: left;">
          <h3 class="product-title" style="font-size: 1.6rem; font-weight: 700; color: var(--heading-color); margin-bottom: 1rem;">
            ${escapeHtml(product.product_name)}
          </h3>
          ${product.category ? `<p style="color: var(--muted-text); font-size: 0.9em; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(product.category)}</p>` : ''}
          <div style="margin: 1.5rem 0; padding-top: 1.5rem; border-top: 1px solid #eee;">
            ${mrp}
            ${discount}
            <span style="font-size: 1.8em; font-weight: bold; color: var(--primary-color); display: block; margin-top: 8px;">₹${formatPrice(product.sell_rate)}</span>
          </div>
          <div style="margin-top: 1rem;">
            <span style="padding: 6px 12px; border-radius: 6px; font-size: 0.85em; font-weight: 600; display: inline-block; background-color: ${product.current_quantity > 0 ? '#e8f5e9' : '#ffebee'}; color: ${product.current_quantity > 0 ? '#2e7d32' : '#c62828'};">
              ${product.current_quantity > 0 ? `${product.current_quantity} in stock` : 'Out of stock'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  function displayProductsByCategory() {
    const grouped = groupProductsByCategory();
    
    Object.keys(grouped).forEach(category => {
      const products = grouped[category];
      if (products.length === 0) return;
      
      const categoryCard = findCategoryCard(category);
      if (!categoryCard) {
        console.warn(`Category card not found for: ${category}`);
        return;
      }
      
      const productContent = categoryCard.querySelector('.product-content');
      if (!productContent) return;
      
      let productsContainer = categoryCard.querySelector('.products-list-container');
      if (!productsContainer) {
        productsContainer = document.createElement('div');
        productsContainer.className = 'products-list-container';
        productsContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 2rem; margin-top: 2rem; padding-top: 2rem; border-top: 2px solid rgba(211, 47, 47, 0.1);';
        productContent.appendChild(productsContainer);
      }
      
      productsContainer.innerHTML = '';
      const displayProducts = products.slice(0, 6);
      displayProducts.forEach(product => {
        productsContainer.innerHTML += createProductCard(product);
      });
      
      if (products.length > 6) {
        const viewAllBtn = document.createElement('button');
        viewAllBtn.textContent = `View All ${products.length} Products`;
        viewAllBtn.className = 'btn-primary';
        viewAllBtn.style.cssText = 'margin-top: 1.5rem; width: 100%; grid-column: 1 / -1;';
        viewAllBtn.onclick = () => alert(`Showing all ${products.length} products for ${category}`);
        productsContainer.appendChild(viewAllBtn);
      }
    });
  }

  function findCategoryCard(category) {
    const categoryMap = {
      'Pressure Cookers': 'cooker',
      'Electric Appliances': 'electric',
      'Cookware & Utensils': 'cookware',
      'Storage Containers': 'storage',
      'Home Essentials': 'home',
      'Gift Items': 'gifts',
      'Kitchen Tools': 'tools'
    };
    
    const dataProduct = categoryMap[category];
    if (dataProduct) {
      const card = document.querySelector(`.product-card .product-image[data-product="${dataProduct}"]`);
      if (card) return card.closest('.product-card');
    }
    
    const headings = document.querySelectorAll('.product-title');
    for (const heading of headings) {
      if (heading.textContent.includes(category)) {
        return heading.closest('.product-card');
      }
    }
    
    return null;
  }

  function formatPrice(price) {
    return parseFloat(price || 0).toFixed(2);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(fetchProducts, 500);
      });
    } else {
      setTimeout(fetchProducts, 500);
    }
  }

  init();
})();
</script>
```

## Step 4: Verify Render Backend Configuration

### Check Database Connection

Make sure your Render backend can connect to Railway database:

1. **In Render Dashboard** → Your Service → **Environment**
2. **Verify these variables exist**:
   - `DATABASE_URL` (Railway PostgreSQL connection string)
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (if using separate variables)

### Test Backend is Running

1. Visit: `https://your-app-name.onrender.com/api/health`
2. Should return: `{"status":"OK","message":"Server is running"}`

### Test Products API

1. Visit: `https://your-app-name.onrender.com/api/products/public`
2. Should return JSON with products array

## Step 5: Common Issues & Solutions

### Issue: CORS Error

**Solution:**
1. Add `FRONTEND_URLS` environment variable in Render
2. Value: `https://auto-ashy-five.vercel.app`
3. Restart service

### Issue: API Not Responding

**Solution:**
1. Check Render service is running (not sleeping)
2. Render free tier services sleep after 15 minutes of inactivity
3. First request may take 30-60 seconds to wake up
4. Consider upgrading to paid plan for always-on service

### Issue: Database Connection Error

**Solution:**
1. Verify `DATABASE_URL` in Render environment variables
2. Check Railway database is running
3. Verify network connectivity between Render and Railway

## Step 6: Deploy

1. **Add script to index.html** (as shown in Step 3)
2. **Replace `YOUR_RENDER_APP_NAME`** with your actual Render app name
3. **Commit and push:**
   ```bash
   git add app-uiux/index.html
   git commit -m "Add products integration with Render backend"
   git push
   ```
4. **Vercel will auto-deploy**

## Quick Checklist

- [ ] Found Render backend URL
- [ ] Tested API endpoint: `https://your-app.onrender.com/api/products/public`
- [ ] Added `FRONTEND_URLS` environment variable in Render
- [ ] Added integration script to index.html
- [ ] Replaced API_URL with Render backend URL
- [ ] Committed and pushed changes
- [ ] Products showing on website ✅

## Example Render URL Format

Your API URL will be:
```
https://your-app-name.onrender.com/api/products/public
```

Replace `your-app-name` with your actual Render service name.

---

**Note**: Render free tier services may take 30-60 seconds to wake up on first request after sleeping. This is normal behavior.







