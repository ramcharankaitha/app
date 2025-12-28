import React, { useState } from 'react';
import { stockAPI, productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const StockIn = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    category: '',
    itemCode: '',
    productName: '',
    skuCode: '',
    modelNumber: '',
    quantity: '', // Current stock in store (display only)
    stockInQuantity: '', // New quantity to add
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
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('stockInMaster');
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
        stockInQuantity: ''
      }));
      setError('');
      setSuccessMessage('');
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
        
        setSuccessMessage('Product found! Enter stock in quantity.');
        setTimeout(() => setSuccessMessage(''), 3000);
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

    if (!formData.stockInQuantity || parseFloat(formData.stockInQuantity) <= 0) {
      setError('Please enter a valid stock in quantity (greater than 0)');
      return;
    }

    if (!productInfo) {
      setError('Please fetch product details first by pressing Enter on item code field');
      return;
    }

    const quantity = parseInt(formData.stockInQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Stock in quantity must be a positive number');
      return;
    }

    const confirmMessage = `Add ${quantity} units to ${productInfo.productName}?\n\nCurrent Stock: ${productInfo.currentQuantity}\nNew Stock: ${productInfo.currentQuantity + quantity}`;
    
    setConfirmState({
      open: true,
      message: confirmMessage,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
          const createdBy = getUserIdentifier();
          const response = await stockAPI.stockIn(
            formData.itemCode.trim(),
            quantity,
            formData.notes || null,
            createdBy
          );
          
          if (response.success) {
            const newQuantity = response.product.newQuantity;
            setSuccessMessage(`Stock added successfully! New quantity: ${newQuantity}`);
            
            // Update product info
            setProductInfo(prev => ({
              ...prev,
              currentQuantity: newQuantity
            }));
            
            // Update form data with new quantity and reset stock in quantity
            setFormData(prev => ({
              ...prev,
              quantity: newQuantity.toString(),
              stockInQuantity: '',
              notes: ''
            }));
            
            setTimeout(() => {
              setSuccessMessage('');
            }, 5000);
          }
        } catch (err) {
          console.error('Stock In error:', err);
          setError(err.message || 'Failed to add stock. Please try again.');
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
          <h1 className="add-user-title">Stock In</h1>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => onNavigate && onNavigate('dashboard')}>
            <i className="fas fa-home"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <form onSubmit={handleSubmit} className="add-user-form add-stock-in-form">
          {/* All fields in 3-column grid without section titles */}
          <div className="form-section">
            <div className="form-grid three-col">
              {/* Row 1: Item Code, Category, Product Name */}
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
                    style={{ paddingRight: isFetchingProduct ? '40px' : '50px' }}
                  />
                  {isFetchingProduct ? (
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
                        padding: '6px 8px',
                        width: '32px',
                        height: '32px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Fetch Product"
                    >
                      <i className="fas fa-search"></i>
                    </button>
                  )}
                </div>
              </div>

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

              {/* Row 2: SKV Code, Model Number, Quantity in the Store */}
              <div className="form-group">
                <label htmlFor="skuCode">SKV Code</label>
                <div className="input-wrapper">
                  <i className="fas fa-boxes input-icon"></i>
                  <input
                    type="text"
                    id="skuCode"
                    name="skuCode"
                    className="form-input"
                    placeholder="SKV Code"
                    value={formData.skuCode}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

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

              <div className="form-group">
                <label htmlFor="quantity">Quantity in the Store</label>
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

              {/* Row 3: Stock In Quantity - Same row as Fetch Product button (below SKV Code) */}
              <div className="form-group">
                <label htmlFor="stockInQuantity">Stock In Quantity *</label>
                <div className="input-wrapper">
                  <i className="fas fa-plus-circle input-icon"></i>
                  <input
                    type="number"
                    id="stockInQuantity"
                    name="stockInQuantity"
                    className="form-input"
                    placeholder="Enter quantity to add"
                    value={formData.stockInQuantity}
                    onChange={handleInputChange}
                    min="1"
                    step="1"
                    required
                    disabled={!productInfo}
                  />
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

          {/* Stock In Button - Centered below in the middle */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginTop: '20px'
          }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !productInfo || !formData.stockInQuantity}
              style={{
                width: '200px',
                maxWidth: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Adding Stock...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Stock In
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default StockIn;
