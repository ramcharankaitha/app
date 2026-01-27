# Step-by-Step Guide: Adding Products to Your Website

## Your Website Structure
```
app-uiux/
├── index.html          # Your main HTML file
└── vercel.json         # Vercel deployment configuration
```

## Step-by-Step Instructions

### Step 1: Get Your API URL

1. **Find your backend API server URL**
   - This is where your Anitha Stores backend is hosted
   - Examples:
     - `https://your-app.railway.app`
     - `https://api.anithastores.com`
     - `https://your-app.herokuapp.com`

2. **Test the API endpoint**
   - Open in browser: `YOUR_API_URL/api/products/public`
   - You should see JSON data with products
   - **Note down this URL** - you'll need it in Step 3

### Step 2: Open Your index.html File

1. Open `app-uiux/index.html` in your code editor
2. Find the closing `</body>` tag (usually at the very end of the file)

### Step 3: Add the Products Integration Script

**Before the closing `</body>` tag**, add this code:

```html
<!-- Anitha Stores Products Integration -->
<script>
(function() {
  'use strict';

  // ⚠️ STEP 3: Replace this with your actual API server URL
  const API_URL = 'https://YOUR_API_URL_HERE/api/products/public';

  // Category mapping: Website categories -> Product categories in database
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
    const imageUrl = product.image_url || 'https://via.placeholder.com/300x300?text=No+Image';
    const discount = product.discount > 0 ? 
      `<span style="display:block;color:#28a745;font-size:0.85em;margin-bottom:8px;font-weight:600;">Save ₹${formatPrice(product.discount)}</span>` : '';
    const mrp = product.mrp ? 
      `<span style="display:block;text-decoration:line-through;color:#999;font-size:0.9em;margin-bottom:5px;">MRP: ₹${formatPrice(product.mrp)}</span>` : '';
    
    return `
      <div style="background:white;border:1px solid #e0e0e0;border-radius:12px;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.2s;cursor:pointer;" 
           onmouseover="this.style.transform='translateY(-5px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
           onmouseout="this.style.transform='';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
        <div style="width:100%;height:220px;overflow:hidden;border-radius:8px;margin-bottom:15px;background:#f5f5f5;">
          <img src="${imageUrl}" alt="${escapeHtml(product.product_name)}" 
               style="width:100%;height:100%;object-fit:cover;"
               onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
        </div>
        <div style="text-align:center;">
          <h3 style="font-size:1.1em;font-weight:600;color:#333;margin:0 0 8px 0;min-height:50px;display:flex;align-items:center;justify-content:center;">
            ${escapeHtml(product.product_name)}
          </h3>
          ${product.category ? `<p style="color:#666;font-size:0.85em;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(product.category)}</p>` : ''}
          <div style="margin:15px 0;padding-top:15px;border-top:1px solid #eee;">
            ${mrp}
            ${discount}
            <span style="font-size:1.5em;font-weight:bold;color:#2c3e50;display:block;">₹${formatPrice(product.sell_rate)}</span>
          </div>
          <div style="margin-top:12px;">
            <span style="padding:6px 12px;border-radius:6px;font-size:0.85em;font-weight:600;display:inline-block;background-color:${product.current_quantity > 0 ? '#e8f5e9' : '#ffebee'};color:${product.current_quantity > 0 ? '#2e7d32' : '#c62828'};">
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
      
      const categorySection = findCategorySection(category);
      if (!categorySection) {
        console.warn(`Category section not found: ${category}`);
        return;
      }
      
      let productsContainer = categorySection.querySelector('.products-container');
      if (!productsContainer) {
        productsContainer = document.createElement('div');
        productsContainer.className = 'products-container';
        productsContainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:25px;padding:20px 0;margin-top:20px;';
        categorySection.appendChild(productsContainer);
      }
      
      productsContainer.innerHTML = '';
      const displayProducts = products.slice(0, 6);
      displayProducts.forEach(product => {
        productsContainer.innerHTML += createProductCard(product);
      });
      
      if (products.length > 6) {
        const viewAllBtn = document.createElement('button');
        viewAllBtn.textContent = `View All ${products.length} Products`;
        viewAllBtn.style.cssText = 'grid-column:1/-1;padding:15px;background:#007bff;color:white;border:none;border-radius:8px;font-size:1em;font-weight:600;cursor:pointer;margin-top:10px;transition:background 0.2s;';
        viewAllBtn.onmouseover = () => viewAllBtn.style.background = '#0056b3';
        viewAllBtn.onmouseout = () => viewAllBtn.style.background = '#007bff';
        viewAllBtn.onclick = () => {
          alert(`Showing all ${products.length} products for ${category}`);
          // You can implement a modal or redirect here
        };
        productsContainer.appendChild(viewAllBtn);
      }
    });
  }

  function findCategorySection(category) {
    // Try to find by data attribute first
    const dataAttr = document.querySelector(`[data-category="${category}"]`);
    if (dataAttr) return dataAttr;
    
    // Try to find by class
    const classSelector = `.category-${category.toLowerCase().replace(/\s+/g, '-')}`;
    const classElement = document.querySelector(classSelector);
    if (classElement) return classElement;
    
    // Try to find by heading text
    const headings = document.querySelectorAll('h2, h3, h4');
    for (const heading of headings) {
      if (heading.textContent.includes(category)) {
        let parent = heading.parentElement;
        while (parent && !['SECTION', 'DIV', 'ARTICLE'].includes(parent.tagName)) {
          parent = parent.parentElement;
        }
        if (parent) return parent;
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchProducts);
  } else {
    fetchProducts();
  }
})();
</script>
```

### Step 4: Add Data Attributes to Category Sections (Recommended)

In your `index.html`, find each category section and add `data-category` attribute:

**Example - Before:**
```html
<section>
  <h2>Pressure Cookers</h2>
  <p>Premium quality pressure cookers...</p>
