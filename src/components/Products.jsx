import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, categoriesAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './products.css';

const Products = ({ onBack, onAddProduct, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editProductModal, setEditProductModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null, product: null });
  const menuRefs = useRef({});
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
    fetchCategories();
  }, []);

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response && response.success) {
        setCategories(response.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Get unique categories from products for filtering
  const productCategories = products.map(p => p.category).filter(Boolean);
  const uniqueProductCategories = [...new Set(productCategories)];
  const categoryFilterOptions = ['All', ...uniqueProductCategories];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const toggleMenu = (productId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === productId ? null : productId);
  };

  const handleViewProduct = async (product) => {
    setOpenMenuId(null);
    try {
      const response = await productsAPI.getById(product.id);
      if (response.success) {
        setSelectedProduct(response.product);
        setShowViewModal(true);
      } else {
        setError('Failed to fetch product details');
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to fetch product details');
    }
  };

  const handleEditProduct = async (product) => {
    setOpenMenuId(null);
    try {
      const response = await productsAPI.getById(product.id);
      if (response.success) {
        setEditProductModal(response.product);
      } else {
        setError('Failed to fetch product details');
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to fetch product details');
    }
  };

  const handleDeleteProduct = (product) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      product: product,
      onConfirm: async () => {
        try {
          const response = await productsAPI.delete(product.id);
          if (response.success) {
            setSuccessMessage('Product deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            await fetchProducts();
            setConfirmState({ open: false, message: '', onConfirm: null, product: null });
          } else {
            setError('Failed to delete product');
            setConfirmState({ open: false, message: '', onConfirm: null, product: null });
          }
        } catch (err) {
          setError(err.message || 'Failed to delete product');
          setConfirmState({ open: false, message: '', onConfirm: null, product: null });
        }
      }
    });
  };

  // Handle save product details
  const handleSaveProductDetails = async () => {
    if (!editProductModal) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await productsAPI.update(editProductModal.id, {
        productName: editProductModal.product_name,
        itemCode: editProductModal.item_code,
        skuCode: editProductModal.sku_code,
        modelNumber: editProductModal.model_number || '',
        minimumQuantity: parseInt(editProductModal.minimum_quantity) || 0,
        currentQuantity: parseInt(editProductModal.current_quantity) || 0,
        supplierName: editProductModal.supplier_name || '',
        category: editProductModal.category || '',
        mrp: editProductModal.mrp ? parseFloat(editProductModal.mrp) : null,
        discount: editProductModal.discount ? parseFloat(editProductModal.discount) : 0,
        sellRate: editProductModal.sell_rate ? parseFloat(editProductModal.sell_rate) : null,
        salesRate: editProductModal.sales_rate ? parseFloat(editProductModal.sales_rate) : null,
        nlc: editProductModal.nlc ? parseFloat(editProductModal.nlc) : null,
        disc: editProductModal.disc ? parseFloat(editProductModal.disc) : 0,
        points: editProductModal.points ? parseInt(editProductModal.points) : 0,
        status: editProductModal.status || 'STOCK'
      });
      
      if (response.success) {
        await fetchProducts();
        setEditProductModal(null);
        setError('');
        setSuccessMessage('Product updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to update product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editProductModal) {
      setEditProductModal({
        ...editProductModal,
        [field]: value
      });
    }
  };

  const closeEditModal = () => {
    setEditProductModal(null);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedProduct(null);
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('masterMenu');
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
        {userRole === 'admin' && (
          <div className="nav-item" onClick={() => onNavigate && onNavigate('users')}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={handleStaff}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
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
                    zIndex: 10000,
                    minWidth: '180px',
                    padding: '8px 0',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    {categoryFilterOptions.map((cat) => (
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

            <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
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
                <div className="premium-cards-grid">
                  {filtered.map((p) => (
                    <div
                      key={p.id}
                      className="premium-identity-card"
                    >
                      {/* Card Header */}
                      <div className="premium-card-header">
                        <div className="premium-header-content">
                          <h3 className="premium-worker-name">{p.name || 'N/A'}</h3>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Item Code: {p.itemCode || 'N/A'}
                          </div>
                        </div>
                        {/* Floating Three-Dot Menu */}
                        <div 
                          className="premium-card-menu" 
                          ref={el => menuRefs.current[p.id] = el}
                        >
                          <button 
                            className="premium-menu-trigger"
                            onClick={(e) => toggleMenu(p.id, e)}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          {openMenuId === p.id && (
                            <div className="premium-menu-dropdown">
                              <div className="premium-menu-item" onClick={() => handleViewProduct(p)}>
                                <i className="fas fa-eye"></i>
                                <span>View</span>
                              </div>
                              <div className="premium-menu-item" onClick={() => handleEditProduct(p)}>
                                <i className="fas fa-edit"></i>
                                <span>Edit</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body - Two Column Layout */}
                      <div className="premium-card-body">
                        <div className="premium-info-row">
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-barcode"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">SKU Code</span>
                              <span className="premium-info-value">{p.sku || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="premium-info-item">
                            <div className="premium-info-icon" style={{
                              background: p.qty <= 0 ? 'linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(200, 35, 51, 0.1) 100%)' :
                                          p.qty <= 10 ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)' :
                                          'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(34, 139, 58, 0.1) 100%)',
                              color: p.qty <= 0 ? '#dc3545' : p.qty <= 10 ? '#ffc107' : '#28a745'
                            }}>
                              <i className={`fas ${p.qty <= 0 ? 'fa-exclamation-triangle' : p.qty <= 10 ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Stock</span>
                              <span className="premium-info-value" style={{
                                color: p.qty <= 0 ? '#dc3545' : p.qty <= 10 ? '#856404' : '#28a745'
                              }}>
                                {p.qty || 0}
                                {p.qty <= 0 && ' (OUT)'}
                                {p.qty > 0 && p.qty <= 10 && ' (LOW)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Delete Product"
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null, product: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Edit Product Details Modal */}
      {editProductModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Edit Product Details</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content" style={{ padding: '20px' }}>
              {error && (
                <div style={{ 
                  padding: '12px', 
                  background: '#ffe0e0', 
                  color: '#dc3545', 
                  borderRadius: '8px', 
                  marginBottom: '20px' 
                }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              <div className="customer-detail-section">
                <div className="detail-info" style={{ width: '100%' }}>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Product Name:</span>
                    <input
                      type="text"
                      value={editProductModal.product_name || ''}
                      onChange={(e) => handleEditInputChange('product_name', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Item Code:</span>
                    <input
                      type="text"
                      value={editProductModal.item_code || ''}
                      onChange={(e) => handleEditInputChange('item_code', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>SKU Code:</span>
                    <input
                      type="text"
                      value={editProductModal.sku_code || ''}
                      onChange={(e) => handleEditInputChange('sku_code', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Current Quantity:</span>
                    <input
                      type="number"
                      value={editProductModal.current_quantity || ''}
                      onChange={(e) => handleEditInputChange('current_quantity', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Minimum Quantity:</span>
                    <input
                      type="number"
                      value={editProductModal.minimum_quantity || ''}
                      onChange={(e) => handleEditInputChange('minimum_quantity', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Supplier Name:</span>
                    <input
                      type="text"
                      value={editProductModal.supplier_name || ''}
                      onChange={(e) => handleEditInputChange('supplier_name', e.target.value)}
                      placeholder="Optional"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Category:</span>
                    <select
                      value={editProductModal.category || ''}
                      onChange={(e) => handleEditInputChange('category', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => {
                        const categoryLabel = `${cat.main}${cat.sub ? ' - ' + cat.sub : ''}${cat.common ? ' - ' + cat.common : ''}`;
                        return (
                          <option key={cat.id} value={categoryLabel}>
                            {categoryLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>MRP:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editProductModal.mrp || ''}
                      onChange={(e) => handleEditInputChange('mrp', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Discount (%):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editProductModal.discount || ''}
                      onChange={(e) => handleEditInputChange('discount', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Sell Rate:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editProductModal.sell_rate || ''}
                      onChange={(e) => handleEditInputChange('sell_rate', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Status:</span>
                    <select
                      value={editProductModal.status || 'STOCK'}
                      onChange={(e) => handleEditInputChange('status', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    >
                      <option value="STOCK">STOCK</option>
                      <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                      <option value="LOW_STOCK">LOW STOCK</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '20px' }}>
              <button 
                className="modal-close-button" 
                onClick={closeEditModal}
                style={{ background: '#6c757d', color: '#fff' }}
              >
                Cancel
              </button>
              <button 
                className="modal-close-button" 
                onClick={handleSaveProductDetails}
                disabled={isSaving}
                style={{ 
                  background: '#dc3545', 
                  color: '#fff',
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Product Details Modal */}
      {showViewModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{selectedProduct.product_name 
                    ? selectedProduct.product_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'PR'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Product Name:</span>
                    <span className="detail-value">{selectedProduct.product_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Item Code:</span>
                    <span className="detail-value">{selectedProduct.item_code || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">SKU Code:</span>
                    <span className="detail-value">{selectedProduct.sku_code || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Current Quantity:</span>
                    <span className="detail-value" style={{
                      color: (selectedProduct.current_quantity || 0) <= 0 ? '#dc3545' : 
                             (selectedProduct.current_quantity || 0) <= 10 ? '#856404' : '#28a745',
                      fontWeight: '600'
                    }}>
                      {selectedProduct.current_quantity || 0}
                      {(selectedProduct.current_quantity || 0) <= 0 && ' (OUT OF STOCK)'}
                      {(selectedProduct.current_quantity || 0) > 0 && (selectedProduct.current_quantity || 0) <= 10 && ' (LOW STOCK)'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Minimum Quantity:</span>
                    <span className="detail-value">{selectedProduct.minimum_quantity || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Supplier Name:</span>
                    <span className="detail-value">{selectedProduct.supplier_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{selectedProduct.category || 'Uncategorized'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">MRP:</span>
                    <span className="detail-value">₹{selectedProduct.mrp || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Discount:</span>
                    <span className="detail-value">{selectedProduct.discount || 0}%</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Sell Rate:</span>
                    <span className="detail-value">₹{selectedProduct.sell_rate || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{selectedProduct.status || 'STOCK'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-close-button" onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

