import React, { useState } from 'react';
import { stockAPI, productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const StockOut = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    category: '',
    itemCode: '',
    productName: '',
    skuCode: '',
    modelNumber: '',
    quantity: '', // Current stock in store (display only)
    stockOutQuantity: '', // New quantity to remove
    notes: ''
  });
  const [productInfo, setProductInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const getUserIdentifier = () => {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        return userData.username || userData.email || userData.full_name || 'system';
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    }
    return 'system';
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('stockOutMaster');
    } else if (onBack) {
      onBack();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset product info if item code changes
    if (name === 'itemCode') {
      setProductInfo(null);
      setFormData(prev => ({
        ...prev,
        category: '',
        productName: '',
        skuCode: '',
        modelNumber: '',
        quantity: '',
        stockOutQuantity: ''
      }));
      setError('');
      setSuccessMessage('');
    }

    // Validate quantity if product info is available
    if (name === 'stockOutQuantity' && productInfo) {
      const qty = parseInt(value);
      if (!isNaN(qty) && qty > productInfo.currentQuantity) {
        setError(`Insufficient stock! Available: ${productInfo.currentQuantity}, Requested: ${qty}`);
      } else if (!isNaN(qty) && qty <= 0) {
        setError('Quantity must be greater than 0');
      } else {
        setError('');
      }
    }
  };

  // Auto-fetch product when item code is entered and loses focus
  const handleItemCodeBlur = async () => {
    if (formData.itemCode && formData.itemCode.trim() && !productInfo) {
      await fetchProductByItemCode();
    }
  };

  const handleItemCodeKeyPress = async (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      await fetchProductByItemCode();
    }
  };

  const fetchProductByItemCode = async () => {
    const itemCode = formData.itemCode?.trim();
    if (!itemCode) {
      setError('Please enter an item code');
      return;
    }
    
    setIsFetchingProduct(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await productsAPI.getByItemCode(itemCode);
      
      if (response.success && response.product) {
        const product = response.product;
        const productData = {
          id: product.id,
          productName: product.product_name || product.productName || '',
          itemCode: product.item_code || product.itemCode || '',
          skuCode: product.sku_code || product.skuCode || '',
          currentQuantity: product.current_quantity || 0,
          category: product.category || '',
          modelNumber: product.model_number || product.modelNumber || ''
        };
        setProductInfo(productData);
        
        // Auto-populate form fields
        setFormData(prev => ({
          ...prev,
          category: productData.category || '',
          productName: productData.productName,
          skuCode: productData.skuCode || '',
          modelNumber: productData.modelNumber || '',
          quantity: productData.currentQuantity.toString()
        }));
        
        if (product.current_quantity <= 0) {
          setError('This product is out of stock!');
        } else {
          setSuccessMessage('Product found! Enter stock out quantity.');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else {
        setError('Product not found with this item code');
        setProductInfo(null);
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err.message || 'Product not found. Please check the item code and try again.');
      setProductInfo(null);
    } finally {
      setIsFetchingProduct(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.itemCode || !formData.itemCode.trim()) {
      setError('Please enter an item code');
      return;
    }

    if (!formData.stockOutQuantity || parseFloat(formData.stockOutQuantity) <= 0) {
      setError('Please enter a valid stock out quantity (greater than 0)');
      return;
    }

    if (!productInfo) {
      setError('Please fetch product details first by pressing Enter on item code field');
      return;
    }

    const quantity = parseInt(formData.stockOutQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Stock out quantity must be a positive number');
      return;
    }

    if (quantity > productInfo.currentQuantity) {
      setError(`Insufficient stock! Available: ${productInfo.currentQuantity}, Requested: ${quantity}`);
      return;
    }

    if (productInfo.currentQuantity <= 0) {
      setError('This product is out of stock!');
      return;
    }

    const confirmMessage = `Remove ${quantity} units from ${productInfo.productName}?\n\nCurrent Stock: ${productInfo.currentQuantity}\nNew Stock: ${productInfo.currentQuantity - quantity}`;
    
    setConfirmState({
      open: true,
      message: confirmMessage,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
          const createdBy = getUserIdentifier();
          const response = await stockAPI.stockOut(
            formData.itemCode.trim(),
            quantity,
            formData.notes || null,
            createdBy
          );
          
          if (response.success) {
            const newQuantity = response.product.newQuantity;
            setSuccessMessage(`Stock removed successfully! New quantity: ${newQuantity}`);
            
            // Update product info
            setProductInfo(prev => ({
              ...prev,
              currentQuantity: newQuantity
            }));
            
            // Update form data with new quantity and reset stock out quantity
            setFormData(prev => ({
              ...prev,
              quantity: newQuantity.toString(),
              stockOutQuantity: '',
              notes: ''
            }));
            
            setTimeout(() => {
              setSuccessMessage('');
            }, 5000);
          }
        } catch (err) {
          console.error('Stock Out error:', err);
          setError(err.message || 'Failed to remove stock. Please try again.');
        } finally {
          setIsLoading(false);
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="add-user-container">
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
      
      {/* Header */}
      <header className="add-user-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="add-user-title">Stock Out</h1>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => onNavigate && onNavigate('stockOutMaster')}>
            <i className="fas fa-home"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <form onSubmit={handleSubmit} className="add-user-form">
          {/* Stock Out Details Section */}
          <div className="form-section">
            <h3 className="section-title">Stock Out</h3>
            <div className="form-grid">
              {/* 1. Category */}
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <div className="input-wrapper">
                  <i className="fas fa-tags input-icon"></i>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    className="form-input"
                    placeholder="Category"
                    value={formData.category}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* 2. Item Code */}
              <div className="form-group">
                <label htmlFor="itemCode">Item Code *</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <i className="fas fa-barcode input-icon"></i>
                  <input
                    type="text"
                    id="itemCode"
                    name="itemCode"
                    className="form-input"
                    placeholder="Enter item code"
                    value={formData.itemCode}
                    onChange={handleInputChange}
                    onKeyPress={handleItemCodeKeyPress}
                    onBlur={handleItemCodeBlur}
                    required
                    autoFocus
                  />
                  {isFetchingProduct && (
                    <div style={{ 
                      position: 'absolute', 
                      right: '10px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#999'
                    }}>
                      <i className="fas fa-spinner fa-spin"></i>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchProductByItemCode}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <i className="fas fa-search" style={{ marginRight: '4px' }}></i>
                  Fetch Product
                </button>
              </div>

              {/* 3. Product Name */}
              <div className="form-group">
                <label htmlFor="productName">Product Name</label>
                <div className="input-wrapper">
                  <i className="fas fa-box input-icon"></i>
                  <input
                    type="text"
                    id="productName"
                    name="productName"
                    className="form-input"
                    placeholder="Product Name"
                    value={formData.productName}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* 4. SKU Code */}
              <div className="form-group">
                <label htmlFor="skuCode">SKU Code</label>
                <div className="input-wrapper">
                  <i className="fas fa-boxes input-icon"></i>
                  <input
                    type="text"
                    id="skuCode"
                    name="skuCode"
                    className="form-input"
                    placeholder="SKU Code"
                    value={formData.skuCode}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* 5. Model Number */}
              <div className="form-group">
                <label htmlFor="modelNumber">Model Number</label>
                <div className="input-wrapper">
                  <i className="fas fa-tag input-icon"></i>
                  <input
                    type="text"
                    id="modelNumber"
                    name="modelNumber"
                    className="form-input"
                    placeholder="Model Number"
                    value={formData.modelNumber}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* 6. Quantity (Current Stock in Store) */}
              <div className="form-group">
                <label htmlFor="quantity">Quantity (Current Stock in Store)</label>
                <div className="input-wrapper">
                  <i className="fas fa-warehouse input-icon"></i>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    className="form-input"
                    placeholder="Current Stock"
                    value={formData.quantity}
                    readOnly
                    style={{ 
                      background: formData.quantity && parseInt(formData.quantity) <= 0 ? '#fff3cd' : '#f8f9fa', 
                      cursor: 'not-allowed',
                      fontWeight: 'bold',
                      color: formData.quantity && parseInt(formData.quantity) <= 0 ? '#dc3545' : '#495057'
                    }}
                  />
                </div>
              </div>

              {/* 7. Stock Out Quantity */}
              <div className="form-group">
                <label htmlFor="stockOutQuantity">Stock Out Quantity *</label>
                <div className="input-wrapper">
                  <i className="fas fa-minus-circle input-icon"></i>
                  <input
                    type="number"
                    id="stockOutQuantity"
                    name="stockOutQuantity"
                    className="form-input"
                    placeholder="Enter quantity to remove"
                    value={formData.stockOutQuantity}
                    onChange={handleInputChange}
                    min="1"
                    max={productInfo ? productInfo.currentQuantity : undefined}
                    step="1"
                    required
                    disabled={!productInfo}
                  />
                </div>
                {productInfo && formData.stockOutQuantity && !isNaN(parseInt(formData.stockOutQuantity)) && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    background: parseInt(formData.stockOutQuantity) > productInfo.currentQuantity ? '#f8d7da' : '#d4edda', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: parseInt(formData.stockOutQuantity) > productInfo.currentQuantity ? '#721c24' : '#155724'
                  }}>
                    <i className={`fas ${parseInt(formData.stockOutQuantity) > productInfo.currentQuantity ? 'fa-exclamation-triangle' : 'fa-info-circle'}`} style={{ marginRight: '6px' }}></i>
                    {parseInt(formData.stockOutQuantity) > productInfo.currentQuantity ? (
                      <strong>Insufficient stock!</strong>
                    ) : (
                      <>New stock will be: <strong>{productInfo.currentQuantity - parseInt(formData.stockOutQuantity)}</strong></>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group full-width">
                <label htmlFor="notes">Notes (Optional)</label>
                <div className="input-wrapper">
                  <i className="fas fa-sticky-note input-icon"></i>
                  <textarea
                    id="notes"
                    name="notes"
                    className="form-input textarea-input"
                    placeholder="Add any notes about this stock removal..."
                    rows="3"
                    value={formData.notes}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <i className="fas fa-check-circle"></i> {successMessage}
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Warning Message */}
          <p className="form-warning">
            Make sure all details are correct before removing stock.
          </p>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBack}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !productInfo || !formData.stockOutQuantity}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Removing Stock...
                </>
              ) : (
                <>
                  <i className="fas fa-minus"></i> Remove Stock
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default StockOut;
