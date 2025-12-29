import React, { useState, useEffect, useRef } from 'react';
import { productsAPI } from '../services/api';
import './products.css';

const TransactionProducts = ({ onBack, onAddPricing, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const menuRef = useRef(null);

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
          sellRate: product.sell_rate,
          salesRate: product.sales_rate,
          nlc: product.nlc,
          disc: product.disc,
          points: product.points
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptionsMenu(null);
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

  const handleEditPricing = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      mrp: product.mrp || '',
      discount: product.discount || '',
      sellRate: product.sellRate || '',
      salesRate: product.salesRate || '',
      nlc: product.nlc || '',
      disc: product.disc || '',
      points: product.points || ''
    });
    setShowEditModal(true);
    setShowOptionsMenu(null);
  };

  const handleUpdatePricing = async () => {
    if (!selectedProduct) return;

    try {
      const response = await productsAPI.update(selectedProduct.id, {
        productName: selectedProduct.name,
        itemCode: selectedProduct.itemCode,
        skuCode: selectedProduct.sku,
        minimumQuantity: selectedProduct.minimum_quantity || 0,
        currentQuantity: selectedProduct.qty || 0,
        category: selectedProduct.category,
        mrp: editFormData.mrp ? parseFloat(editFormData.mrp) : null,
        discount: editFormData.discount ? parseFloat(editFormData.discount) : 0,
        sellRate: editFormData.sellRate ? parseFloat(editFormData.sellRate) : null,
        salesRate: editFormData.salesRate ? parseFloat(editFormData.salesRate) : null,
        nlc: editFormData.nlc ? parseFloat(editFormData.nlc) : null,
        disc: editFormData.disc ? parseFloat(editFormData.disc) : 0,
        points: editFormData.points ? parseInt(editFormData.points) : 0
      });

      if (response.success) {
        setSuccessMessage('Pricing updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchProducts();
        setShowEditModal(false);
        setSelectedProduct(null);
      }
    } catch (err) {
      setError('Failed to update pricing');
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAdd = () => {
    if (onAddPricing) {
      onAddPricing();
    } else if (onNavigate) {
      onNavigate('addProductPricing');
    }
  };

  // Filter products based on search
  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.itemCode.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
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
        {userRole === 'admin' && (
          <div className="nav-item" onClick={() => onNavigate && onNavigate('users')}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={() => onNavigate && onNavigate('staff')}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('settings')}>
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
              <h1 className="page-title">Product Pricing</h1>
              <p className="page-subtitle">Manage product pricing details</p>
            </div>
          </header>

          {/* Content */}
          <main className="products-content">
            <div className="products-top-section">
              <div className="tab-indicator">
                <span className="tab-dot"></span>
                <span className="tab-label">PRODUCT PRICING</span>
              </div>
            </div>

            <div className="products-heading">
              <h2>Products</h2>
              <p>View and manage product pricing information.</p>
            </div>

            {/* Search and Add Button */}
            <div className="products-controls">
              <div className="products-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search products by name, item code, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="add-product-btn" onClick={handleAdd}>
                <i className="fas fa-plus"></i>
                <span>Add Pricing</span>
              </button>
            </div>

            {/* Results Count */}
            <div className="products-count">
              {`Showing ${filtered.length} of ${products.length} products`}
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message" style={{ 
                padding: '12px', 
                background: '#ffe0e0', 
                color: '#dc3545', 
                borderRadius: '8px', 
                marginBottom: '20px' 
              }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="success-message" style={{ 
                padding: '12px', 
                background: '#d4edda', 
                color: '#155724', 
                borderRadius: '8px', 
                marginBottom: '20px' 
              }}>
                <i className="fas fa-check-circle"></i> {successMessage}
              </div>
            )}

            {/* Products List */}
            <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
              {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
                  <i className="fas fa-box" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Products Available</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>Products will appear here once created in Master Menu.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                  <p>No products found matching your search</p>
                </div>
              ) : (
                <div className="products-grid">
                  {filtered.map((p) => (
                    <div
                      key={p.id}
                      className="product-card pricing-card"
                      onClick={() => handleViewProduct(p)}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      <div className="product-header">
                        <div className="product-title">{p.name || 'Unknown Product'}</div>
                      </div>
                      <div className="product-details">
                        <div className="detail-row">
                          <span className="detail-label">Item Code:</span>
                          <span className="detail-value">{p.itemCode || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">SKU Code:</span>
                          <span className="detail-value">{p.sku || 'N/A'}</span>
                        </div>
                        {p.mrp && (
                          <div className="detail-row">
                            <span className="detail-label">MRP:</span>
                            <span className="detail-value" style={{ color: '#28a745', fontWeight: 'bold' }}>
                              ₹{p.mrp}
                            </span>
                          </div>
                        )}
                        {p.sellRate && (
                          <div className="detail-row">
                            <span className="detail-label">Sell Rate:</span>
                            <span className="detail-value" style={{ fontWeight: 'bold' }}>
                              ₹{p.sellRate}
                            </span>
                          </div>
                        )}
                        {p.salesRate && (
                          <div className="detail-row">
                            <span className="detail-label">Sales Rate:</span>
                            <span className="detail-value">₹{p.salesRate}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1 }} ref={menuRef}>
                        <button 
                          className="product-options"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOptionsClick(e, p.id);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.9)',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        {showOptionsMenu === p.id && (
                          <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: '0',
                            background: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 10000,
                            minWidth: '150px',
                            padding: '8px 0'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProduct(p);
                              }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPricing(p);
                              }}
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
                              Edit Pricing
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Edit Pricing Modal */}
      {showEditModal && selectedProduct && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Edit Pricing - {selectedProduct.itemCode}</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>MRP</label>
                <input
                  type="number"
                  value={editFormData.mrp || ''}
                  onChange={(e) => setEditFormData({...editFormData, mrp: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  step="0.01"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Discount (%)</label>
                <input
                  type="number"
                  value={editFormData.discount || ''}
                  onChange={(e) => setEditFormData({...editFormData, discount: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  step="0.01"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Sell Rate</label>
                <input
                  type="number"
                  value={editFormData.sellRate || ''}
                  onChange={(e) => setEditFormData({...editFormData, sellRate: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  step="0.01"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Sales Rate</label>
                <input
                  type="number"
                  value={editFormData.salesRate || ''}
                  onChange={(e) => setEditFormData({...editFormData, salesRate: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  step="0.01"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>NLC</label>
                <input
                  type="number"
                  value={editFormData.nlc || ''}
                  onChange={(e) => setEditFormData({...editFormData, nlc: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  step="0.01"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>DISC</label>
                <input
                  type="number"
                  value={editFormData.disc || ''}
                  onChange={(e) => setEditFormData({...editFormData, disc: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  step="0.01"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Points</label>
                <input
                  type="number"
                  value={editFormData.points || ''}
                  onChange={(e) => setEditFormData({...editFormData, points: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={handleUpdatePricing}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Update Pricing
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
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
            width: '90%'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Product Details</h2>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div><strong>Product Name:</strong> {selectedProduct.product_name || selectedProduct.name}</div>
              <div><strong>Item Code:</strong> {selectedProduct.item_code || selectedProduct.itemCode}</div>
              <div><strong>SKU Code:</strong> {selectedProduct.sku_code || selectedProduct.sku}</div>
              <div><strong>MRP:</strong> {selectedProduct.mrp ? `₹${selectedProduct.mrp}` : 'N/A'}</div>
              <div><strong>Discount:</strong> {selectedProduct.discount ? `${selectedProduct.discount}%` : 'N/A'}</div>
              <div><strong>Sell Rate:</strong> {selectedProduct.sell_rate || selectedProduct.sellRate ? `₹${selectedProduct.sell_rate || selectedProduct.sellRate}` : 'N/A'}</div>
              <div><strong>Sales Rate:</strong> {selectedProduct.sales_rate || selectedProduct.salesRate ? `₹${selectedProduct.sales_rate || selectedProduct.salesRate}` : 'N/A'}</div>
              <div><strong>NLC:</strong> {selectedProduct.nlc ? `₹${selectedProduct.nlc}` : 'N/A'}</div>
              <div><strong>DISC:</strong> {selectedProduct.disc ? `${selectedProduct.disc}%` : 'N/A'}</div>
              <div><strong>Points:</strong> {selectedProduct.points || 'N/A'}</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionProducts;

