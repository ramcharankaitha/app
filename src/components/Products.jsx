import React, { useState } from 'react';

const Products = ({ onBack, onAddProduct, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAdd = () => {
    if (onAddProduct) {
      onAddProduct();
    } else if (onNavigate) {
      onNavigate('addProduct');
    }
  };

  const handleManagers = () => {
    if (onNavigate) {
      onNavigate('users');
    }
  };

  const handleStaff = () => {
    if (onNavigate) {
      onNavigate('staff');
    }
  };

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Filter products based on search and category
  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.itemCode.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'All' || selectedCategory === p.status;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleBack}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        <div className="nav-item" onClick={handleManagers}>
          <div className="nav-icon">
            <i className="fas fa-users"></i>
          </div>
          <span>Managers</span>
        </div>
        <div className="nav-item active" onClick={handleProducts}>
          <div className="nav-icon">
            <i className="fas fa-box"></i>
          </div>
          <span>Products</span>
        </div>
        <div className="nav-item" onClick={handleBack}>
          <div className="nav-icon">
            <i className="fas fa-store"></i>
          </div>
          <span>Stores</span>
        </div>
        <div className="nav-item" onClick={handleStaff}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item" onClick={handleSettings}>
          <div className="nav-icon">
            <i className="fas fa-cog"></i>
          </div>
          <span>Settings</span>
        </div>
      </nav>

      {/* Main */}
      <div className="dashboard-main">
        <div className="products-container">
          {/* Header */}
          <header className="products-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Product Details</h1>
              <p className="page-subtitle">Manage inventory</p>
            </div>
          </header>

          {/* Content */}
          <main className="products-content">
            <div className="products-top-section">
              <div className="tab-indicator">
                <span className="tab-dot"></span>
                <span className="tab-label">STORES</span>
              </div>
              <button className="add-product-btn" onClick={handleAdd}>
                <i className="fas fa-plus"></i>
                <span>+ Add New Product</span>
              </button>
            </div>

            <div className="products-heading">
              <h2>Manage Store Products</h2>
              <p>View products, their codes, and quantities. Filter quickly.</p>
            </div>

            <div className="products-controls">
              <div className="products-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search name, code, cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="category-filter-btn" onClick={() => setSelectedCategory('All')}>
                <i className="fas fa-th-large"></i>
                <span>Category</span>
                <i className="fas fa-chevron-down"></i>
              </button>
            </div>

            <div className="products-count">
              {`Showing ${filtered.length} of ${products.length} products`}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <div className="products-list">
              {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
                  <i className="fas fa-box" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Products Available</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first product to the inventory.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                  <p>No products found matching your search</p>
                </div>
              ) : (
                filtered.map((p) => (
                <div key={p.id} className="product-card">
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    <div className="product-meta">Item Code:</div>
                    <div className="product-meta-row">
                      <div className="product-sku">
                        <span className="label">SKU code:</span>
                        <span className="value">{p.sku}</span>
                      </div>
                      <div className="product-qty">
                        <span className="label">Quantity:</span>
                        <span className="value">{p.qty}</span>
                      </div>
                      <div className={`product-status ${p.status === 'STOCK' ? 'status-stock' : 'status-instock'}`}>
                        {p.status}
                      </div>
                    </div>
                  </div>
                  <button className="product-options">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;

