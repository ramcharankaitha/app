# Website Products Integration Guide

## Overview

This guide explains how to integrate products from the Anitha Stores application into your website (https://auto-ashy-five.vercel.app/) and display them based on categories.

## Quick Setup

### Step 1: Get Your API URL

Find your backend API server URL. Examples:
- `https://api.anithastores.com`
- `https://your-app.railway.app`
- `https://your-app.herokuapp.com`

### Step 2: Add the Integration Script

1. **Download** `website-products-integration.js` file
2. **Edit** the file and replace `API_URL` with your actual API URL:
   ```javascript
   const API_URL = 'https://your-api-domain.com/api/products/public';
   ```
3. **Upload** the file to your website (or add it inline in your HTML)

### Step 3: Include in Your HTML

Add this script tag before the closing `</body>` tag in your website's HTML:

```html
<!-- Anitha Stores Products Integration -->
<script src="website-products-integration.js"></script>
```

Or if you prefer inline:

```html
<script>
  // Paste the entire website-products-integration.js content here
</script>
```

### Step 4: Add Category Data Attributes (Optional but Recommended)

For better integration, add `data-category` attributes to your category sections:

```html
<section data-category="Pressure Cookers">
  <h2>Pressure Cookers</h2>
  <!-- Products will be inserted here -->
</section>

<section data-category="Electric Appliances">
  <h2>Electric Appliances</h2>
  <!-- Products will be inserted here -->
</section>
```

## How It Works

### Category Mapping

The script automatically maps your product categories to website categories:

| Website Category | Product Categories Matched |
|-----------------|---------------------------|
| Pressure Cookers | Pressure Cooker, Cooker, Pressure |
| Electric Appliances | Electric, Mixer, Grinder, Rice Cooker, Induction, Appliance |
| Cookware & Utensils | Cookware, Utensil, Non-stick, Kadai, Tawa, Pan, Cookware Set |
| Storage Containers | Container, Storage, Lunch Box, Water Bottle, Airtight |
| Home Essentials | Home, Essential, Household, Cleaning, Organizer |
| Gift Items | Gift, Gift Set, Decorative |
| Kitchen Tools | Tool, Knife, Peeler, Chopper, Kitchen Accessory, Accessory |

### Customizing Category Mapping

Edit the `CATEGORY_MAPPING` object in the script:

```javascript
const CATEGORY_MAPPING = {
  'Your Website Category': ['Keyword1', 'Keyword2', 'Keyword3'],
  // Add more mappings
};
```

## Product Display

### Default Behavior

- Products are automatically inserted into matching category sections
- Shows up to 6 products per category
- "View All" button appears if there are more than 6 products
- Products display with:
  - Product image (or placeholder)
  - Product name
  - Category
  - MRP (if available)
  - Discount (if available)
  - Selling price
  - Stock status

### Styling

The script includes built-in CSS styles that will:
- Create responsive product grids
- Add hover effects
- Style product cards
- Show stock badges
- Display pricing information

You can customize the styles by modifying the CSS in the `addStyles()` function.

## API Endpoint

The script uses: `GET /api/products/public`

**Response Format:**
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "product_name": "Product Name",
      "item_code": "ITEM-001",
      "sku_code": "SKU-001",
      "category": "Pressure Cooker",
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

## Troubleshooting

### Products Not Showing

1. **Check API URL**: Ensure `API_URL` is correct
2. **Check Console**: Open browser console (F12) for errors
3. **Check CORS**: Ensure your website domain is allowed in backend CORS settings
4. **Check Network**: Verify API is accessible from browser

### Wrong Categories

1. **Check Product Categories**: Verify product categories in database match keywords
2. **Update Mapping**: Adjust `CATEGORY_MAPPING` to match your product categories
3. **Check Category Names**: Ensure website section headings match mapping keys

### Styling Issues

1. **CSS Conflicts**: Check if your website CSS conflicts with product styles
2. **Customize Styles**: Modify the CSS in `addStyles()` function
3. **Responsive Issues**: Adjust grid breakpoints in CSS

## Advanced Customization

### Custom Product Card Template

Modify the `createProductCard()` function to change how products are displayed:

```javascript
function createProductCard(product) {
  return `
    <div class="your-custom-class">
      <!-- Your custom HTML structure -->
    </div>
  `;
}
```

### Filter Products

Add custom filtering in `displayProductsByCategory()`:

```javascript
function displayProductsByCategory() {
  const grouped = groupProductsByCategory();
  
  // Filter products (e.g., only show products with images)
  Object.keys(grouped).forEach(category => {
    grouped[category] = grouped[category].filter(p => p.image_url);
  });
  
  // ... rest of the function
}
```

### Limit Products Per Category

Change the limit in `displayProductsByCategory()`:

```javascript
const displayProducts = products.slice(0, 12); // Show 12 instead of 6
```

## CORS Configuration

If you get CORS errors, add your website domain to the backend:

1. **Set Environment Variable** on your server:
   ```bash
   FRONTEND_URLS=https://auto-ashy-five.vercel.app,https://www.auto-ashy-five.vercel.app
   ```

2. **Restart Server** after updating

## Testing

1. **Test API**: Visit `YOUR_API_URL/api/products/public` in browser
2. **Test Integration**: Add script to a test page first
3. **Check Console**: Look for JavaScript errors
4. **Verify Products**: Ensure products appear in correct categories

## Support

For issues or questions:
- Check browser console for errors
- Verify API endpoint is accessible
- Ensure product categories match mapping keywords
- Test API response format

---

**Note**: Make sure your backend server is running and accessible from the internet for the integration to work.







