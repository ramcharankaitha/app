import React, { useState, useEffect } from 'react';
import { stockAPI, productsAPI, customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const StockOut = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerCity: '',
    customerState: '',
    customerPincode: '',
    paymentMode: '',
    notes: ''
  });
  const [customerVerified, setCustomerVerified] = useState(false);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState('');
  const [customerDetails, setCustomerDetails] = useState(null);
  // Current product being entered (single form)
  const [currentProduct, setCurrentProduct] = useState({
    itemCode: '',
    productName: '',
    skuCode: '',
    category: '',
    modelNumber: '',
    quantity: '', // Current stock
    stockOutQuantity: '', // Quantity to remove
    mrp: '',
    sellRate: '',
    discount: '',
    productInfo: null,
    isFetching: false
  });
  
  // Added products (displayed as cards)
  const [addedProducts, setAddedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
    
    // Reset customer verification when name or phone changes
    if (name === 'customerName' || name === 'customerPhone') {
      setCustomerVerified(false);
      setCustomerError('');
      setCustomerDetails(null);
      // Clear customer details
      setFormData(prev => ({
        ...prev,
        customerEmail: '',
        customerAddress: '',
        customerCity: '',
        customerState: '',
        customerPincode: ''
      }));
      // Clear all products when customer changes
      setCurrentProduct({
        itemCode: '',
        productName: '',
        skuCode: '',
        category: '',
        modelNumber: '',
        quantity: '',
        stockOutQuantity: '',
        mrp: '',
        sellRate: '',
        discount: '',
        productInfo: null,
        isFetching: false
      });
      setAddedProducts([]);
    }
  };

  // Check if customer exists when both name and phone are entered
  useEffect(() => {
    const checkCustomer = async () => {
      if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
        setCustomerVerified(false);
        setCustomerError('');
        return;
      }

      setIsCheckingCustomer(true);
      setCustomerError('');
      
      try {
        // Search by phone number first (more reliable)
        const phoneResponse = await customersAPI.search(formData.customerPhone.trim());
        
        if (phoneResponse.success && phoneResponse.customers && phoneResponse.customers.length > 0) {
          // Check if any customer matches both name and phone
          const matchingCustomer = phoneResponse.customers.find(c => 
            c.phone === formData.customerPhone.trim() &&
            c.full_name.toLowerCase() === formData.customerName.trim().toLowerCase()
          );
          
          if (matchingCustomer) {
            setCustomerVerified(true);
            setCustomerError('');
            setCustomerDetails(matchingCustomer);
            // Fetch full customer details
            setFormData(prev => ({
              ...prev,
              customerEmail: matchingCustomer.email || '',
              customerAddress: matchingCustomer.address || '',
              customerCity: matchingCustomer.city || '',
              customerState: matchingCustomer.state || '',
              customerPincode: matchingCustomer.pincode || ''
            }));
          } else {
            // Try searching by name
            const nameResponse = await customersAPI.search(formData.customerName.trim());
            if (nameResponse.success && nameResponse.customers && nameResponse.customers.length > 0) {
              const nameMatch = nameResponse.customers.find(c => 
                c.full_name.toLowerCase() === formData.customerName.trim().toLowerCase() &&
                c.phone === formData.customerPhone.trim()
              );
              
              if (nameMatch) {
                setCustomerVerified(true);
                setCustomerError('');
                setCustomerDetails(nameMatch);
                // Fetch full customer details
                setFormData(prev => ({
                  ...prev,
                  customerEmail: nameMatch.email || '',
                  customerAddress: nameMatch.address || '',
                  customerCity: nameMatch.city || '',
                  customerState: nameMatch.state || '',
                  customerPincode: nameMatch.pincode || ''
                }));
              } else {
                setCustomerVerified(false);
                setCustomerError('Customer not found. Please create the customer first in the Master Menu.');
                setCustomerDetails(null);
              }
            } else {
              setCustomerVerified(false);
              setCustomerError('Customer not found. Please create the customer first in the Master Menu.');
              setCustomerDetails(null);
            }
          }
        } else {
          setCustomerVerified(false);
          setCustomerError('Customer not found. Please create the customer first in the Master Menu.');
        }
      } catch (err) {
        console.error('Error checking customer:', err);
        setCustomerVerified(false);
        setCustomerError('Error verifying customer. Please try again.');
      } finally {
        setIsCheckingCustomer(false);
      }
    };

    // Debounce the check
    const timer = setTimeout(() => {
      checkCustomer();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.customerName, formData.customerPhone]);

  const handleProductChange = (field, value) => {
    setCurrentProduct(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset product info if item code changes
      if (field === 'itemCode') {
        updated.productInfo = null;
        updated.productName = '';
        updated.skuCode = '';
        updated.category = '';
        updated.modelNumber = '';
        updated.quantity = '';
        updated.mrp = '';
        updated.sellRate = '';
        updated.discount = '';
      }
      
      return updated;
    });
  };

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
          skuCode: product.sku_code || product.skuCode || '',
          currentQuantity: product.current_quantity || 0,
          category: product.category || '',
          modelNumber: product.model_number || product.modelNumber || '',
          mrp: product.mrp || 0,
          sellRate: product.sell_rate || product.sellRate || 0,
          discount: product.discount || 0
        };
        
        setCurrentProduct(prev => ({
          ...prev,
          productInfo: productData,
          productName: productData.productName,
          skuCode: productData.skuCode,
          category: productData.category,
          modelNumber: productData.modelNumber,
          quantity: productData.currentQuantity.toString(),
          mrp: productData.mrp.toString(),
          sellRate: productData.sellRate.toString(),
          discount: productData.discount.toString(),
          isFetching: false
        }));
        
        if (product.current_quantity <= 0) {
          setError('This product is out of stock!');
        }
      } else {
        setError('Product not found with this item code');
        setCurrentProduct(prev => ({ ...prev, productInfo: null, isFetching: false }));
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err.message || 'Product not found. Please check the item code and try again.');
      setCurrentProduct(prev => ({ ...prev, productInfo: null, isFetching: false }));
    }
  };

  const handleItemCodeKeyPress = async (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      await fetchProductByItemCode();
    }
  };

  const addProduct = () => {
    // Clear any previous errors
    setError('');
    
    // Validate that customer is verified
    if (!customerVerified) {
      setError('Please verify the customer first');
      return;
    }
    
    // Validate that product info exists
    if (!currentProduct.productInfo) {
      setError('Please fetch product details first by entering item code and clicking Fetch');
      return;
    }
    
    // Validate stock out quantity
    if (!currentProduct.stockOutQuantity || currentProduct.stockOutQuantity.trim() === '') {
      setError('Please enter a stock out quantity');
      return;
    }
    
    const stockOutQty = parseInt(currentProduct.stockOutQuantity);
    if (isNaN(stockOutQty) || stockOutQty <= 0) {
      setError('Please enter a valid stock out quantity (must be greater than 0)');
      return;
    }
    
    // Validate stock availability
    const currentStock = parseInt(currentProduct.quantity) || 0;
    if (stockOutQty > currentStock) {
      setError(`Stock out quantity (${stockOutQty}) cannot exceed current stock (${currentStock})`);
      return;
    }
    
    // Check if this product (item code) is already added
    const isDuplicate = addedProducts.some(p => 
      p.itemCode && p.itemCode.trim() === currentProduct.itemCode.trim()
    );
    
    if (isDuplicate) {
      setError('This product is already added. Please remove it first if you want to change the quantity.');
      return;
    }
    
    const newId = addedProducts.length > 0 
      ? Math.max(...addedProducts.map(p => p.id)) + 1 
      : 1;
    
    // Add product to the list
    setAddedProducts(prev => [...prev, {
      id: newId,
      ...currentProduct,
      stockOutQuantity: stockOutQty
    }]);
    
    // Clear current product form
    setCurrentProduct({
      itemCode: '',
      productName: '',
      skuCode: '',
      category: '',
      modelNumber: '',
      quantity: '',
      stockOutQuantity: '',
      mrp: '',
      sellRate: '',
      discount: '',
      productInfo: null,
      isFetching: false
    });
    
    setSuccessMessage('Product added successfully!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const removeProduct = (productId) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.customerName || !formData.customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (!formData.customerPhone || !formData.customerPhone.trim()) {
      setError('Please enter customer phone number');
      return;
    }

    if (!customerVerified) {
      setError('Customer not verified. Please ensure the customer exists in the system. Create the customer first in the Master Menu.');
      return;
    }

    if (!formData.paymentMode || !formData.paymentMode.trim()) {
      setError('Please select a payment mode');
      return;
    }

    if (addedProducts.length === 0) {
      setError('Please add at least one product');
      return;
    }

    const confirmMessage = `Remove stock for ${addedProducts.length} item(s) for customer ${formData.customerName}?`;
    
    setConfirmState({
      open: true,
      message: confirmMessage,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
          const createdBy = getUserIdentifier();
          
          // Validate each product before submitting
          for (const item of addedProducts) {
            if (!item.itemCode || !item.itemCode.trim()) {
              setError('One or more products have invalid item codes');
              setIsLoading(false);
              setConfirmState({ open: false, message: '', onConfirm: null });
              return;
            }
            
            if (!item.stockOutQuantity || item.stockOutQuantity <= 0) {
              setError(`Invalid stock out quantity for product ${item.itemCode}`);
              setIsLoading(false);
              setConfirmState({ open: false, message: '', onConfirm: null });
              return;
            }
            
            if (!item.productInfo) {
              setError(`Product information missing for ${item.itemCode}`);
              setIsLoading(false);
              setConfirmState({ open: false, message: '', onConfirm: null });
              return;
            }
          }
          
          const promises = addedProducts.map(item =>
            stockAPI.stockOut(
              item.itemCode.trim(),
              item.stockOutQuantity,
              null,
              createdBy,
              formData.customerName.trim(),
              formData.customerPhone.trim(),
              formData.paymentMode || 'Cash',
              parseFloat(item.mrp) || 0,
              parseFloat(item.sellRate) || 0,
              parseFloat(item.discount) || 0
            )
          );

          const results = await Promise.all(promises);
          console.log('Stock out results:', results);
          const allSuccess = results.every(result => result && result.success !== false);

          if (allSuccess) {
            setSuccessMessage(`Stock removed successfully for ${addedProducts.length} item(s)!`);
            // Reset form after successful stock out
            setFormData({
              customerName: '',
              customerPhone: '',
              customerEmail: '',
              customerAddress: '',
              customerCity: '',
              customerState: '',
              customerPincode: '',
              paymentMode: '',
              notes: ''
            });
            setCustomerVerified(false);
            setCustomerError('');
            setCustomerDetails(null);
            setCurrentProduct({
              itemCode: '',
              productName: '',
              skuCode: '',
              category: '',
              modelNumber: '',
              quantity: '',
              stockOutQuantity: '',
              mrp: '',
              sellRate: '',
              discount: '',
              productInfo: null,
              isFetching: false
            });
            setAddedProducts([]);
            // Wait a bit for backend to commit, then dispatch event and navigate
            setTimeout(() => {
              // Dispatch event to trigger refresh in StockOutMaster
              window.dispatchEvent(new Event('stockOutCompleted'));
              setSuccessMessage('');
              // Navigate after a short delay to allow refresh to happen
              setTimeout(() => {
                handleBack();
              }, 500);
            }, 1500);
          } else {
            setError('Some stock removals failed. Please try again.');
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
        <form onSubmit={handleSubmit} className="add-user-form add-stock-out-form">
          {/* All fields in 3-column grid without section titles */}
          <div className="form-section">
            <div className="form-grid three-col">
              {/* Row 1: Customer Name, Phone Number, Email */}
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
                <label htmlFor="customerPhone">Phone number *</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <i className="fas fa-phone input-icon"></i>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    className="form-input"
                    placeholder="Enter phone number"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    required
                    style={{
                      paddingRight: customerVerified || isCheckingCustomer || customerError ? '40px' : '18px',
                      borderColor: customerError ? '#dc3545' : customerVerified ? '#28a745' : undefined
                    }}
                  />
                  {isCheckingCustomer && (
                    <i className="fas fa-spinner fa-spin" style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666' 
                    }}></i>
                  )}
                  {!isCheckingCustomer && customerVerified && (
                    <i className="fas fa-check-circle" style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#28a745' 
                    }}></i>
                  )}
                </div>
                {customerError && (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: '#dc3545',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <i className="fas fa-exclamation-circle"></i>
                    {customerError}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="customerEmail">Email</label>
                <div className="input-wrapper">
                  <i className="fas fa-envelope input-icon"></i>
                  <input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    className="form-input"
                    placeholder="customer@example.com"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* Row 2: Item Code, Category, Product Name */}
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
                    disabled={!customerVerified}
                    style={{ paddingRight: currentProduct.isFetching ? '40px' : '120px' }}
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
                      disabled={!customerVerified}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '6px 12px',
                        background: customerVerified ? '#dc3545' : '#ccc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: customerVerified ? 'pointer' : 'not-allowed',
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
                <label htmlFor="category">Category</label>
                <div className="input-wrapper">
                  <i className="fas fa-tags input-icon"></i>
                  <input
                    type="text"
                    id="category"
                    className="form-input"
                    placeholder="Category"
                    value={currentProduct.category}
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
                    value={currentProduct.productName}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* Row 3: SKV Code, Current Stock, Stock Out Quantity */}
              <div className="form-group">
                <label htmlFor="skuCode">SKV Code</label>
                <div className="input-wrapper">
                  <i className="fas fa-boxes input-icon"></i>
                  <input
                    type="text"
                    id="skuCode"
                    className="form-input"
                    placeholder="SKV Code"
                    value={currentProduct.skuCode}
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
                    className="form-input"
                    placeholder="Current Stock"
                    value={currentProduct.quantity}
                    readOnly
                    style={{ 
                      background: currentProduct.quantity && parseInt(currentProduct.quantity) <= 0 ? '#fff3cd' : '#f8f9fa', 
                      cursor: 'not-allowed',
                      fontWeight: 'bold',
                      color: currentProduct.quantity && parseInt(currentProduct.quantity) <= 0 ? '#dc3545' : '#495057'
                    }}
                  />
                </div>
                {/* Add Product button below Current Stock */}
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={!customerVerified || !currentProduct.productInfo || !currentProduct.stockOutQuantity}
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: (customerVerified && currentProduct.productInfo && currentProduct.stockOutQuantity) ? '#28a745' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (customerVerified && currentProduct.productInfo && currentProduct.stockOutQuantity) ? 'pointer' : 'not-allowed',
                    fontSize: '12px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxSizing: 'border-box'
                  }}
                >
                  <i className="fas fa-plus"></i>
                  Add Product
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="stockOutQuantity">Stock Out Quantity *</label>
                <div className="input-wrapper">
                  <i className="fas fa-minus-circle input-icon"></i>
                  <input
                    type="number"
                    id="stockOutQuantity"
                    className="form-input"
                    placeholder="Enter quantity to remove"
                    value={currentProduct.stockOutQuantity}
                    onChange={(e) => handleProductChange('stockOutQuantity', e.target.value)}
                    min="1"
                    max={currentProduct.productInfo ? currentProduct.productInfo.currentQuantity : undefined}
                    step="1"
                    required
                    disabled={!currentProduct.productInfo || !customerVerified}
                  />
                </div>
                {/* Payment Mode - Right side of Add Product button */}
                <label htmlFor="paymentMode" style={{ marginTop: '12px' }}>Payment Mode *</label>
                <div className="input-wrapper">
                  <i className="fas fa-credit-card input-icon"></i>
                  <select
                    id="paymentMode"
                    name="paymentMode"
                    className="form-input"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                    required
                    disabled={!customerVerified}
                    style={{ 
                      background: !customerVerified ? '#f8f9fa' : '#fff',
                      cursor: !customerVerified ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">Select payment mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Credit">Credit</option>
                  </select>
                  <i className="fas fa-chevron-down dropdown-icon"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Display Added Products - Horizontal cards like transport addresses */}
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
                    {product.skuCode && (
                      <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                        <span style={{ fontWeight: '500', color: '#666' }}>SKV: </span>
                        <span style={{ color: '#333' }}>{product.skuCode}</span>
                      </div>
                    )}
                    <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                      <span style={{ fontWeight: '500', color: '#666' }}>Qty: </span>
                      <span style={{ color: '#333', fontWeight: '600' }}>{product.stockOutQuantity}</span>
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


          {/* Remove Stock Button - Centered below in the middle, same as Stock In button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginTop: '20px'
          }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !customerVerified || !formData.paymentMode || addedProducts.length === 0}
              style={{
                width: '200px',
                maxWidth: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: (isLoading || !customerVerified || !formData.paymentMode || addedProducts.length === 0) ? 'not-allowed' : 'pointer'
              }}
              onClick={(e) => {
                // Additional validation before submit
                if (!customerVerified) {
                  e.preventDefault();
                  setError('Please verify the customer first');
                  return;
                }
                if (!formData.paymentMode) {
                  e.preventDefault();
                  setError('Please select a payment mode');
                  return;
                }
                if (addedProducts.length === 0) {
                  e.preventDefault();
                  setError('Please add at least one product before removing stock');
                  return;
                }
              }}
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
