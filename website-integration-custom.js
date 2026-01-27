/**
 * Anitha Stores Products Integration - Customized for Your Website
 * 
 * This script integrates products from your Anitha Stores application
 * into your website and displays them in the category sections.
 * 
 * INSTRUCTIONS:
 * 1. Replace YOUR_API_URL below with your actual backend API URL
 * 2. Add this script before the closing </body> tag in your index.html
 */

<script>
(function() {
  'use strict';

  // ⚠️ STEP 1: Replace this with your actual API server URL
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

  /**
   * Fetch products from API
   */
  async function fetchProducts() {
    if (isLoading) return;
    isLoading = true;
    
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.products) {
        allProducts = data.products;
        displayProductsByCategory();
      } else {
        console.error('Failed to fetch products:', data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Don't show error to users, just log it
    } finally {
      isLoading = false;
    }
  }

  /**
   * Match product category to website category
   */
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

  /**
   * Group products by website categories
   */
  function groupProductsByCategory() {
    const grouped = {};
    
    // Initialize all categories
    Object.keys(CATEGORY_MAPPING).forEach(category => {
      grouped[category] = [];
    });
    
    // Group products
    allProducts.forEach(product => {
      const matchedCategory = matchCategory(product.category);
      if (matchedCategory) {
        grouped[matchedCategory].push(product);
      }
    });
    
    return grouped;
  }

  /**
   * Create product card HTML matching your website's style
   */
  function createProductCard(product) {
    const imageUrl = product.image_url || '';
    const discount = product.discount > 0 ? 
      `<span style="display:block;color:#28a745;font-size:0.9em;margin-bottom:8px;font-weight:600;">Save ₹${formatPrice(product.discount)}</span>` : '';
    const mrp = product.mrp ? 
      `<span style="display:block;text-decoration:line-through;color:#999;font-size:0.85em;margin-bottom:5px;">MRP: ₹${formatPrice(product.mrp)}</span>` : '';
    
    // Use product image if available, otherwise use placeholder
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

  /**
   * Display products in their respective category sections
   */
  function displayProductsByCategory() {
    const grouped = groupProductsByCategory();
    
    Object.keys(grouped).forEach(category => {
      const products = grouped[category];
      if (products.length === 0) return;
      
      // Find the category card on the page
      const categoryCard = findCategoryCard(category);
      if (!categoryCard) {
        console.warn(`Category card not found for: ${category}`);
        return;
      }
      
      // Find the product-content div inside the card
      const productContent = categoryCard.querySelector('.product-content');
      if (!productContent) return;
      
      // Create products container after the description
      let productsContainer = categoryCard.querySelector('.products-list-container');
      if (!productsContainer) {
        productsContainer = document.createElement('div');
        productsContainer.className = 'products-list-container';
        productsContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 2rem; margin-top: 2rem; padding-top: 2rem; border-top: 2px solid rgba(211, 47, 47, 0.1);';
        productContent.appendChild(productsContainer);
      }
      
      // Clear and add products (limit to 6 per category)
      productsContainer.innerHTML = '';
      const displayProducts = products.slice(0, 6);
      displayProducts.forEach(product => {
        productsContainer.innerHTML += createProductCard(product);
      });
      
      // Add "View All" button if there are more products
      if (products.length > 6) {
        const viewAllBtn = document.createElement('button');
        viewAllBtn.textContent = `View All ${products.length} Products`;
        viewAllBtn.className = 'btn-primary';
        viewAllBtn.style.cssText = 'margin-top: 1.5rem; width: 100%; grid-column: 1 / -1;';
        viewAllBtn.onclick = () => {
          // You can implement a modal or expand functionality here
          alert(`Showing all ${products.length} products for ${category}`);
        };
        productsContainer.appendChild(viewAllBtn);
      }
    });
  }

  /**
   * Find category card on the page
   */
  function findCategoryCard(category) {
    // Map category names to data-product attributes
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
      // Find card by data-product attribute
      const card = document.querySelector(`.product-card .product-image[data-product="${dataProduct}"]`);
      if (card) {
        return card.closest('.product-card');
      }
    }
    
    // Fallback: Find by heading text
    const headings = document.querySelectorAll('.product-title');
    for (const heading of headings) {
      if (heading.textContent.includes(category)) {
        return heading.closest('.product-card');
      }
    }
    
    return null;
  }

  /**
   * Utility functions
   */
  function formatPrice(price) {
    if (!price) return '0.00';
    return parseFloat(price).toFixed(2);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Initialize when DOM is ready
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for AOS to initialize
        setTimeout(fetchProducts, 500);
      });
    } else {
      setTimeout(fetchProducts, 500);
    }
  }

  // Start initialization
  init();
})();
</script>






