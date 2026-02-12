import React, { useState, useEffect } from 'react';
import { stockAPI, productsAPI, customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

const StockOut = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    customerState: '',
    customerPincode: '',
    paymentMode: '',
    notes: ''
  });
  const [customerVerified, setCustomerVerified] = useState(false);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  // Current product being entered (single form)
  const [currentProduct, setCurrentProduct] = useState({
      itemCode: '', 
      productName: '',
      skuCode: '',
      modelNumber: '',
      quantity: '', // Current stock
      stockOutQuantity: '', // Quantity to remove
      mrp: '',
      sellRate: '',
      discount: '',
      points: '', // Auto-calculated points
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
      setCustomerDetails(null);
      // Clear customer details
      setFormData(prev => ({
        ...prev,
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

  // Auto-fetch customer details when phone/ID is entered (works with or without name)
  useEffect(() => {
    const fetchCustomerByPhoneOrId = async () => {
      // Only proceed if phone/ID is entered (at least 4 characters for phone or C- for ID)
      if (!formData.customerPhone.trim() || formData.customerPhone.trim().length < 4) {
        setCustomerVerified(false);
        setCustomerDetails(null);
        return;
      }

      setIsCheckingCustomer(true);
      
      try {
        // Search by phone or unique ID
        const searchResponse = await customersAPI.search(formData.customerPhone.trim());
        
        if (searchResponse.success && searchResponse.customers && searchResponse.customers.length > 0) {
          // Find exact match by phone or unique ID
          const phoneOrId = formData.customerPhone.trim();
          const matchingCustomer = searchResponse.customers.find(c => 
            c.phone === phoneOrId || 
            c.customer_unique_id?.toUpperCase() === phoneOrId.toUpperCase()
          );
          
          // If exact match found, use it; otherwise use first result
          const customer = matchingCustomer || searchResponse.customers[0];
          
          if (customer) {
            setCustomerVerified(true);
            setCustomerDetails(customer);
            // Auto-fill all customer details
            setFormData(prev => ({
              ...prev,
              customerName: customer.full_name || prev.customerName, // Don't overwrite if name already entered
              customerAddress: customer.address || '',
              customerCity: customer.city || '',
              customerState: customer.state || '',
              customerPincode: customer.pincode || ''
            }));
          } else {
            setCustomerVerified(false);
            setCustomerDetails(null);
          }
        } else {
          setCustomerVerified(false);
          setCustomerDetails(null);
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        setCustomerVerified(false);
        setCustomerDetails(null);
      } finally {
        setIsCheckingCustomer(false);
      }
    };

    // Debounce the check
    const timer = setTimeout(() => {
      fetchCustomerByPhoneOrId();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.customerPhone]);

  const handleProductChange = (field, value) => {
    setCurrentProduct(prev => {
      const updated = { ...prev, [field]: value };
        
        // Reset product info if item code changes
        if (field === 'itemCode') {
          updated.productInfo = null;
          updated.productName = '';
          updated.skuCode = '';
          updated.modelNumber = '';
          updated.quantity = '';
          updated.mrp = '';
          updated.sellRate = '';
          updated.discount = '';
          updated.points = '';
        }
        
        return updated;
    });
    
    // Calculate points when sellRate or stockOutQuantity changes (after state update)
    if (field === 'sellRate' || field === 'stockOutQuantity') {
      setTimeout(() => {
        setCurrentProduct(prev => {
          const sellRate = parseFloat(prev.sellRate) || 0;
          const qty = parseInt(prev.stockOutQuantity) || 0;
          const totalAmount = sellRate * qty;
          // For every 1000 of sales, 0.5 points
          const calculatedPoints = (totalAmount / 1000) * 0.5;
          return {
            ...prev,
            points: calculatedPoints.toFixed(2)
          };
        });
      }, 0);
    }
  };

  const fetchProductByItemCode = async () => {
    if (!currentProduct.itemCode?.trim()) {
      return;
    }
    
    setCurrentProduct(prev => ({ ...prev, isFetching: true }));
    
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
          modelNumber: product.model_number || product.modelNumber || '',
          mrp: product.mrp || 0,
          sellRate: product.sell_rate || product.sellRate || 0,
          discount: product.discount_1 || product.discount || 0 // Use discount_1 for sell rate calculation
        };
        
        setCurrentProduct(prev => {
          const sellRate = parseFloat(productData.sellRate) || 0;
          const qty = parseInt(prev.stockOutQuantity) || 0;
          const totalAmount = sellRate * qty;
          const calculatedPoints = (totalAmount / 1000) * 0.5;
          
          return {
            ...prev,
            productInfo: productData,
            productName: productData.productName,
            skuCode: productData.skuCode,
            modelNumber: productData.modelNumber,
            quantity: productData.currentQuantity.toString(),
            mrp: productData.mrp.toString(),
            sellRate: productData.sellRate.toString(),
            discount: productData.discount.toString(),
            points: calculatedPoints.toFixed(2),
            isFetching: false
          };
        });
      } else {
        setCurrentProduct(prev => ({ ...prev, productInfo: null, isFetching: false }));
      }
    } catch (err) {
      console.error('Fetch product error:', err);
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
    // Validate that customer is verified
    if (!customerVerified) {
      return;
    }
    
    // Validate that product info exists
    if (!currentProduct.productInfo) {
      return;
    }
    
    // Validate stock out quantity
    if (!currentProduct.stockOutQuantity || currentProduct.stockOutQuantity.trim() === '') {
      return;
    }
    
    const stockOutQty = parseInt(currentProduct.stockOutQuantity);
    if (isNaN(stockOutQty) || stockOutQty <= 0) {
      return;
    }
    
    // Validate stock availability
    const currentStock = parseInt(currentProduct.quantity) || 0;
    if (stockOutQty > currentStock) {
      return;
    }
    
    // Check if this product (item code) is already added
    const isDuplicate = addedProducts.some(p => 
      p.itemCode && p.itemCode.trim() === currentProduct.itemCode.trim()
    );
    
    if (isDuplicate) {
      return;
    }
    
    const newId = addedProducts.length > 0 
      ? Math.max(...addedProducts.map(p => p.id)) + 1 
      : 1;
    
    // Calculate amount and points for the product
    const sellRate = parseFloat(currentProduct.sellRate) || 0;
    const amount = sellRate * stockOutQty;
    const points = (amount / 1000) * 0.5;
    
    // Add product to the list
    setAddedProducts(prev => [...prev, {
      id: newId, 
      ...currentProduct,
      stockOutQuantity: stockOutQty,
      amount: amount,
      points: parseFloat(points.toFixed(2))
    }]);
    
    // Clear current product form
    setCurrentProduct({
      itemCode: '', 
      productName: '',
      skuCode: '',
      modelNumber: '',
      quantity: '',
      stockOutQuantity: '',
      mrp: '',
      sellRate: '',
      discount: '',
      points: '',
      productInfo: null,
      isFetching: false
    });
  };

  const removeProduct = (productId) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate customer name
    if (!formData.customerName || !formData.customerName.trim()) {
      setError('Customer name is required. Please enter customer name.');
      return;
    }

    // Validate customer phone
    if (!formData.customerPhone || !formData.customerPhone.trim()) {
      setError('Customer phone number is required. Please enter customer phone number.');
      return;
    }

    // Validate customer is verified
    if (!customerVerified) {
      setError('Please verify the customer by entering a valid phone number or customer ID.');
      return;
    }

    // Validate payment mode
    if (!formData.paymentMode || !formData.paymentMode.trim()) {
      setError('Payment mode is required. Please select a payment mode.');
      return;
    }

    // Check if products are added
    if (!addedProducts || addedProducts.length === 0) {
      setError('Please add at least one product to the summary before creating stock out.');
      return;
    }

    // Validate each product has required fields
    const invalidProducts = addedProducts.filter(p => 
      !p.itemCode || !p.itemCode.trim() || 
      !p.stockOutQuantity || parseFloat(p.stockOutQuantity) <= 0 ||
      !p.productInfo
    );
    
    if (invalidProducts.length > 0) {
      setError('Some products in the summary are missing required fields. Please remove and re-add them.');
      return;
    }

    const confirmMessage = `Remove stock for ${addedProducts.length} item(s) for customer ${formData.customerName}?`;
    
    setConfirmState({
      open: true,
      message: confirmMessage,
      onConfirm: async () => {
        setIsLoading(true);
        
        try {
          const createdBy = getUserIdentifier();
          
          // Validate each product before submitting
          for (const item of addedProducts) {
            if (!item.itemCode || !item.itemCode.trim()) {
              setIsLoading(false);
              setConfirmState({ open: false, message: '', onConfirm: null });
              return;
            }
            
            if (!item.stockOutQuantity || item.stockOutQuantity <= 0) {
              setIsLoading(false);
              setConfirmState({ open: false, message: '', onConfirm: null });
              return;
            }
            
            if (!item.productInfo) {
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
            setError('');
            setSuccessMessage(`Successfully removed stock for ${addedProducts.length} item(s)!`);
            // Reset form after successful stock out
            setFormData({
              customerName: '',
              customerPhone: '',
              customerAddress: '',
              customerCity: '',
              customerState: '',
              customerPincode: '',
              paymentMode: '',
              notes: ''
            });
            setCustomerVerified(false);
            setCustomerDetails(null);
            setCurrentProduct({
              itemCode: '',
              productName: '',
              skuCode: '',
              modelNumber: '',
              quantity: '',
              stockOutQuantity: '',
              mrp: '',
              sellRate: '',
              discount: '',
              points: '',
              productInfo: null,
              isFetching: false
            });
            setAddedProducts([]);
            // Wait a bit for backend to commit, then dispatch event and navigate
            setTimeout(() => {
              // Dispatch event to trigger refresh in StockOutMaster
              window.dispatchEvent(new Event('stockOutCompleted'));
              // Navigate after a short delay to allow refresh to happen
              setTimeout(() => {
                handleBack();
              }, 500);
            }, 1500);
          } else {
            setError('Some products failed to remove. Please try again.');
          }
        } catch (err) {
          console.error('Stock Out error:', err);
        } finally {
          setIsLoading(false);
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="add-user-container add-stock-out-container">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <Toast message={error} type="error" onClose={() => setError('')} />
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

        <form onSubmit={handleSubmit} className="add-user-form add-stock-out-form" noValidate>
          {/* All fields in 4-column grid without section titles */}
          <div className="form-section">
            <div className="form-grid four-col">
              {/* Row 1: Customer Name, Phone Number */}
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
                <label htmlFor="customerPhone">Phone number or Customer ID *</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <i className="fas fa-phone input-icon"></i>
                  <input
                    type="text"
                    id="customerPhone"
                    name="customerPhone"
                    className="form-input"
                    placeholder="Enter phone number or Customer ID (e.g., C-1234)"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    required
                    style={{
                      paddingRight: customerVerified || isCheckingCustomer ? '40px' : '18px',
                      borderColor: customerVerified ? '#28a745' : undefined
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
          </div>

              {/* Row 2: Item Code, Product Name */}
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
                    disabled={!customerVerified}
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
                      disabled={!customerVerified}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '6px 8px',
                            width: '32px',
                            height: '32px',
                        background: customerVerified ? '#dc3545' : '#ccc',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                        cursor: customerVerified ? 'pointer' : 'not-allowed',
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
                        placeholder="Product Name"
                    value={currentProduct.productName}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

              {/* Row 3: SKV Code, Current Stock, Stock Out Quantity, Add Product Button */}
                  <div className="form-group">
                <label htmlFor="skuCode">SKU Code</label>
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
                    disabled={!currentProduct.productInfo || !customerVerified}
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
                        className="form-input"
                        placeholder="MRP"
                    value={currentProduct.mrp}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>
            </div>

            {/* Third Row: Discount, Sell Rate, Points */}
            <div className="form-grid four-col" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                <label htmlFor="discount">Discount</label>
                    <div className="input-wrapper">
                      <i className="fas fa-percent input-icon"></i>
                      <input
                        type="number"
                    id="discount"
                        className="form-input"
                        placeholder="Discount"
                    value={currentProduct.discount}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                <label htmlFor="sellRate">Sell Rate</label>
                    <div className="input-wrapper">
                      <i className="fas fa-rupee-sign input-icon"></i>
                      <input
                        type="number"
                    id="sellRate"
                        className="form-input"
                        placeholder="Sell Rate"
                    value={currentProduct.sellRate}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                <label htmlFor="points">Points</label>
                    <div className="input-wrapper">
                      <i className="fas fa-star input-icon"></i>
                      <input
                        type="number"
                    id="points"
                        className="form-input"
                        placeholder="Points"
                    value={currentProduct.points}
                        readOnly
                        style={{ 
                          background: '#e7f3ff', 
                          cursor: 'not-allowed',
                          fontWeight: 'bold',
                          color: '#0066cc'
                        }}
                        title="Auto-calculated (0.5 per ₹1000)"
                      />
                    </div>
                  </div>
              </div>

              <div className="stock-out-bottom-sections">
                <div className="stock-out-add-product">
                  <div className="form-grid four-col" style={{ marginTop: '12px' }}>
                    <div className="form-group">
                      <label style={{ visibility: 'hidden' }}>Add Product</label>
                      <button
                        type="button"
                        onClick={addProduct}
                        disabled={!customerVerified || !currentProduct.productInfo || !currentProduct.stockOutQuantity}
                        style={{
                          marginTop: '0',
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
                  </div>
                </div>

                <div className="stock-out-table">
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
                          zIndex: 1,
                        }}>
                          <div className="attendance-table-container" style={{ 
                            marginTop: '0',
                            maxHeight: '400px',
                            overflowY: 'auto',
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
                                      {product.stockOutQuantity}
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
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="stock-out-payment">
                  {addedProducts.length > 0 && (
                    <div className="form-actions" style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      paddingTop: '20px',
                      paddingBottom: '20px',
                      gap: '12px'
                    }}>
                      <div style={{ width: '100%', maxWidth: '400px' }}>
                        <label htmlFor="paymentMode">Payment Mode *</label>
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
                          if (!customerVerified) {
                            e.preventDefault();
                            setError('Please verify the customer by entering a valid phone number or customer ID.');
                            return;
                          }
                          if (!formData.paymentMode || !formData.paymentMode.trim()) {
                            e.preventDefault();
                            setError('Payment mode is required. Please select a payment mode.');
                            return;
                          }
                          if (!addedProducts || addedProducts.length === 0) {
                            e.preventDefault();
                            setError('Please add at least one product to the summary before creating stock out.');
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
                  )}
                </div>
              </div>

            </div>
          
        </form>
      </main>
    </div>
  );
};

export default StockOut;
