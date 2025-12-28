import React, { useState } from 'react';
import { productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const CreateSupplierTransaction = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    phone: '',
    email: ''
  });
  
  // Current product being entered (single form)
  const [currentProduct, setCurrentProduct] = useState({
      itemCode: '', 
      productName: '',
      skuCode: '',
      category: '',
      quantity: '', 
      mrp: '', 
      sellRate: '', 
    isFetching: false,
    productInfo: null
  });
  
  // Added products (displayed as cards)
  const [addedProducts, setAddedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
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

  const handleProductChange = (field, value) => {
    setCurrentProduct(prev => {
      const updated = { ...prev, [field]: value };
    
      // Reset product info if item code changes
    if (field === 'itemCode') {
        updated.productInfo = null;
        updated.productName = '';
        updated.skuCode = '';
        updated.category = '';
        updated.mrp = '';
        updated.sellRate = '';
      }
      
      return updated;
    });
  };

  const handleItemCodeKeyPress = async (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      await fetchProductByItemCode();
    }
  };

  const fetchProductByItemCode = async () => {
    if (!currentProduct.itemCode?.trim()) {
      setError('Please enter an item code');
      return;
    }
    
    setCurrentProduct(prev => ({ ...prev, isFetching: true }));
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await productsAPI.getByItemCode(currentProduct.itemCode.trim());
      
      if (response.success && response.product) {
        const product = response.product;
        const productData = {
          id: product.id,
          productName: product.product_name || product.productName || '',
          itemCode: product.item_code || product.itemCode || '',
          skuCode: product.sku_code || product.skuCode || '',
          category: product.category || '',
          mrp: product.mrp || 0,
          sellRate: product.sell_rate || product.sellRate || 0
        };
        
        setCurrentProduct(prev => ({
          ...prev,
          productInfo: productData,
          productName: productData.productName,
          skuCode: productData.skuCode,
          category: productData.category,
          mrp: productData.mrp ? String(productData.mrp) : '',
          sellRate: productData.sellRate ? String(productData.sellRate) : '',
              isFetching: false
        }));
        
        setSuccessMessage('Product details fetched successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Product not found with this item code');
        setCurrentProduct(prev => ({ 
          ...prev, 
          productInfo: null,
              productName: '',
              skuCode: '',
              category: '',
              mrp: '', 
              sellRate: '',
              isFetching: false
        }));
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err.message || 'Product not found with this item code. Please check the item code and try again.');
      setCurrentProduct(prev => ({ 
        ...prev, 
        productInfo: null,
            productName: '',
            skuCode: '',
            category: '',
            mrp: '', 
            sellRate: '',
            isFetching: false
      }));
    }
  };

  const addProduct = () => {
    // Validate that product info exists and required fields are entered
    if (!currentProduct.productInfo) {
      setError('Please fetch product details first');
      return;
    }
    
    if (!currentProduct.quantity || parseInt(currentProduct.quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    
    if (!currentProduct.mrp || parseFloat(currentProduct.mrp) <= 0) {
      setError('Please enter a valid MRP');
      return;
    }
    
    if (!currentProduct.sellRate || parseFloat(currentProduct.sellRate) <= 0) {
      setError('Please enter a valid selling rate');
      return;
    }
    
    // Check if this product (item code) is already added
    const isDuplicate = addedProducts.some(p => 
      p.itemCode && p.itemCode.trim() === currentProduct.itemCode.trim()
    );
    
    if (isDuplicate) {
      setError('This product is already added. Please remove it first if you want to change the details.');
      return;
    }
    
    const newId = addedProducts.length > 0 
      ? Math.max(...addedProducts.map(p => p.id)) + 1 
      : 1;
    
    setAddedProducts(prev => [...prev, {
      id: newId, 
      ...currentProduct,
      quantity: parseInt(currentProduct.quantity),
      mrp: parseFloat(currentProduct.mrp),
      sellRate: parseFloat(currentProduct.sellRate)
    }]);
    
    // Clear current product form
    setCurrentProduct({
      itemCode: '', 
      productName: '',
      skuCode: '',
      category: '',
      quantity: '', 
      mrp: '', 
      sellRate: '', 
      isFetching: false,
      productInfo: null
    });
    setError('');
  };

  const removeProduct = (productId) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const submitSupplierTransaction = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!formData.supplierName.trim()) {
      setError('Supplier name is required');
      setIsLoading(false);
      return;
    }

    if (addedProducts.length === 0) {
      setError('Please add at least one product.');
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      // Get user identifier
      const userDataStr = localStorage.getItem('userData');
      let createdBy = 'system';
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          createdBy = userData.username || userData.email || userData.full_name || 'system';
        } catch (e) {
          console.error('Error parsing userData:', e);
        }
      }
      
      const transactionData = {
        supplierName: formData.supplierName.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        createdBy: createdBy,
        products: addedProducts.map(item => ({
          itemCode: item.itemCode.trim(),
          productName: item.productName,
          skuCode: item.skuCode,
          category: item.category,
          quantity: item.quantity,
          mrp: item.mrp,
          sellRate: item.sellRate
        }))
      };

      const response = await fetch(`${apiUrl}/suppliers/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(transactionData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create supplier transaction');
      }

      if (data.success) {
        setSuccessMessage('Supplier transaction created successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      } else {
        setError(data.error || 'Failed to create supplier transaction');
      }
    } catch (err) {
      console.error('Create supplier transaction error:', err);
      setError(err.message || 'Failed to create supplier transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit this supplier transaction?',
      onConfirm: submitSupplierTransaction,
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
              <h1 className="page-title">Create Supplier Transaction</h1>
              <p className="page-subtitle">Record products received from supplier.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form add-supplier-transaction-form">
              {/* All fields in 3-column grid without section titles */}
                <div className="form-section">
                <div className="form-grid three-col">
                  {/* Row 1: Name, Phone Number, Email */}
                    <div className="form-group">
                    <label htmlFor="supplierName">Name *</label>
                      <div className="input-wrapper">
                        <i className="fas fa-building input-icon"></i>
                        <input
                          type="text"
                          id="supplierName"
                          name="supplierName"
                          className="form-input"
                        placeholder="Enter supplier name"
                          value={formData.supplierName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-input"
                        placeholder="Enter phone number"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-wrapper">
                      <i className="fas fa-envelope input-icon"></i>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-input"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                </div>
                  </div>

                  {/* Row 2: Item Code, Product Name, Quantity */}
                  <div className="form-group">
                    <label htmlFor="itemCode">Item Code *</label>
                    <div className="input-wrapper" style={{ position: 'relative' }}>
                      <i className="fas fa-barcode input-icon"></i>
                      <input
                        type="text"
                        id="itemCode"
                        className="form-input"
                        placeholder="Enter item code"
                        value={currentProduct.itemCode}
                        onChange={(e) => handleProductChange('itemCode', e.target.value)}
                        onKeyPress={handleItemCodeKeyPress}
                        required
                        style={{ paddingRight: currentProduct.isFetching ? '40px' : '80px' }}
                      />
                      {currentProduct.isFetching ? (
                        <div style={{ 
                          position: 'absolute', 
                          right: '10px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: '#999'
                        }}>
                          <i className="fas fa-spinner fa-spin"></i>
                        </div>
                      ) : (
                          <button
                            type="button"
                          onClick={fetchProductByItemCode}
                            style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '6px 12px',
                              background: '#dc3545',
                            color: '#fff',
                              border: 'none',
                            borderRadius: '6px',
                              cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                            }}
                          >
                          <i className="fas fa-search"></i>
                          Fetch
                          </button>
                        )}
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
                        value={currentProduct.productName}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                          </div>
                        </div>

                        <div className="form-group">
                    <label htmlFor="quantity">Quantity *</label>
                          <div className="input-wrapper">
                            <i className="fas fa-cube input-icon"></i>
                            <input
                              type="number"
                        id="quantity"
                              className="form-input"
                              placeholder="Enter quantity"
                        value={currentProduct.quantity}
                        onChange={(e) => handleProductChange('quantity', e.target.value)}
                              min="1"
                              step="1"
                              required
                            />
                          </div>
                        </div>

                  {/* Row 3: MRP, Selling Rate */}
                        <div className="form-group">
                    <label htmlFor="mrp">MRP *</label>
                          <div className="input-wrapper">
                            <i className="fas fa-rupee-sign input-icon"></i>
                            <input
                              type="number"
                        id="mrp"
                              className="form-input"
                              placeholder="Enter MRP"
                        value={currentProduct.mrp}
                        onChange={(e) => handleProductChange('mrp', e.target.value)}
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group">
                    <label htmlFor="sellRate">Selling Rate *</label>
                          <div className="input-wrapper">
                            <i className="fas fa-tag input-icon"></i>
                            <input
                              type="number"
                        id="sellRate"
                              className="form-input"
                              placeholder="Enter selling rate"
                        value={currentProduct.sellRate}
                        onChange={(e) => handleProductChange('sellRate', e.target.value)}
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                    {/* Add Product button below Selling Rate */}
                    <button
                      type="button"
                      onClick={addProduct}
                      disabled={!currentProduct.productInfo || !currentProduct.quantity || !currentProduct.mrp || !currentProduct.sellRate}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: (currentProduct.productInfo && currentProduct.quantity && currentProduct.mrp && currentProduct.sellRate) ? '#28a745' : '#ccc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (currentProduct.productInfo && currentProduct.quantity && currentProduct.mrp && currentProduct.sellRate) ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fas fa-plus"></i>
                      Add Product
                    </button>
                  </div>
                </div>
              </div>

              {/* Display Added Products - Horizontal cards like dispatch department */}
              {addedProducts.length > 0 && (
                <div style={{ 
                  marginTop: '16px',
                  marginBottom: '20px',
                  clear: 'both'
                }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#333', 
                    fontSize: '12px' 
                  }}>
                    Added Products ({addedProducts.length})
                  </label>
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '8px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    width: '100%'
                  }}>
                    {addedProducts.map((product, index) => (
                      <div
                        key={product.id}
                        style={{
                          padding: '8px',
                          background: '#f8f9fa',
                          border: '2px solid #e0e0e0',
                          borderRadius: '6px',
                          position: 'relative',
                          minWidth: '200px',
                          maxWidth: '200px',
                          flexShrink: 0,
                          boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ marginBottom: '6px', fontWeight: '600', color: '#dc3545', fontSize: '11px' }}>
                          Product {index + 1}
                        </div>
                        {product.itemCode && (
                          <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                            <span style={{ fontWeight: '500', color: '#666' }}>Item Code: </span>
                            <span style={{ color: '#333' }}>{product.itemCode}</span>
                          </div>
                        )}
                        {product.productName && (
                          <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                            <span style={{ fontWeight: '500', color: '#666' }}>Product: </span>
                            <span style={{ color: '#333' }}>{product.productName}</span>
                          </div>
                        )}
                        <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                          <span style={{ fontWeight: '500', color: '#666' }}>Qty: </span>
                          <span style={{ color: '#333', fontWeight: '600' }}>{product.quantity}</span>
                        </div>
                        <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                          <span style={{ fontWeight: '500', color: '#666' }}>MRP: </span>
                          <span style={{ color: '#333', fontWeight: '600' }}>₹{product.mrp}</span>
                      </div>
                        <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                          <span style={{ fontWeight: '500', color: '#666' }}>Sell Rate: </span>
                          <span style={{ color: '#333', fontWeight: '600' }}>₹{product.sellRate}</span>
                    </div>
                  <button 
                    type="button" 
                          onClick={() => removeProduct(product.id)}
                    style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: '#dc3545',
                            color: '#fff',
                      border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                      cursor: 'pointer',
                            display: 'flex',
                      alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            padding: 0
                    }}
                          title="Remove this product"
                  >
                          <i className="fas fa-times"></i>
                  </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}


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

                {/* Action Buttons */}
                <div className="form-actions">
                  <button type="submit" className="create-user-btn" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Transaction'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel and go back
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
        confirmText="Yes, Submit"
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

export default CreateSupplierTransaction;

