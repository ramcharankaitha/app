import React, { useState, useEffect } from 'react';
import { quotationsAPI, productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './addUser.css';

const AddQuotation = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerNumber: ''
  });
  
  // Product input fields
  const [currentProduct, setCurrentProduct] = useState({
    itemCode: '',
    productName: '',
    quantity: '',
    weight: '',
    price: '',
    gst: '',
    isFetching: false,
    productInfo: null
  });
  
  // Added products list
  const [addedProducts, setAddedProducts] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const weight = parseFloat(currentProduct.weight) || 0;
    const price = parseFloat(currentProduct.price) || 0;
    const gst = parseFloat(currentProduct.gst) || 0;
    const totalPrice = quantity * price;
    
    const newId = addedProducts.length > 0 
      ? Math.max(...addedProducts.map(p => p.id)) + 1 
      : 1;
    
    setAddedProducts(prev => [...prev, {
      id: newId,
      itemCode: currentProduct.itemCode.trim(),
      productName: currentProduct.productName,
      quantity: quantity,
      weight: weight,
      price: price,
      gst: gst,
      totalPrice: totalPrice
    }]);
    
    // Clear current product form
    setCurrentProduct({
      itemCode: '',
      productName: '',
      quantity: '',
      weight: '',
      price: '',
      gst: '',
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
    if (!formData.customerName || !formData.customerName.trim()) {
      setError('Customer name is required');
      setIsLoading(false);
      return;
    }

    if (!formData.customerNumber || !formData.customerNumber.trim()) {
      setError('Customer number is required');
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
    const userRoleFromStorage = localStorage.getItem('userRole') || userRole || 'staff';

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
            weight: p.weight || 0,
            price: p.price,
            gst: p.gst || 0,
            totalPrice: p.totalPrice
          }));

          const response = await quotationsAPI.create({
            items: items,
            customerName: formData.customerName.trim(),
            customerNumber: formData.customerNumber.trim(),
            totalPrice: totalPrice,
            createdBy: createdBy,
            userRole: userRoleFromStorage
          });

          if (response.success) {
            setFormData({
              customerName: '',
              customerNumber: ''
            });
            setCurrentProduct({
              itemCode: '',
              productName: '',
              quantity: '',
              weight: '',
              price: '',
              gst: '',
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
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <form onSubmit={(e) => { e.preventDefault(); submitQuotation(); }} className="add-user-form add-quotation-form">
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
            {/* Row 1: Customer Name, Customer Number, Item Code, Product Name */}
            <div className="form-grid four-col">
              <div className="form-group">
                <label htmlFor="customerName">Customer Name *</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    className="form-input"
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="customerNumber">Customer Number *</label>
                <div className="input-wrapper">
                  <i className="fas fa-phone input-icon"></i>
                  <input
                    type="tel"
                    id="customerNumber"
                    name="customerNumber"
                    className="form-input"
                    placeholder="Enter customer number"
                    value={formData.customerNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

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
            </div>

            {/* Row 2: Quantity, Weight, Price, GST (optional) */}
            <div className="form-grid four-col" style={{ marginTop: '12px' }}>
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

              <div className="form-group">
                <label htmlFor="weight">Weight</label>
                <div className="input-wrapper">
                  <i className="fas fa-weight input-icon"></i>
                  <input
                    type="number"
                    id="weight"
                    className="form-input"
                    placeholder="Enter weight"
                    value={currentProduct.weight}
                    onChange={(e) => handleProductChange('weight', e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={!currentProduct.productInfo}
                  />
                </div>
              </div>

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

              <div className="form-group">
                <label htmlFor="gst">GST (Optional)</label>
                <div className="input-wrapper">
                  <i className="fas fa-percent input-icon"></i>
                  <input
                    type="number"
                    id="gst"
                    className="form-input"
                    placeholder="Enter GST %"
                    value={currentProduct.gst}
                    onChange={(e) => handleProductChange('gst', e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={!currentProduct.productInfo}
                  />
                </div>
              </div>
            </div>

            {/* Add Product Button */}
            <div className="form-group" style={{ marginTop: '12px' }}>
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

            {/* Product Summary Section - Stock In style */}
            {addedProducts.length > 0 && (
              <div className="product-summary-section" style={{ 
                marginTop: '30px', 
                clear: 'both', 
                paddingTop: '20px', 
                marginBottom: '20px',
                paddingBottom: '20px',
                width: '100%',
                display: 'block'
              }}>
                <div style={{ width: '100%', marginBottom: '0' }}>
                  <div style={{ 
                    width: '100%',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#fff'
                  }}>
                    {/* Scrollable Product Table */}
                    <div className="attendance-table-container" style={{ 
                      marginTop: '0', 
                      overflowX: 'auto',
                      width: '100%',
                      paddingRight: '8px'
                    }}>
                      <table className="attendance-table" style={{ width: '100%', tableLayout: 'auto' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                            <th>ITEM CODE</th>
                            <th>ITEM NAME</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>QTY</th>
                            <th style={{ width: '120px', textAlign: 'center' }}>UNIT PRICE</th>
                            <th style={{ width: '150px', textAlign: 'center' }}>TOTAL PRICE</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
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
                              <td style={{ textAlign: 'center', color: '#28a745', fontWeight: '600' }}>
                                {product.quantity}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: '500', color: '#333' }}>
                                ₹{parseFloat(product.price || 0).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: '#0066cc' }}>
                                ₹{parseFloat(product.totalPrice || 0).toFixed(2)}
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

                    {/* Total Amount Row - Always Visible at Bottom of Card */}
                    <div style={{ 
                      background: '#f8f9fa', 
                      borderTop: '2px solid #dc3545',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: 'bold'
                    }}>
                      <div style={{ flex: 1, textAlign: 'right', color: '#333', marginRight: '20px', fontSize: '16px' }}>
                        TOTAL AMOUNT:
                      </div>
                      <div style={{ 
                        textAlign: 'center',
                        color: '#dc3545',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        minWidth: '150px'
                      }}>
                        ₹{calculateTotalAmount().toFixed(2)}
                      </div>
                      <div style={{ minWidth: '100px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-actions" style={{ ...(isMobile ? {} : { position: 'static' }), marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button
              type="submit"
              disabled={isLoading || !formData.customerName || !formData.customerNumber || addedProducts.length === 0}
              className="submit-btn"
              style={{
                width: '200px',
                margin: '0 auto',
                padding: '12px 24px',
                background: (isLoading || !formData.customerName || !formData.customerNumber || addedProducts.length === 0) ? '#ccc' : '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (isLoading || !formData.customerName || !formData.customerNumber || addedProducts.length === 0) ? 'not-allowed' : 'pointer',
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