</section>
```

**Example - After:**
```html
<section data-category="Pressure Cookers">
  <h2>Pressure Cookers</h2>
  <p>Premium quality pressure cookers...</p>
  <!-- Products will automatically appear here -->
</section>
```

**Do this for all 7 categories:**
- `data-category="Pressure Cookers"`
- `data-category="Electric Appliances"`
- `data-category="Cookware & Utensils"`
- `data-category="Storage Containers"`
- `data-category="Home Essentials"`
- `data-category="Gift Items"`
- `data-category="Kitchen Tools"`

### Step 5: Configure CORS on Backend

1. **Go to your backend server** (where your API is hosted)
2. **Set environment variable:**
   ```bash
   FRONTEND_URLS=https://auto-ashy-five.vercel.app,https://www.auto-ashy-five.vercel.app
   ```
3. **Restart your server**

### Step 6: Test Locally (Optional)

1. Open `index.html` in your browser
2. Open browser console (F12)
3. Check for any errors
4. Products should appear in category sections

### Step 7: Deploy to Vercel

1. **Commit your changes:**
   ```bash
   git add app-uiux/index.html
   git commit -m "Add products integration"
   git push
   ```

2. **Vercel will automatically deploy**

3. **Visit your website** and verify products are showing

## What Happens Next

✅ Products will automatically:
- Load from your API
- Match to correct categories
- Display in category sections
- Show product images, names, prices
- Display stock status
- Show up to 6 products per category
- Add "View All" button if more products exist

## Troubleshooting

### Products Not Showing?

1. **Check API URL** - Make sure it's correct in the script
2. **Check Browser Console** (F12) - Look for errors
3. **Test API** - Visit `YOUR_API_URL/api/products/public` directly
4. **Check CORS** - Ensure your website domain is in FRONTEND_URLS

### Wrong Categories?

1. **Check Product Categories** - Verify categories in your database
2. **Update Mapping** - Modify `CATEGORY_MAPPING` in the script
3. **Check Section Names** - Ensure section headings match category names

### Styling Issues?

1. **Check CSS Conflicts** - Your website CSS might override product styles
2. **Adjust Styles** - Modify inline styles in `createProductCard()` function

## Summary Checklist

- [ ] Step 1: Got API URL
- [ ] Step 2: Opened index.html
- [ ] Step 3: Added integration script (with correct API URL)
- [ ] Step 4: Added data-category attributes to sections
- [ ] Step 5: Configured CORS on backend
- [ ] Step 6: Tested locally (optional)
- [ ] Step 7: Deployed to Vercel
- [ ] Products are showing on website ✅

---

**Important Notes:**
- You DON'T need to create a separate `products.html` file
- Products will be added automatically to your existing category sections
- Make sure to replace `YOUR_API_URL_HERE` with your actual API URL
- The script runs automatically when the page loads






