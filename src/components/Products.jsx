import React, { useState, useEffect, useRef } from 'react';
import { productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const Products = ({ onBack, onAddProduct, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const menuRef = useRef(null);
  const categoryMenuRef = useRef(null);

  // Fetch products from database
  const fetchProducts = async () => {
    try {
      setError('');
      const response = await productsAPI.getAll();
      if (response.success) {
        const formattedProducts = response.products.map(product => ({
          id: product.id,
          name: product.product_name,
          itemCode: product.item_code,
          sku: product.sku_code,
          qty: product.current_quantity || 0,
          status: product.status || 'STOCK',
          category: product.category || 'Uncategorized',
          mrp: product.mrp,
          discount: product.discount,
          sellRate: product.sell_rate
        }));
        setProducts(formattedProducts);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Get unique categories from products, plus default categories
  const defaultCategories = ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'];
  const productCategories = products.map(p => p.category).filter(Boolean);
  const allCategories = [...new Set([...defaultCategories, ...productCategories])];
  const categories = ['All', ...allCategories];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptionsMenu(null);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionsClick = (e, productId) => {
    e.stopPropagation();
    setShowOptionsMenu(showOptionsMenu === productId ? null : productId);
  };

  const handleViewProduct = async (product) => {
    try {
      const response = await productsAPI.getById(product.id);
      if (response.success) {
        setSelectedProduct(response.product);
        setShowViewModal(true);
        setShowOptionsMenu(null);
      }
    } catch (err) {
      setError('Failed to load product details');
    }
  };

  const handleEditProduct = async (product) => {
    try {
      const response = await productsAPI.getById(product.id);
      if (response.success) {
        setEditFormData({
          id: response.product.id,
          productName: response.product.product_name,
          itemCode: response.product.item_code,
          skuCode: response.product.sku_code,
          modelNumber: response.product.model_number || '',
          minQuantity: response.product.minimum_quantity,
          currentQuantity: response.product.current_quantity,
          supplierName: response.product.supplier_name || '',
          category: response.product.category || '',
          mrp: response.product.mrp || '',
          discount: response.product.discount || '',
          sellRate: response.product.sell_rate || '',
          salesRate: response.product.sales_rate || '',
          nlc: response.product.nlc || '',
          disc: response.product.disc || '',
          points: response.product.points || '',
          status: response.product.status
        });
        setShowEditModal(true);
        setShowOptionsMenu(null);
      }
    } catch (err) {
      setError('Failed to load product for editing');
    }
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
    setShowOptionsMenu(null);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      const response = await productsAPI.delete(selectedProduct.id);
      if (response.success) {
        setSuccessMessage('Product deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchProducts();
        setShowDeleteConfirm(false);
        setSelectedProduct(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product');
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const response = await productsAPI.update(editFormData.id, {
        productName: editFormData.productName,
        itemCode: editFormData.itemCode,
        skuCode: editFormData.skuCode,
        modelNumber: editFormData.modelNumber,
        minimumQuantity: parseInt(editFormData.minQuantity) || 0,
        currentQuantity: parseInt(editFormData.currentQuantity) || 0,
        supplierName: editFormData.supplierName,
        category: editFormData.category,
        mrp: editFormData.mrp ? parseFloat(editFormData.mrp) : null,
        discount: editFormData.discount ? parseFloat(editFormData.discount) : 0,
        sellRate: editFormData.sellRate ? parseFloat(editFormData.sellRate) : null,
        salesRate: editFormData.salesRate ? parseFloat(editFormData.salesRate) : null,
        nlc: editFormData.nlc ? parseFloat(editFormData.nlc) : null,
        disc: editFormData.disc ? parseFloat(editFormData.disc) : 0,
        points: editFormData.points ? parseInt(editFormData.points) : 0,
        status: editFormData.status
      });

      if (response.success) {
        setSuccessMessage('Product updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchProducts();
        setShowEditModal(false);
        setEditFormData({});
      }
    } catch (err) {
      setError(err.message || 'Failed to update product');
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const handleCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
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
    const matchesCategory = selectedCategory === 'All' || selectedCategory === p.category;
    return matchesSearch && matchesCategory;
  });

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  const handleUpdateCategory = async (productId, newCategory) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const response = await productsAPI.update(productId, {
        productName: product.name,
        itemCode: product.itemCode,
        skuCode: product.sku,
        minimumQuantity: 0,
        currentQuantity: product.qty,
        status: product.status,
        category: newCategory,
        mrp: product.mrp,
        discount: product.discount,
        sellRate: product.sellRate
      });

      if (response.success) {
        setSuccessMessage('Product category updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchProducts();
      }
    } catch (err) {
      setError(err.message || 'Failed to update category');
    }
  };

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
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={handleStaff}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item" onClick={handleCustomers}>
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
        </div>
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
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
              <div style={{ position: 'relative' }} ref={categoryMenuRef}>
                <button 
                  className="category-filter-btn" 
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <i className="fas fa-th-large"></i>
                  <span>{selectedCategory === 'All' ? 'Category' : selectedCategory}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                {showCategoryDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '180px',
                    padding: '8px 0',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          border: 'none',
                          background: selectedCategory === cat ? '#f8f9fa' : 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: selectedCategory === cat ? '#dc3545' : '#333',
                          fontWeight: selectedCategory === cat ? '600' : 'normal'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedCategory !== cat) e.target.style.background = '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCategory !== cat) e.target.style.background = 'transparent';
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

            {/* Success Message */}
            {successMessage && (
              <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px' }}>
                <i className="fas fa-check-circle"></i> {successMessage}
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
                <div key={p.id} className="product-card" style={{ position: 'relative' }}>
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    <div className="product-meta">Item Code: {p.itemCode}</div>
                    <div className="product-meta-row">
                      <div className="product-sku">
                        <span className="label">SKU code:</span>
                        <span className="value">{p.sku}</span>
                      </div>
                      <div className="product-qty" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: p.qty <= 0 ? '#f8d7da' : p.qty <= 10 ? '#fff3cd' : '#d1ecf1',
                        border: `2px solid ${p.qty <= 0 ? '#dc3545' : p.qty <= 10 ? '#ffc107' : '#0dcaf0'}`,
                        fontWeight: '600'
                      }}>
                        <i className={`fas ${p.qty <= 0 ? 'fa-exclamation-triangle' : p.qty <= 10 ? 'fa-exclamation-circle' : 'fa-check-circle'}`} 
                           style={{ 
                             color: p.qty <= 0 ? '#dc3545' : p.qty <= 10 ? '#856404' : '#28a745',
                             fontSize: '14px'
                           }}></i>
                        <span className="label" style={{ color: p.qty <= 0 ? '#721c24' : p.qty <= 10 ? '#856404' : '#155724' }}>
                          Stock:
                        </span>
                        <span className="value" style={{ 
                          color: p.qty <= 0 ? '#dc3545' : p.qty <= 10 ? '#856404' : '#28a745',
                          fontSize: '16px'
                        }}>
                          {p.qty}
                        </span>
                        {p.qty <= 0 && (
                          <span style={{ fontSize: '11px', color: '#dc3545', fontWeight: 'bold' }}>OUT</span>
                        )}
                        {p.qty > 0 && p.qty <= 10 && (
                          <span style={{ fontSize: '11px', color: '#856404', fontWeight: 'bold' }}>LOW</span>
                        )}
                      </div>
                      <div className={`product-status ${p.status === 'STOCK' ? 'status-stock' : 'status-instock'}`}>
                        {p.status}
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }} ref={menuRef}>
                    <button 
                      className="product-options"
                      onClick={(e) => handleOptionsClick(e, p.id)}
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {showOptionsMenu === p.id && (
                      <div style={{
                        position: 'absolute',
                        top: '30px',
                        right: '0',
                        background: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        minWidth: '150px',
                        padding: '8px 0'
                      }}>
                        <button
                          onClick={() => handleViewProduct(p)}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#333'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          <i className="fas fa-eye" style={{ marginRight: '8px', color: '#dc3545' }}></i>
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditProduct(p)}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#333'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          <i className="fas fa-edit" style={{ marginRight: '8px', color: '#007bff' }}></i>
                          Edit Product
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#dc3545'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#ffe0e0'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          <i className="fas fa-trash" style={{ marginRight: '8px' }}></i>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={() => setShowViewModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Product Details</h2>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div><strong>Product Name:</strong> {selectedProduct.product_name}</div>
              <div><strong>Item Code:</strong> {selectedProduct.item_code}</div>
              <div><strong>SKU Code:</strong> {selectedProduct.sku_code}</div>
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                background: (selectedProduct.current_quantity || 0) <= 0 ? '#f8d7da' : 
                            (selectedProduct.current_quantity || 0) <= 10 ? '#fff3cd' : '#d1ecf1',
                border: `2px solid ${
                  (selectedProduct.current_quantity || 0) <= 0 ? '#dc3545' : 
                  (selectedProduct.current_quantity || 0) <= 10 ? '#ffc107' : '#0dcaf0'
                }`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontWeight: '600'
              }}>
                <i className={`fas ${(selectedProduct.current_quantity || 0) <= 0 ? 'fa-exclamation-triangle' : 
                                 (selectedProduct.current_quantity || 0) <= 10 ? 'fa-exclamation-circle' : 'fa-check-circle'}`} 
                   style={{ 
                     color: (selectedProduct.current_quantity || 0) <= 0 ? '#dc3545' : 
                            (selectedProduct.current_quantity || 0) <= 10 ? '#856404' : '#28a745',
                     fontSize: '20px'
                   }}></i>
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Current Stock</div>
                  <div style={{ 
                    fontSize: '24px', 
                    color: (selectedProduct.current_quantity || 0) <= 0 ? '#dc3545' : 
                           (selectedProduct.current_quantity || 0) <= 10 ? '#856404' : '#28a745',
                    fontWeight: 'bold'
                  }}>
                    {selectedProduct.current_quantity || 0}
                  </div>
                  {(selectedProduct.current_quantity || 0) <= 0 && (
                    <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px', fontWeight: 'bold' }}>
                      OUT OF STOCK
                    </div>
                  )}
                  {(selectedProduct.current_quantity || 0) > 0 && (selectedProduct.current_quantity || 0) <= 10 && (
                    <div style={{ fontSize: '12px', color: '#856404', marginTop: '4px', fontWeight: 'bold' }}>
                      LOW STOCK WARNING
                    </div>
                  )}
                </div>
              </div>
              <div><strong>Minimum Quantity:</strong> {selectedProduct.minimum_quantity || 0}</div>
              <div><strong>Supplier Name:</strong> {selectedProduct.supplier_name || 'N/A'}</div>
              <div><strong>Category:</strong> {selectedProduct.category || 'Uncategorized'}</div>
              <div><strong>MRP:</strong> ₹{selectedProduct.mrp || 'N/A'}</div>
              <div><strong>Discount:</strong> {selectedProduct.discount || 0}%</div>
              <div><strong>Sell Rate:</strong> ₹{selectedProduct.sell_rate || 'N/A'}</div>
              <div><strong>Status:</strong> {selectedProduct.status}</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={() => setShowEditModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Edit Product</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Product Name</label>
                <input
                  type="text"
                  name="productName"
                  value={editFormData.productName || ''}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Item Code</label>
                  <input
                    type="text"
                    name="itemCode"
                    value={editFormData.itemCode || ''}
                    onChange={handleEditInputChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>SKU Code</label>
                  <input
                    type="text"
                    name="skuCode"
                    value={editFormData.skuCode || ''}
                    onChange={handleEditInputChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Current Quantity</label>
                  <input
                    type="number"
                    name="currentQuantity"
                    value={editFormData.currentQuantity || ''}
                    onChange={handleEditInputChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Minimum Quantity</label>
                  <input
                    type="number"
                    name="minQuantity"
                    value={editFormData.minQuantity || ''}
                    onChange={handleEditInputChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Supplier Name</label>
                <input
                  type="text"
                  name="supplierName"
                  value={editFormData.supplierName || ''}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  placeholder="Enter supplier name"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>MRP</label>
                  <input
                    type="number"
                    name="mrp"
                    value={editFormData.mrp || ''}
                    onChange={handleEditInputChange}
                    step="0.01"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    value={editFormData.discount || ''}
                    onChange={handleEditInputChange}
                    step="0.01"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Sell Rate</label>
                  <input
                    type="number"
                    name="sellRate"
                    value={editFormData.sellRate || ''}
                    onChange={handleEditInputChange}
                    step="0.01"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Sales Rate</label>
                  <input
                    type="number"
                    name="salesRate"
                    value={editFormData.salesRate || ''}
                    onChange={handleEditInputChange}
                    step="0.01"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>NLC</label>
                  <input
                    type="number"
                    name="nlc"
                    value={editFormData.nlc || ''}
                    onChange={handleEditInputChange}
                    step="0.01"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>DISC</label>
                  <input
                    type="number"
                    name="disc"
                    value={editFormData.disc || ''}
                    onChange={handleEditInputChange}
                    step="0.01"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Points</label>
                  <input
                    type="number"
                    name="points"
                    value={editFormData.points || ''}
                    onChange={handleEditInputChange}
                    min="0"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Category</label>
                <select
                  name="category"
                  value={editFormData.category || ''}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                >
                  <option value="">Select category</option>
                  <option value="Category 1">Category 1</option>
                  <option value="Category 2">Category 2</option>
                  <option value="Category 3">Category 3</option>
                  <option value="Category 4">Category 4</option>
                  <option value="Category 5">Category 5</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Status</label>
                <select
                  name="status"
                  value={editFormData.status || 'STOCK'}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                >
                  <option value="STOCK">STOCK</option>
                  <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                  <option value="LOW_STOCK">LOW STOCK</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={handleUpdateProduct}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Update Product
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default Products;

