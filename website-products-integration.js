/**
 * Anitha Stores Products Integration Script
 * 
 * This script fetches products from the Anitha Stores API and displays them
 * on the website (https://auto-ashy-five.vercel.app/) based on categories.
 * 
 * Usage:
 * 1. Replace API_URL with your actual backend API URL
 * 2. Add this script to your website's HTML before closing </body> tag
 * 3. Ensure category mapping matches your product categories
 */

// ⚠️ IMPORTANT: Replace this with your actual API server URL
const API_URL = 'https://your-api-domain.com/api/products/public';

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

// Initialize products integration
(function() {
  'use strict';

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
        showError('Unable to load products. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('Unable to connect to the server. Please check your internet connection.');
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
   * Create product card HTML
   */
  function createProductCard(product) {
    const imageUrl = product.image_url || 'https://via.placeholder.com/300x300?text=No+Image';
    const discount = product.discount > 0 ? 
      `<span class="product-discount">Save ₹${formatPrice(product.discount)}</span>` : '';
    const mrp = product.mrp ? 
      `<span class="product-mrp">MRP: ₹${formatPrice(product.mrp)}</span>` : '';
    
    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-image-container">
          <img src="${imageUrl}" alt="${escapeHtml(product.product_name)}" 
               class="product-image" 
               onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
        </div>
        <div class="product-info">
          <h3 class="product-name">${escapeHtml(product.product_name)}</h3>
          ${product.category ? `<p class="product-category">${escapeHtml(product.category)}</p>` : ''}
          <div class="product-pricing">
            ${mrp}
            ${discount}
            <span class="product-price">₹${formatPrice(product.sell_rate)}</span>
          </div>
          <div class="product-stock">
            <span class="stock-badge ${product.current_quantity > 0 ? 'in-stock' : 'out-of-stock'}">
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
      
      // Find the category section on the page
      const categorySection = findCategorySection(category);
      if (!categorySection) {
        console.warn(`Category section not found for: ${category}`);
        return;
      }
      
      // Find or create products container
      let productsContainer = categorySection.querySelector('.products-container');
      if (!productsContainer) {
        productsContainer = document.createElement('div');
        productsContainer.className = 'products-container';
        categorySection.appendChild(productsContainer);
      }
      
      // Clear existing content
      productsContainer.innerHTML = '';
      
      // Add products (limit to 6 per category for better display)
      const displayProducts = products.slice(0, 6);
      displayProducts.forEach(product => {
        productsContainer.innerHTML += createProductCard(product);
      });
      
      // Add "View All" button if there are more products
      if (products.length > 6) {
        const viewAllBtn = document.createElement('button');
        viewAllBtn.className = 'view-all-btn';
        viewAllBtn.textContent = `View All ${products.length} Products`;
        viewAllBtn.onclick = () => showAllProducts(category, products);
        productsContainer.appendChild(viewAllBtn);
      }
    });
  }

  /**
   * Find category section on the page
   */
  function findCategorySection(category) {
    // Try different selectors based on common HTML structures
    const selectors = [
      `[data-category="${category}"]`,
      `.category-${category.toLowerCase().replace(/\s+/g, '-')}`,
      `#${category.toLowerCase().replace(/\s+/g, '-')}`,
      `section:has(h2:contains("${category}"))`,
      `section:has(h3:contains("${category}"))`
    ];
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch (e) {
        // Invalid selector, continue
      }
    }
    
    // Try to find by text content
    const headings = document.querySelectorAll('h2, h3, h4');
    for (const heading of headings) {
      if (heading.textContent.includes(category)) {
        // Find parent section or container
        let parent = heading.parentElement;
        while (parent && parent.tagName !== 'SECTION' && parent.tagName !== 'DIV') {
          parent = parent.parentElement;
        }
        return parent;
      }
    }
    
    return null;
  }

  /**
   * Show all products for a category (modal or expanded view)
   */
  function showAllProducts(category, products) {
    // Create modal or expand section
    const modal = document.createElement('div');
    modal.className = 'products-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h2>${category} - All Products</h2>
        <div class="modal-products-grid">
          ${products.map(product => createProductCard(product)).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  /**
   * Show error message
   */
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'products-error';
    errorDiv.style.cssText = 'padding: 20px; background: #fee; color: #c33; border-radius: 8px; margin: 20px; text-align: center;';
    errorDiv.textContent = message;
    
    // Insert at the beginning of body or a specific container
    const container = document.querySelector('main') || document.body;
    container.insertBefore(errorDiv, container.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
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
   * Add CSS styles for products
   */
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .products-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 25px;
        padding: 20px 0;
        margin-top: 20px;
      }

      .product-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
      }

      .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .product-image-container {
        width: 100%;
        height: 220px;
        overflow: hidden;
        border-radius: 8px;
        margin-bottom: 15px;
        background: #f5f5f5;
      }

      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .product-info {
        text-align: center;
      }

      .product-name {
        font-size: 1.1em;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px 0;
        min-height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .product-category {
        color: #666;
        font-size: 0.85em;
        margin: 0 0 12px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .product-pricing {
        margin: 15px 0;
        padding-top: 15px;
        border-top: 1px solid #eee;
      }

      .product-mrp {
        display: block;
        text-decoration: line-through;
        color: #999;
        font-size: 0.9em;
        margin-bottom: 5px;
      }

      .product-discount {
        display: block;
        color: #28a745;
        font-size: 0.85em;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .product-price {
        font-size: 1.5em;
        font-weight: bold;
        color: #2c3e50;
        display: block;
      }

      .product-stock {
        margin-top: 12px;
      }

      .stock-badge {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.85em;
        font-weight: 600;
        display: inline-block;
      }

      .stock-badge.in-stock {
        background-color: #e8f5e9;
        color: #2e7d32;
      }

      .stock-badge.out-of-stock {
        background-color: #ffebee;
        color: #c62828;
      }

      .view-all-btn {
        grid-column: 1 / -1;
        padding: 15px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1em;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        margin-top: 10px;
      }

      .view-all-btn:hover {
        background: #0056b3;
      }

      .products-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .modal-content {
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        width: 100%;
      }

      .modal-close {
        position: absolute;
        top: 15px;
        right: 20px;
        font-size: 2em;
        cursor: pointer;
        color: #999;
        line-height: 1;
      }

      .modal-close:hover {
        color: #333;
      }

      .modal-products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      @media (max-width: 768px) {
        .products-container {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initialize when DOM is ready
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        addStyles();
        fetchProducts();
      });
    } else {
      addStyles();
      fetchProducts();
    }
  }

  // Start initialization
  init();
})();







