import React, { useState, useEffect } from 'react';
import { quotationsAPI, productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './addUser.css';

const AddQuotation = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    gstNumber: '',
    quotationDate: new Date().toISOString().split('T')[0]
  });
  
  // Product input fields
  const [currentProduct, setCurrentProduct] = useState({
    itemCode: '',
    productName: '',
    quantity: '',
    price: '',
    isFetching: false,
    productInfo: null
  });
  
  // Added products list
  const [addedProducts, setAddedProducts] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('quotationMaster');
    } else if (onBack) {
      onBack();
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('quotationMaster');
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

  // Handle product input changes
  const handleProductChange = (field, value) => {
    setCurrentProduct(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset product info if item code changes
      if (field === 'itemCode') {
        updated.productInfo = null;
        updated.productName = '';
        updated.price = '';
      }
      
      return updated;
    });
  };

  // Fetch product by item code
  const fetchProductByItemCode = async () => {
    if (!currentProduct.itemCode?.trim()) {
      setError('Please enter an item code');
      return;
    }
    
    setCurrentProduct(prev => ({ ...prev, isFetching: true }));
    setError('');
    
    try {
      const response = await productsAPI.getByItemCode(currentProduct.itemCode.trim());
      
      if (response.success && response.product) {
        const product = response.product;
        const productData = {
          id: product.id,
          productName: product.product_name || product.productName || '',
          itemCode: product.item_code || product.itemCode || '',
          mrp: product.mrp || 0,
          sellRate: product.sell_rate || product.sellRate || 0
        };
        
        setCurrentProduct(prev => ({
          ...prev,
          productInfo: productData,
          productName: productData.productName,
          price: (productData.sellRate > 0 ? productData.sellRate : productData.mrp).toString(),
          isFetching: false
        }));
      } else {
        setError('Product not found with this item code');
        setCurrentProduct(prev => ({ 
          ...prev, 
          productInfo: null, 
          productName: '',
          price: '',
          isFetching: false 
        }));
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError('Product not found. Please check the item code and try again.');
      setCurrentProduct(prev => ({ 
        ...prev, 
        productInfo: null, 
        productName: '',
        price: '',
        isFetching: false 
      }));
    }
  };

  const handleItemCodeKeyPress = async (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      await fetchProductByItemCode();
    }
  };

  // Add product to list
  const addProduct = () => {
    if (!currentProduct.productInfo) {
      setError('Please fetch product first');
      return;
    }
    
    if (!currentProduct.quantity || parseFloat(currentProduct.quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    
    if (!currentProduct.price || parseFloat(currentProduct.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    // Check for duplicate item codes - silently skip if duplicate
    const isDuplicate = addedProducts.some(p => 
      p.itemCode && p.itemCode.trim() === currentProduct.itemCode.trim()
    );
    
    if (isDuplicate) {
      // Silently skip duplicate products without showing error
      return;
    }
    
    const quantity = parseFloat(currentProduct.quantity) || 0;
    const price = parseFloat(currentProduct.price) || 0;
    const totalPrice = quantity * price;
    
    const newId = addedProducts.length > 0 
      ? Math.max(...addedProducts.map(p => p.id)) + 1 
      : 1;
    
    setAddedProducts(prev => [...prev, {
      id: newId,
      itemCode: currentProduct.itemCode.trim(),
      productName: currentProduct.productName,
      quantity: quantity,
      price: price,
      totalPrice: totalPrice
    }]);
    
    // Clear current product form
    setCurrentProduct({
      itemCode: '',
      productName: '',
      quantity: '',
      price: '',
      isFetching: false,
      productInfo: null
    });
    setError('');
  };

  // Remove product from list
  const removeProduct = (productId) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Calculate total amount from added products
  const calculateTotalAmount = () => {
    return addedProducts.reduce((total, product) => {
      return total + (parseFloat(product.totalPrice) || 0);
    }, 0);
  };

  const submitQuotation = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // Validation
    if (!formData.gstNumber || !formData.gstNumber.trim()) {
      setError('GST number is required');
      setIsLoading(false);
      return;
    }

    if (!formData.quotationDate) {
      setError('Date of quotation is required');
      setIsLoading(false);
      return;
    }

    if (addedProducts.length === 0) {
      setError('Please add at least one product');
      setIsLoading(false);
      return;
    }

    const totalPrice = calculateTotalAmount();

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

    const createdBy = getUserIdentifier();

    const confirmMessage = `Create quotation with ${addedProducts.length} product(s) and Total Price: ₹${totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}?`;
    
    setConfirmState({
      open: true,
      message: confirmMessage,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
          // Create quotation with items array
          const items = addedProducts.map(p => ({
            itemCode: p.itemCode,
            productName: p.productName,
            quantity: p.quantity,
            price: p.price,
            totalPrice: p.totalPrice
          }));

          const response = await quotationsAPI.create({
            items: items,
            gstNumber: formData.gstNumber.trim(),
            quotationDate: formData.quotationDate,
            totalPrice: totalPrice,
            createdBy: createdBy
          });

          if (response.success) {
            setFormData({
              gstNumber: '',
              quotationDate: new Date().toISOString().split('T')[0]
            });
            setCurrentProduct({
              itemCode: '',
              productName: '',
              quantity: '',
              price: '',
              isFetching: false,
              productInfo: null
            });
            setAddedProducts([]);
            setSuccessMessage('Quotation created successfully!');
            setTimeout(() => {
              setSuccessMessage('');
              handleCancel();
            }, 2000);
          } else {
            setError(response.error || 'Failed to create quotation');
          }
        } catch (err) {
          console.error('Create quotation error:', err);
          setError(err.message || 'Failed to create quotation. Please try again.');
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
          <h1 className="add-user-title">Add Quotation</h1>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => onNavigate && onNavigate('dashboard')}>
            <i className="fas fa-home"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <form onSubmit={(e) => { e.preventDefault(); submitQuotation(); }} className="add-user-form">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <i className="fas fa-check-circle"></i> {successMessage}
            </div>
          )}

          <div className="form-section">
            <div className="form-grid four-col">
              {/* Row 1: Item Code, Product Name, Quantity, Price */}
              <div className="form-group" style={{ position: 'relative' }}>
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
                    style={{ paddingRight: currentProduct.isFetching ? '40px' : '50px' }}
                    autoFocus
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

              {/* Product Name */}
              <div className="form-group">
                <label htmlFor="productName">Product Name</label>
                <div className="input-wrapper">
                  <i className="fas fa-box input-icon"></i>
                  <input
                    type="text"
                    id="productName"
                    className="form-input"
                    placeholder="Product Name (auto-filled)"
                    value={currentProduct.productName}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <div className="input-wrapper">
                  <i className="fas fa-boxes input-icon"></i>
                  <input
                    type="number"
                    id="quantity"
                    className="form-input"
                    placeholder="Enter quantity"
                    value={currentProduct.quantity}
                    onChange={(e) => handleProductChange('quantity', e.target.value)}
                    min="1"
                    step="1"
                    disabled={!currentProduct.productInfo}
                  />
                </div>
              </div>

              {/* Price */}
              <div className="form-group">
                <label htmlFor="price">Price (Rs) *</label>
                <div className="input-wrapper">
                  <i className="fas fa-rupee-sign input-icon"></i>
                  <input
                    type="number"
                    id="price"
                    className="form-input"
                    placeholder="Enter price"
                    value={currentProduct.price}
                    onChange={(e) => handleProductChange('price', e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={!currentProduct.productInfo}
                  />
                </div>
              </div>

              {/* Row 2: GST Number, Date of Quotation, Add Product Button */}
              <div className="form-group">
                <label htmlFor="gstNumber">GST Number *</label>
                <div className="input-wrapper">
                  <i className="fas fa-file-invoice input-icon"></i>
                  <input
                    type="text"
                    id="gstNumber"
                    name="gstNumber"
                    className="form-input"
                    placeholder="Enter GST number"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="quotationDate">Date of Quotation *</label>
                <div className="input-wrapper">
                  <i className="fas fa-calendar-alt input-icon"></i>
                  <input
                    type="date"
                    id="quotationDate"
                    name="quotationDate"
                    className="form-input"
                    value={formData.quotationDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Add Product Button */}
              <div className="form-group">
                <label>&nbsp;</label>
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={!currentProduct.productInfo || !currentProduct.quantity || !currentProduct.price || parseFloat(currentProduct.quantity) <= 0 || parseFloat(currentProduct.price) <= 0}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: (currentProduct.productInfo && currentProduct.quantity && currentProduct.price && parseFloat(currentProduct.quantity) > 0 && parseFloat(currentProduct.price) > 0) ? '#dc3545' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (currentProduct.productInfo && currentProduct.quantity && currentProduct.price && parseFloat(currentProduct.quantity) > 0 && parseFloat(currentProduct.price) > 0) ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentProduct.productInfo && currentProduct.quantity && currentProduct.price && parseFloat(currentProduct.quantity) > 0 && parseFloat(currentProduct.price) > 0) {
                      e.target.style.background = '#c82333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentProduct.productInfo && currentProduct.quantity && currentProduct.price && parseFloat(currentProduct.quantity) > 0 && parseFloat(currentProduct.price) > 0) {
                      e.target.style.background = '#dc3545';
                    }
                  }}
                >
                  <i className="fas fa-plus"></i>
                  Add Product
                </button>
              </div>
            </div>
          </div>

          {/* Product Summary Section */}
          {addedProducts.length > 0 && (
            <div className="form-section" style={{ 
              clear: 'both', 
              marginTop: '15px', 
              marginBottom: '15px',
              paddingTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%'
            }}>
              {/* Product List Container */}
              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '0', width: '100%' }}>
                <div className="attendance-table-container" style={{ 
                  marginTop: '0', 
                  maxHeight: '250px', 
                  overflowY: 'auto', 
                  marginBottom: '0',
                  width: '100%'
                }}>
                  <table className="attendance-table" style={{ width: '100%' }}>
                    <tbody>
                      {addedProducts.map((product, index) => (
                        <tr key={product.id}>
                          <td style={{ textAlign: 'center', color: '#666', fontWeight: '500' }}>
                            {index + 1}
                          </td>
                          <td style={{ fontWeight: '500', color: '#333' }}>
                            {product.itemCode}
                          </td>
                          <td style={{ fontWeight: '500', color: '#333' }}>
                            {product.productName}
                          </td>
                          <td style={{ textAlign: 'center', color: '#666' }}>
                            {product.quantity}
                          </td>
                          <td style={{ textAlign: 'right', color: '#666' }}>
                            ₹{parseFloat(product.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '600', color: '#28a745' }}>
                            ₹{parseFloat(product.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => removeProduct(product.id)}
                              style={{
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#c82333';
                                e.target.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#dc3545';
                                e.target.style.transform = 'scale(1)';
                              }}
                              title="Remove this product"
                            >
                              <i className="fas fa-trash"></i>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Amount Summary Container */}
              <div className="form-group" style={{ 
                gridColumn: '1 / -1', 
                marginTop: '0',
                marginBottom: '0',
                width: '100%',
                paddingTop: '10px',
                borderTop: '2px solid #e9ecef'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '10px 16px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: '#333'
                  }}>
                    Total Amount:
                  </span>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: '#28a745',
                    minWidth: '120px',
                    textAlign: 'right'
                  }}>
                    ₹{calculateTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-actions" style={{ marginTop: '10px' }}>
            <button
              type="submit"
              disabled={isLoading || !formData.gstNumber || !formData.quotationDate || addedProducts.length === 0}
              className="submit-btn"
              style={{
                width: '200px',
                margin: '0 auto',
                padding: '12px 24px',
                background: (isLoading || !formData.gstNumber || !formData.quotationDate || addedProducts.length === 0) ? '#ccc' : '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (isLoading || !formData.gstNumber || !formData.quotationDate || addedProducts.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-file-invoice"></i>
                  Create Quotation
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddQuotation;

