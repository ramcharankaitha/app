import React, { useState } from 'react';
import { productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const CreateSupplierTransaction = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    phone: ''
  });
  const [productItems, setProductItems] = useState([
    { 
      id: 1, 
      itemCode: '', 
      productName: '',
      skuCode: '',
      category: '',
      quantity: '', 
      mrp: '', 
      sellRate: '', 
      isFetching: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onBack) {
      onBack();
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('dashboard');
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

  const handleProductItemChange = (id, field, value) => {
    setProductItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    
    // Reset product details if item code changes
    if (field === 'itemCode') {
      setProductItems(prev => 
        prev.map(item => 
          item.id === id ? { 
            ...item, 
            productName: '',
            skuCode: '',
            category: '',
            mrp: '', 
            sellRate: '' 
          } : item
        )
      );
    }
  };

  const handleItemCodeKeyPress = async (e, itemId) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      const item = productItems.find(p => p.id === itemId);
      const itemCode = item?.itemCode?.trim();
      if (itemCode) {
        await fetchProductByItemCode(itemCode, itemId);
      } else {
        setError('Please enter an item code');
      }
    }
  };

  const fetchProductByItemCode = async (itemCode, itemId) => {
    if (!itemCode || !itemCode.trim()) {
      setError('Please enter a valid item code');
      return;
    }
    
    setProductItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, isFetching: true } : item
      )
    );
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await productsAPI.getByItemCode(itemCode.trim());
      
      if (response.success && response.product) {
        const product = response.product;
        const productName = product.product_name || product.productName || '';
        const skuCode = product.sku_code || product.skuCode || '';
        const category = product.category || '';
        const mrp = product.mrp || '';
        const sellRate = product.sell_rate || product.sellRate || '';
        
        setProductItems(prev => 
          prev.map(item => 
            item.id === itemId ? { 
              ...item, 
              productName: productName,
              skuCode: skuCode,
              category: category,
              mrp: mrp ? String(mrp) : '',
              sellRate: sellRate ? String(sellRate) : '',
              isFetching: false
            } : item
          )
        );
        
        setSuccessMessage(`Product details fetched successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Product not found with this item code');
        setProductItems(prev => 
          prev.map(item => 
            item.id === itemId ? { 
              ...item, 
              productName: '',
              skuCode: '',
              category: '',
              mrp: '', 
              sellRate: '',
              isFetching: false
            } : item
          )
        );
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err.message || 'Product not found with this item code. Please check the item code and try again.');
      setProductItems(prev => 
        prev.map(item => 
          item.id === itemId ? { 
            ...item, 
            productName: '',
            skuCode: '',
            category: '',
            mrp: '', 
            sellRate: '',
            isFetching: false
          } : item
        )
      );
    }
  };

  const addProductItem = () => {
    const newId = productItems.length > 0 
      ? Math.max(...productItems.map(item => item.id)) + 1 
      : 1;
    setProductItems(prev => [...prev, { 
      id: newId, 
      itemCode: '', 
      productName: '',
      skuCode: '',
      category: '',
      quantity: '', 
      mrp: '', 
      sellRate: '', 
      isFetching: false
    }]);
  };

  const removeProductItem = (id) => {
    if (productItems.length > 1) {
      setProductItems(prev => prev.filter(item => item.id !== id));
    }
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

    // Filter out empty product items
    const validItems = productItems.filter(item => item.itemCode.trim() !== '');
    
    if (validItems.length === 0) {
      setError('Please add at least one product.');
      setIsLoading(false);
      return;
    }

    // Validate required fields for each item
    for (const item of validItems) {
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        setError(`Please enter a valid quantity for product ${item.itemCode || item.productName || 'item'}`);
        setIsLoading(false);
        return;
      }
      if (!item.mrp || parseFloat(item.mrp) <= 0) {
        setError(`Please enter a valid MRP for product ${item.itemCode || item.productName || 'item'}`);
        setIsLoading(false);
        return;
      }
      if (!item.sellRate || parseFloat(item.sellRate) <= 0) {
        setError(`Please enter a valid selling rate for product ${item.itemCode || item.productName || 'item'}`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const transactionData = {
        supplierName: formData.supplierName.trim(),
        phone: formData.phone.trim() || null,
        products: validItems.map(item => ({
          itemCode: item.itemCode.trim(),
          productName: item.productName,
          skuCode: item.skuCode,
          category: item.category,
          quantity: parseFloat(item.quantity),
          mrp: parseFloat(item.mrp),
          sellRate: parseFloat(item.sellRate)
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
        <div className="nav-item" onClick={() => onNavigate && onNavigate('dashboard')}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
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
            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Supplier Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Supplier details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="supplierName">Supplier Name</label>
                      <div className="input-wrapper">
                        <i className="fas fa-building input-icon"></i>
                        <input
                          type="text"
                          id="supplierName"
                          name="supplierName"
                          className="form-input"
                          placeholder="Enter supplier name."
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
                          placeholder="Enter phone number."
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Section */}
                <div className="form-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className="section-title">Products</h3>
                    <button 
                      type="button" 
                      onClick={addProductItem}
                      style={{
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-plus"></i> Add Product
                    </button>
                  </div>

                  {productItems.map((item, index) => (
                    <div key={item.id} style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '20px', 
                      marginBottom: '20px',
                      background: '#fafafa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: '#333', fontSize: '16px' }}>Product {index + 1}</h4>
                        {productItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProductItem(item.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fas fa-trash"></i> Remove
                          </button>
                        )}
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor={`itemCode-${item.id}`}>Item Code</label>
                          <div className="input-wrapper">
                            <i className="fas fa-barcode input-icon"></i>
                            <input
                              type="text"
                              id={`itemCode-${item.id}`}
                              className="form-input"
                              placeholder="Enter item code and press Enter"
                              value={item.itemCode}
                              onChange={(e) => handleProductItemChange(item.id, 'itemCode', e.target.value)}
                              onKeyPress={(e) => handleItemCodeKeyPress(e, item.id)}
                              disabled={item.isFetching}
                            />
                            {item.isFetching && (
                              <i className="fas fa-spinner fa-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}></i>
                            )}
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`productName-${item.id}`}>Product Name</label>
                          <input
                            type="text"
                            id={`productName-${item.id}`}
                            className="form-input"
                            placeholder="Product name"
                            value={item.productName}
                            readOnly
                            style={{ background: '#f5f5f5' }}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`quantity-${item.id}`}>Quantity</label>
                          <div className="input-wrapper">
                            <i className="fas fa-cube input-icon"></i>
                            <input
                              type="number"
                              id={`quantity-${item.id}`}
                              className="form-input"
                              placeholder="Enter quantity"
                              value={item.quantity}
                              onChange={(e) => handleProductItemChange(item.id, 'quantity', e.target.value)}
                              min="1"
                              step="1"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`mrp-${item.id}`}>MRP</label>
                          <div className="input-wrapper">
                            <i className="fas fa-rupee-sign input-icon"></i>
                            <input
                              type="number"
                              id={`mrp-${item.id}`}
                              className="form-input"
                              placeholder="Enter MRP"
                              value={item.mrp}
                              onChange={(e) => handleProductItemChange(item.id, 'mrp', e.target.value)}
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`sellRate-${item.id}`}>Selling Rate</label>
                          <div className="input-wrapper">
                            <i className="fas fa-tag input-icon"></i>
                            <input
                              type="number"
                              id={`sellRate-${item.id}`}
                              className="form-input"
                              placeholder="Enter selling rate"
                              value={item.sellRate}
                              onChange={(e) => handleProductItemChange(item.id, 'sellRate', e.target.value)}
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warning Message */}
                <p className="form-warning">
                  Make sure all supplier and product details are correct before saving.
                </p>

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

