import React, { useState, useEffect } from 'react';
import { stockAPI, productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const StockIn = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    itemCode: '',
    productName: '',
    skuCode: '',
    quantity: '', // Current stock in store (display only)
    stockInQuantity: '', // New quantity to add
    minQuantity: '', // Minimum quantity from product
    mrp: '', // MRP from product
    totalAfterAdding: '', // Calculated total
    notes: ''
  });
  const [productInfo, setProductInfo] = useState(null);
  const [addedProducts, setAddedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        productName: '',
        skuCode: '',
        quantity: '',
        stockInQuantity: '',
        minQuantity: '',
        mrp: '',
        totalAfterAdding: ''
      }));
      setError('');
      setSuccessMessage('');
    }

    // Calculate total after adding when stockInQuantity changes
    if (name === 'stockInQuantity') {
      const currentQty = parseInt(formData.quantity) || 0;
      const newQty = parseInt(value) || 0;
      const total = currentQty + newQty;
      setFormData(prev => ({
        ...prev,
        stockInQuantity: value,
        totalAfterAdding: total.toString()
      }));
    }
  };

  const addProduct = () => {
    if (!formData.itemCode || !formData.itemCode.trim()) {
      return;
    }

    if (!productInfo) {
      return;
    }

    if (!formData.stockInQuantity || parseFloat(formData.stockInQuantity) <= 0) {
      return;
    }

    // Check if product already added - silently skip if duplicate
    const isDuplicate = addedProducts.some(p => p.itemCode === formData.itemCode.trim());
    if (isDuplicate) {
      return;
    }

    const newProduct = {
      id: Date.now(),
      itemCode: formData.itemCode.trim(),
      productName: formData.productName,
      skuCode: formData.skuCode,
      supplierName: formData.supplierName,
      currentQuantity: parseInt(formData.quantity) || 0,
      stockInQuantity: parseInt(formData.stockInQuantity),
      totalAfterAdding: parseInt(formData.totalAfterAdding) || 0,
      mrp: parseFloat(formData.mrp) || 0,
      amount: (parseInt(formData.stockInQuantity) || 0) * (parseFloat(formData.mrp) || 0),
      productInfo: productInfo
    };

    setAddedProducts(prev => [...prev, newProduct]);
    
    // Reset form fields for next product
    setFormData(prev => ({
      ...prev,
      itemCode: '',
      productName: '',
      skuCode: '',
      quantity: '',
      stockInQuantity: '',
      minQuantity: '',
      mrp: '',
      totalAfterAdding: ''
    }));
    setProductInfo(null);
    setError('');
    setSuccessMessage('');
  };

  const removeProduct = (id) => {
    setAddedProducts(prev => prev.filter(p => p.id !== id));
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
          minQuantity: product.min_quantity || product.minQuantity || 0,
          mrp: product.mrp || 0
        };
        setProductInfo(productData);
        
        // Auto-populate form fields
        const currentQty = productData.currentQuantity;
        const stockInQty = parseInt(formData.stockInQuantity) || 0;
        const totalAfter = currentQty + stockInQty;
        
        setFormData(prev => ({
          ...prev,
          productName: productData.productName,
          skuCode: productData.skuCode || '',
          quantity: currentQty.toString(),
          minQuantity: productData.minQuantity.toString(),
          mrp: productData.mrp.toString(),
          totalAfterAdding: totalAfter.toString()
        }));
        
        setSuccessMessage('');
      } else {
        setProductInfo(null);
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setProductInfo(null);
    } finally {
      setIsFetchingProduct(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Check if products are added - this should never happen if button is disabled correctly
    if (!addedProducts || addedProducts.length === 0) {
      setError('Please add at least one product to the summary before creating stock in.');
      return;
    }

    // Validate each product has required fields
    const invalidProducts = addedProducts.filter(p => 
      !p.itemCode || !p.itemCode.trim() || 
      !p.stockInQuantity || parseFloat(p.stockInQuantity) <= 0
    );
    
    if (invalidProducts.length > 0) {
      setError('Some products in the summary are missing required fields. Please remove and re-add them.');
      return;
    }

    const confirmMessage = `Add stock for ${addedProducts.length} product(s)?\n\n${addedProducts.map((p, i) => `${i + 1}. ${p.productName} (+${p.stockInQuantity})`).join('\n')}`;
    
    setConfirmState({
      open: true,
      message: confirmMessage,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
          const createdBy = getUserIdentifier();
          const promises = addedProducts.map(product =>
            stockAPI.stockIn(
              product.itemCode,
              product.stockInQuantity,
              formData.supplierName ? `Supplier: ${formData.supplierName}` : null,
              createdBy
            )
          );

          const results = await Promise.all(promises);
          const allSuccess = results.every(result => result.success);

          if (allSuccess) {
            setError('');
            const productCount = addedProducts.length;
            // Reset form
            setFormData({
              supplierName: '',
              itemCode: '',
              productName: '',
              skuCode: '',
              quantity: '',
              stockInQuantity: '',
              minQuantity: '',
              mrp: '',
              totalAfterAdding: '',
              notes: ''
            });
            setProductInfo(null);
            setAddedProducts([]);
            setSuccessMessage(`Successfully added stock for ${productCount} product(s)!`);
            setTimeout(() => {
              setSuccessMessage('');
              // Navigate back after showing success message
              handleBack();
            }, 2000);
          } else {
            setError('Some products failed to add. Please try again.');
          }
        } catch (err) {
          console.error('Stock In error:', err);
          setError('An error occurred while adding stock. Please try again.');
        } finally {
          setIsLoading(false);
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="add-user-container stock-in-container">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        {/* Error and Success Messages */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div style={{
            padding: '12px 16px',
            background: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-check-circle"></i>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-user-form add-stock-in-form" noValidate>
          {/* Form Fields */}
          <div className="form-section">
            {/* First Row: Item Code, SKU Code, Product Name, Supplier Name */}
            <div className="form-grid four-col">
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

              <div className="form-group">
                <label htmlFor="supplierName">Supplier Name</label>
                <div className="input-wrapper">
                  <i className="fas fa-truck input-icon"></i>
                  <input
                    type="text"
                    id="supplierName"
                    name="supplierName"
                    className="form-input"
                    placeholder="Enter supplier name"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Second Row: Quantity to Add, Min Quantity, Current Stock, MRP */}
            <div className="form-grid four-col" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label htmlFor="stockInQuantity">Quantity to Add *</label>
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
                    disabled={!productInfo}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="minQuantity">Min Quantity</label>
                <div className="input-wrapper">
                  <i className="fas fa-exclamation-triangle input-icon"></i>
                  <input
                    type="number"
                    id="minQuantity"
                    name="minQuantity"
                    className="form-input"
                    placeholder="Min Quantity"
                    value={formData.minQuantity}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Current Stock</label>
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

              <div className="form-group">
                <label htmlFor="mrp">MRP</label>
                <div className="input-wrapper">
                  <i className="fas fa-rupee-sign input-icon"></i>
                  <input
                    type="number"
                    id="mrp"
                    name="mrp"
                    className="form-input"
                    placeholder="MRP"
                    value={formData.mrp}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            {/* Third Row: Total After Adding, Add Product Button */}
            <div className="form-grid four-col" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label htmlFor="totalAfterAdding">Total After Adding</label>
                <div className="input-wrapper">
                  <i className="fas fa-calculator input-icon"></i>
                  <input
                    type="number"
                    id="totalAfterAdding"
                    name="totalAfterAdding"
                    className="form-input"
                    placeholder="Total quantity"
                    value={formData.totalAfterAdding}
                    readOnly
                    style={{ 
                      background: '#e7f3ff', 
                      cursor: 'not-allowed',
                      fontWeight: 'bold',
                      color: '#0066cc'
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>&nbsp;</label>
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={!productInfo || !formData.stockInQuantity || parseFloat(formData.stockInQuantity) <= 0}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: productInfo && formData.stockInQuantity && parseFloat(formData.stockInQuantity) > 0 ? '#dc3545' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: productInfo && formData.stockInQuantity && parseFloat(formData.stockInQuantity) > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (productInfo && formData.stockInQuantity && parseFloat(formData.stockInQuantity) > 0) {
                      e.target.style.background = '#c82333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (productInfo && formData.stockInQuantity && parseFloat(formData.stockInQuantity) > 0) {
                      e.target.style.background = '#dc3545';
                    }
                  }}
                >
                  <i className="fas fa-plus"></i>
                  Add Product
                </button>
              </div>
            </div>

            {/* Display Added Products - Summary Table - Right after Total After Adding */}
            {addedProducts.length > 0 && (
              <div className="product-summary-section" style={{ 
                marginTop: '30px', 
                clear: 'both', 
                paddingTop: '20px', 
                marginBottom: '20px',
                paddingBottom: '20px',
                position: 'relative',
                zIndex: 1,
                width: '100%',
                display: 'block'
              }}>
                <div style={{ width: '100%', marginBottom: '0' }}>
                  <div style={{ 
                    width: '100%',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#fff',
                    position: 'relative',
                    zIndex: 1
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
                            <th>SUPPLIER NAME</th>
                            <th style={{ width: '120px', textAlign: 'center' }}>MRP</th>
                            <th style={{ width: '150px', textAlign: 'center' }}>Amount</th>
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
                                {product.stockInQuantity}
                              </td>
                              <td style={{ fontWeight: '500', color: '#333' }}>
                                {product.supplierName || '-'}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: '500', color: '#333' }}>
                                ₹{parseFloat(product.mrp || 0).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: '#0066cc' }}>
                                ₹{parseFloat(product.amount || 0).toFixed(2)}
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
                        ₹{addedProducts.reduce((sum, product) => sum + (parseFloat(product.amount) || 0), 0).toFixed(2)}
                      </div>
                      <div style={{ minWidth: '100px' }}></div>
                    </div>
                  </div>
                </div>

                {/* Stock In Button - right after the table */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '10px',
                  paddingBottom: '20px',
                  width: '100%'
                }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading || addedProducts.length === 0}
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
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default StockIn;
