import React, { useState, useEffect, useRef } from 'react';
import { productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

const AddProductPricing = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    itemCode: '',
    mrp: '',
    discount: '',
    sellRate: '',
    salesRate: '',
    nlc: '',
    disc: '',
    points: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [product, setProduct] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [showItemCodeDropdown, setShowItemCodeDropdown] = useState(false);
  const itemCodeDropdownRef = useRef(null);

  // Fetch all products on mount
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await productsAPI.getAll();
        if (response.success) {
          setAllProducts(response.products || []);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchAllProducts();
  }, []);

  // Filter products based on item code search
  const filteredProducts = allProducts.filter(p => {
    const searchTerm = formData.itemCode.toLowerCase();
    return p.item_code.toLowerCase().includes(searchTerm) || 
           p.product_name.toLowerCase().includes(searchTerm);
  });

  // Search product by item code
  const searchProduct = async (itemCode) => {
    if (!itemCode || itemCode.trim().length === 0) {
      setProduct(null);
      return;
    }

    try {
      setIsSearching(true);
      setError('');
      const foundProduct = allProducts.find(
        p => p.item_code.toLowerCase() === itemCode.toLowerCase().trim()
      );
      if (foundProduct) {
        setProduct(foundProduct);
        // Pre-fill existing pricing if available
        setFormData(prev => ({
          ...prev,
          mrp: foundProduct.mrp || '',
          discount: foundProduct.discount || '',
          sellRate: foundProduct.sell_rate || '',
          salesRate: foundProduct.sales_rate || '',
          nlc: foundProduct.nlc || '',
          disc: foundProduct.disc || '',
          points: foundProduct.points || ''
        }));
        setShowItemCodeDropdown(false);
      } else {
        setProduct(null);
        setError('Product not found with this item code');
      }
    } catch (err) {
      console.error('Error searching product:', err);
      setError('Failed to search product. Please try again.');
      setProduct(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle item code selection from dropdown
  const handleItemCodeSelect = (selectedProduct) => {
    setFormData(prev => ({
      ...prev,
      itemCode: selectedProduct.item_code
    }));
    setProduct(selectedProduct);
    // Pre-fill existing pricing if available
    setFormData(prev => ({
      ...prev,
      itemCode: selectedProduct.item_code,
      mrp: selectedProduct.mrp || '',
      discount: selectedProduct.discount || '',
      sellRate: selectedProduct.sell_rate || '',
      salesRate: selectedProduct.sales_rate || '',
      nlc: selectedProduct.nlc || '',
      disc: selectedProduct.disc || '',
      points: selectedProduct.points || ''
    }));
    setShowItemCodeDropdown(false);
    setError('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (itemCodeDropdownRef.current && !itemCodeDropdownRef.current.contains(event.target)) {
        setShowItemCodeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle item code input change
  const handleItemCodeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      itemCode: value
    }));
    
    // Show dropdown when typing
    if (value.trim().length > 0) {
      setShowItemCodeDropdown(true);
    } else {
      setShowItemCodeDropdown(false);
      setProduct(null);
      setError('');
    }
  };

  // Handle item code search on Enter key
  const handleItemCodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (formData.itemCode.trim().length > 0) {
        searchProduct(formData.itemCode);
        setShowItemCodeDropdown(false);
      }
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionProducts');
    } else if (onBack) {
      onBack();
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('transactionProducts');
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateSellRate = () => {
    const mrp = parseFloat(formData.mrp);
    const discount = parseFloat(formData.discount) || 0;
    
    if (mrp && mrp > 0) {
      const discountAmount = (mrp * discount) / 100;
      const sellRate = mrp - discountAmount;
      
      setFormData(prev => ({
        ...prev,
        sellRate: sellRate.toFixed(2)
      }));
    }
  };

  const handlePricingKeyPress = (e, fieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (fieldName === 'mrp' || fieldName === 'discount') {
        if (formData.mrp && formData.discount) {
          calculateSellRate();
        } else if (fieldName === 'mrp' && formData.mrp) {
          setFormData(prev => ({
            ...prev,
            sellRate: parseFloat(prev.mrp).toFixed(2)
          }));
        }
      }
    }
  };

  const submitPricing = async () => {
    if (!product) {
      setError('Please search and select a product first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await productsAPI.update(product.id, {
        productName: product.product_name,
        itemCode: product.item_code,
        skuCode: product.sku_code,
        minimumQuantity: product.minimum_quantity || 0,
        currentQuantity: product.current_quantity || 0,
        category: product.category || '',
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        sellRate: formData.sellRate ? parseFloat(formData.sellRate) : null,
        salesRate: formData.salesRate ? parseFloat(formData.salesRate) : null,
        nlc: formData.nlc ? parseFloat(formData.nlc) : null,
        disc: formData.disc ? parseFloat(formData.disc) : 0,
        points: formData.points ? parseInt(formData.points) : 0
      });

      if (response.success) {
        setSuccessMessage('Pricing saved successfully');
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to save pricing. Please try again.');
      console.error('Save pricing error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product) {
      setError('Please search and select a product first');
      return;
    }
    setConfirmState({
      open: true,
      message: 'Are you sure you want to save the pricing?',
      onConfirm: submitPricing,
    });
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
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

      {/* Main Content Area */}
      <div className="dashboard-main">
        <div className="add-user-container">
          {/* Header */}
          <header className="add-user-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Add Product Pricing</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form add-product-pricing-form">
              {/* All fields in 3-column grid without section titles */}
              <div className="form-section">
                <div className="form-grid three-col">
                  {/* Row 1: Item Code, Category, Product Name */}
                  <div className="form-group" ref={itemCodeDropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
                    <label htmlFor="itemCode">Item Code *</label>
                    <div className="input-wrapper">
                      <i className="fas fa-barcode input-icon"></i>
                      <input
                        type="text"
                        id="itemCode"
                        name="itemCode"
                        className="form-input"
                        placeholder="Type item code to search..."
                        value={formData.itemCode}
                        onChange={handleItemCodeChange}
                        onKeyPress={handleItemCodeKeyPress}
                        onFocus={() => {
                          if (formData.itemCode.trim().length > 0 && filteredProducts.length > 0) {
                            setShowItemCodeDropdown(true);
                          }
                        }}
                        required
                        autoComplete="off"
                        style={{ paddingRight: isSearching ? '40px' : '18px' }}
                      />
                      {isSearching && (
                        <i className="fas fa-spinner fa-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}></i>
                      )}
                    </div>
                    {showItemCodeDropdown && filteredProducts.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10000,
                        maxHeight: '300px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {filteredProducts.map((p, index) => (
                          <div
                            key={p.id}
                            onClick={() => handleItemCodeSelect(p)}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              borderBottom: index < filteredProducts.length - 1 ? '1px solid #f0f0f0' : 'none',
                              background: product && product.id === p.id ? '#f0f7ff' : '#fff',
                              color: product && product.id === p.id ? '#007bff' : '#333'
                            }}
                            onMouseEnter={(e) => {
                              const target = e.currentTarget;
                              target.style.background = '#f8f9fa';
                            }}
                            onMouseLeave={(e) => {
                              const target = e.currentTarget;
                              target.style.background = product && product.id === p.id ? '#f0f7ff' : '#fff';
                            }}
                          >
                            <div style={{ fontWeight: '600' }}>
                              {p.item_code} <span style={{ fontWeight: '400', color: '#666' }}>({p.product_name})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <div className="input-wrapper">
                      <i className="fas fa-tags input-icon"></i>
                      <input
                        type="text"
                        id="category"
                        className="form-input"
                        placeholder="Category"
                        value={product?.category || ''}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                      </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="productName">Product Name</label>
                    <div className="input-wrapper">
                      <i className="fas fa-box input-icon"></i>
                      <input
                        type="text"
                        id="productName"
                        className="form-input"
                        placeholder="Product Name"
                        value={product?.product_name || ''}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                </div>
              </div>

                  {/* Row 2: MRP, Discount, Sell Rate */}
                    <div className="form-group">
                      <label htmlFor="mrp">MRP</label>
                      <div className="input-wrapper">
                        <i className="fas fa-rupee-sign input-icon"></i>
                        <input
                          type="number"
                          id="mrp"
                          name="mrp"
                          className="form-input"
                        placeholder="Enter MRP"
                          value={formData.mrp}
                          onChange={handleInputChange}
                          onKeyPress={(e) => handlePricingKeyPress(e, 'mrp')}
                          min="0"
                          step="0.01"
                        disabled={!product}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="discount">Discount (%)</label>
                      <div className="input-wrapper">
                        <i className="fas fa-percent input-icon"></i>
                        <input
                          type="number"
                          id="discount"
                          name="discount"
                          className="form-input"
                        placeholder="Enter discount %"
                          value={formData.discount}
                          onChange={handleInputChange}
                          onKeyPress={(e) => handlePricingKeyPress(e, 'discount')}
                          min="0"
                          step="0.01"
                        disabled={!product}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                    <label htmlFor="sellRate">Sell Rate</label>
                      <div className="input-wrapper">
                        <i className="fas fa-tag input-icon"></i>
                        <input
                          type="number"
                          id="sellRate"
                          name="sellRate"
                          className="form-input"
                        placeholder="Auto-calculated"
                          value={formData.sellRate}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        disabled={!product}
                        />
                      </div>
                    </div>

                  {/* Row 3: Sales Rate, NLC, DISC */}
                    <div className="form-group">
                      <label htmlFor="salesRate">Sales Rate</label>
                      <div className="input-wrapper">
                        <i className="fas fa-rupee-sign input-icon"></i>
                        <input
                          type="number"
                          id="salesRate"
                          name="salesRate"
                          className="form-input"
                          placeholder="Enter sales rate"
                          value={formData.salesRate}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        disabled={!product}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="nlc">NLC</label>
                      <div className="input-wrapper">
                        <i className="fas fa-dollar-sign input-icon"></i>
                        <input
                          type="number"
                          id="nlc"
                          name="nlc"
                          className="form-input"
                          placeholder="Enter NLC"
                          value={formData.nlc}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        disabled={!product}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="disc">DISC</label>
                      <div className="input-wrapper">
                        <i className="fas fa-percent input-icon"></i>
                        <input
                          type="number"
                          id="disc"
                          name="disc"
                          className="form-input"
                          placeholder="Enter DISC"
                          value={formData.disc}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        disabled={!product}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Toast message={error} type="error" onClose={() => setError('')} />
              <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

              {/* Action Buttons */}
              <div className="form-actions">
                <button type="submit" className="create-user-btn" disabled={isLoading || !product}>
                  {isLoading ? 'Saving...' : 'Save Pricing'}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        title="Confirm Submission"
        message={confirmState.message}
        confirmText="Yes, Save"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmState({ open: false, message: '', onConfirm: null });
          if (confirmState.onConfirm) confirmState.onConfirm();
        }}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
    </div>
  );
};

export default AddProductPricing;

