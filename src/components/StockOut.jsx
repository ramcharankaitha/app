import React, { useState } from 'react';
import { stockAPI, productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const StockOut = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    itemCode: '',
    quantity: '',
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
      onNavigate('dashboard');
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
      setError('');
      setSuccessMessage('');
    }

    // Validate quantity if product info is available
    if (name === 'quantity' && productInfo) {
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
        setProductInfo({
          id: product.id,
          productName: product.product_name || product.productName || '',
          itemCode: product.item_code || product.itemCode || '',
          skuCode: product.sku_code || product.skuCode || '',
          currentQuantity: product.current_quantity || 0,
          category: product.category || ''
        });
        
        if (product.current_quantity <= 0) {
          setError('This product is out of stock!');
        } else {
          setSuccessMessage('Product found! Enter quantity to remove stock.');
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

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Please enter a valid quantity (greater than 0)');
      return;
    }

    if (!productInfo) {
      setError('Please fetch product details first by pressing Enter on item code field');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Quantity must be a positive number');
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
            setSuccessMessage(`Stock removed successfully! New quantity: ${response.product.newQuantity}`);
            
            // Update product info
            setProductInfo(prev => ({
              ...prev,
              currentQuantity: response.product.newQuantity
            }));
            
            // Reset form
            setFormData({
              itemCode: formData.itemCode, // Keep item code
              quantity: '',
              notes: ''
            });
            
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
          <button className="header-btn" onClick={() => onNavigate && onNavigate('dashboard')}>
            <i className="fas fa-home"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <form onSubmit={handleSubmit} className="add-user-form">
          {/* Stock Out Details Section */}
          <div className="form-section">
            <h3 className="section-title">Remove Stock</h3>
            <div className="form-grid">
              {/* Item Code */}
              <div className="form-group">
                <label htmlFor="itemCode">Item Code *</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <i className="fas fa-barcode input-icon"></i>
                  <input
                    type="text"
                    id="itemCode"
                    name="itemCode"
                    className="form-input"
                    placeholder="Enter item code and press Enter"
                    value={formData.itemCode}
                    onChange={handleInputChange}
                    onKeyPress={handleItemCodeKeyPress}
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

              {/* Product Info Display */}
              {productInfo && (
                <div className="form-group full-width" style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>Product Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <strong>Product Name:</strong> {productInfo.productName}
                    </div>
                    <div>
                      <strong>Item Code:</strong> {productInfo.itemCode}
                    </div>
                    <div>
                      <strong>SKU Code:</strong> {productInfo.skuCode || 'N/A'}
                    </div>
                    <div>
                      <strong>Category:</strong> {productInfo.category || 'N/A'}
                    </div>
                    <div style={{ 
                      gridColumn: '1 / -1',
                      padding: '12px',
                      background: productInfo.currentQuantity <= 0 ? '#f8d7da' : 
                                  productInfo.currentQuantity <= 10 ? '#fff3cd' : '#d1ecf1',
                      borderRadius: '6px',
                      border: `2px solid ${
                        productInfo.currentQuantity <= 0 ? '#dc3545' : 
                        productInfo.currentQuantity <= 10 ? '#ffc107' : '#0dcaf0'
                      }`
                    }}>
                      <strong style={{ fontSize: '16px', color: '#495057' }}>
                        Current Stock: <span style={{ 
                          color: productInfo.currentQuantity <= 0 ? '#dc3545' : 
                                 productInfo.currentQuantity <= 10 ? '#856404' : '#28a745',
                          fontSize: '18px'
                        }}>{productInfo.currentQuantity}</span>
                      </strong>
                      {productInfo.currentQuantity <= 0 && (
                        <div style={{ marginTop: '8px', color: '#721c24', fontSize: '14px' }}>
                          <i className="fas fa-exclamation-triangle"></i> Out of Stock!
                        </div>
                      )}
                      {productInfo.currentQuantity > 0 && productInfo.currentQuantity <= 10 && (
                        <div style={{ marginTop: '8px', color: '#856404', fontSize: '14px' }}>
                          <i className="fas fa-exclamation-triangle"></i> Low Stock Warning!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="form-group">
                <label htmlFor="quantity">Quantity to Remove *</label>
                <div className="input-wrapper">
                  <i className="fas fa-minus-circle input-icon"></i>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    className="form-input"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    max={productInfo ? productInfo.currentQuantity : undefined}
                    step="1"
                    required
                  />
                </div>
                {productInfo && formData.quantity && !isNaN(parseInt(formData.quantity)) && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    background: parseInt(formData.quantity) > productInfo.currentQuantity ? '#f8d7da' : '#d4edda', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: parseInt(formData.quantity) > productInfo.currentQuantity ? '#721c24' : '#155724'
                  }}>
                    <i className={`fas ${parseInt(formData.quantity) > productInfo.currentQuantity ? 'fa-exclamation-triangle' : 'fa-info-circle'}`} style={{ marginRight: '6px' }}></i>
                    {parseInt(formData.quantity) > productInfo.currentQuantity ? (
                      <strong>Insufficient stock!</strong>
                    ) : (
                      <>New stock will be: <strong>{productInfo.currentQuantity - parseInt(formData.quantity)}</strong></>
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
                    placeholder="Add any notes about this stock removal (e.g., reason, damage, return, etc.)..."
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
            Make sure all details are correct before removing stock. This action cannot be undone.
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
              disabled={isLoading || !productInfo || (productInfo && productInfo.currentQuantity <= 0)}
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
