import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, categoriesAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddProduct = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    productName: '',
    itemCode: '',
    skuCode: '',
    modelNumber: '',
    minQuantity: '',
    openingQuantity: '',
    supplierName: '',
    category: '',
    image: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [commonCategories, setCommonCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedCommonCategory, setSelectedCommonCategory] = useState('');
  
  // Search/filter states for dropdowns
  const [mainSearchTerm, setMainSearchTerm] = useState('');
  const [subSearchTerm, setSubSearchTerm] = useState('');
  const [commonSearchTerm, setCommonSearchTerm] = useState('');
  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [showCommonDropdown, setShowCommonDropdown] = useState(false);
  
  // Refs for click outside detection
  const mainDropdownRef = useRef(null);
  const subDropdownRef = useRef(null);
  const commonDropdownRef = useRef(null);

  // Fetch main categories on component mount
  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const response = await categoriesAPI.getMainCategories();
        if (response && response.success) {
          setMainCategories(response.mainCategories || []);
        }
      } catch (err) {
        console.error('Error fetching main categories:', err);
      }
    };
    fetchMainCategories();
  }, []);

  // Fetch sub categories when main category is selected
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!selectedMainCategory) {
        setSubCategories([]);
        setCommonCategories([]);
        setSelectedSubCategory('');
        setSelectedCommonCategory('');
        return;
      }

      try {
        const subResponse = await categoriesAPI.getSubCategories(selectedMainCategory);
        if (subResponse && subResponse.success) {
          setSubCategories(subResponse.subCategories || []);
        }
        // Clear sub and common selections when main changes
        setSelectedSubCategory('');
        setSelectedCommonCategory('');
        setCommonCategories([]);
        setSubSearchTerm('');
        setCommonSearchTerm('');
        setShowSubDropdown(false);
        setShowCommonDropdown(false);
      } catch (err) {
        console.error('Error fetching sub categories:', err);
      }
    };

    fetchSubCategories();
  }, [selectedMainCategory]);

  // Fetch common categories when both main and sub categories are selected
  useEffect(() => {
    const fetchCommonCategories = async () => {
      if (!selectedMainCategory || !selectedSubCategory) {
        setCommonCategories([]);
        setSelectedCommonCategory('');
        return;
      }

      try {
        const commonResponse = await categoriesAPI.getCommonCategories(selectedMainCategory, selectedSubCategory);
        if (commonResponse && commonResponse.success) {
          setCommonCategories(commonResponse.commonCategories || []);
        }
        // Clear common selection when sub changes
        setSelectedCommonCategory('');
        setCommonSearchTerm('');
        setShowCommonDropdown(false);
      } catch (err) {
        console.error('Error fetching common categories:', err);
      }
    };

    fetchCommonCategories();
  }, [selectedMainCategory, selectedSubCategory]);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('products');
    } else if (onBack) {
      onBack();
    }
  };

  const handleHome = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  const handleManagers = () => {
    if (onNavigate) {
      onNavigate('users');
    }
  };

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
    }
  };

  const handleStaff = () => {
    if (onNavigate) {
      onNavigate('staff');
    }
  };

  const handleCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('products');
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

  // Filter categories based on search term
  const filteredMainCategories = mainCategories.filter(cat =>
    cat.toLowerCase().includes(mainSearchTerm.toLowerCase())
  );
  
  const filteredSubCategories = subCategories.filter(cat =>
    cat.toLowerCase().includes(subSearchTerm.toLowerCase())
  );
  
  const filteredCommonCategories = commonCategories.filter(cat =>
    cat.toLowerCase().includes(commonSearchTerm.toLowerCase())
  );

  // Handle main category selection
  const handleMainSelect = (main) => {
    setSelectedMainCategory(main);
    setMainSearchTerm(main);
    setShowMainDropdown(false);
    // Sub and common will be cleared by useEffect
  };

  // Handle sub category selection
  const handleSubSelect = (sub) => {
    setSelectedSubCategory(sub);
    setSubSearchTerm(sub);
    setShowSubDropdown(false);
    // Common will be cleared by useEffect
  };

  // Handle common category selection
  const handleCommonSelect = (common) => {
    setSelectedCommonCategory(common);
    setCommonSearchTerm(common);
    setShowCommonDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mainDropdownRef.current && !mainDropdownRef.current.contains(event.target)) {
        setShowMainDropdown(false);
      }
      if (subDropdownRef.current && !subDropdownRef.current.contains(event.target)) {
        setShowSubDropdown(false);
      }
      if (commonDropdownRef.current && !commonDropdownRef.current.contains(event.target)) {
        setShowCommonDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update category string whenever main, sub, or common changes
  useEffect(() => {
    let categoryString = selectedMainCategory || '';
    if (selectedSubCategory) {
      categoryString += ' - ' + selectedSubCategory;
    }
    if (selectedCommonCategory) {
      categoryString += ' - ' + selectedCommonCategory;
    }
    setFormData(prev => ({
      ...prev,
      category: categoryString
    }));
  }, [selectedMainCategory, selectedSubCategory, selectedCommonCategory]);


  const submitProduct = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await productsAPI.create({
        productName: formData.productName,
        itemCode: formData.itemCode,
        skuCode: formData.skuCode,
        modelNumber: formData.modelNumber,
        minimumQuantity: parseInt(formData.minQuantity) || 0,
        currentQuantity: parseInt(formData.openingQuantity) || 0,
        supplierName: formData.supplierName,
        category: formData.category
      });

      if (response.success) {
        setSuccessMessage('Save changes are done');
        // Clear success message and navigate after 2 seconds
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create product. Please try again.');
      console.error('Create product error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitProduct,
    });
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleHome}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        {userRole === 'admin' && (
          <div className="nav-item" onClick={handleManagers}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
        <div className="nav-item" onClick={handleStaff}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item active" onClick={handleProducts}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
        </div>
        <div className="nav-item" onClick={handleSettings}>
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
              <h1 className="page-title">Add New Product</h1>
              <p className="page-subtitle">Create an item for your store</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Product Details Section */} 
                <div className="form-section">
                  <h3 className="section-title">Product details</h3>
                  <div className="form-grid">
                    {/* Category Selection - All three in first row */}
                    {/* 1. Main Category */}
                    <div className="form-group" ref={mainDropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
                      <label htmlFor="mainCategory">Main Category</label>
                      <div className="input-wrapper">
                        <i className="fas fa-th-large input-icon"></i>
                        <input
                          type="text"
                          id="mainCategory"
                          name="mainCategory"
                          className="form-input"
                          placeholder="Type to search main category..."
                          value={mainSearchTerm}
                          onChange={(e) => {
                            const value = e.target.value;
                            setMainSearchTerm(value);
                            setShowMainDropdown(true);
                            // If user is typing something different, clear selection
                            if (value !== selectedMainCategory) {
                              setSelectedMainCategory('');
                            }
                          }}
                          onFocus={() => {
                            if (mainCategories.length > 0) {
                              setShowMainDropdown(true);
                            }
                          }}
                          required
                          autoComplete="off"
                        />
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                      </div>
                      {showMainDropdown && filteredMainCategories.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          zIndex: 10000,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          marginTop: '4px'
                        }}>
                          {filteredMainCategories.map((main, index) => (
                            <div
                              key={index}
                              onClick={() => handleMainSelect(main)}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: index < filteredMainCategories.length - 1 ? '1px solid #f0f0f0' : 'none',
                                background: selectedMainCategory === main ? '#f0f7ff' : '#fff',
                                color: selectedMainCategory === main ? '#007bff' : '#333'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                              onMouseLeave={(e) => e.target.style.background = selectedMainCategory === main ? '#f0f7ff' : '#fff'}
                            >
                              {main}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Sub Category */}
                    <div className="form-group" ref={subDropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
                      <label htmlFor="subCategory">Sub Category</label>
                      <div className="input-wrapper">
                        <i className="fas fa-th-large input-icon"></i>
                        <input
                          type="text"
                          id="subCategory"
                          name="subCategory"
                          className="form-input"
                          placeholder={selectedMainCategory ? "Type to search sub category..." : "Select main category first"}
                          value={subSearchTerm}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSubSearchTerm(value);
                            setShowSubDropdown(true);
                            // If user is typing something different, clear selection
                            if (value !== selectedSubCategory) {
                              setSelectedSubCategory('');
                            }
                          }}
                          onFocus={() => {
                            if (subCategories.length > 0) {
                              setShowSubDropdown(true);
                            }
                          }}
                          disabled={!selectedMainCategory}
                          autoComplete="off"
                        />
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                      </div>
                      {showSubDropdown && selectedMainCategory && filteredSubCategories.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          zIndex: 10000,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          marginTop: '4px'
                        }}>
                          {filteredSubCategories.map((sub, index) => (
                            <div
                              key={index}
                              onClick={() => handleSubSelect(sub)}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: index < filteredSubCategories.length - 1 ? '1px solid #f0f0f0' : 'none',
                                background: selectedSubCategory === sub ? '#f0f7ff' : '#fff',
                                color: selectedSubCategory === sub ? '#007bff' : '#333'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                              onMouseLeave={(e) => e.target.style.background = selectedSubCategory === sub ? '#f0f7ff' : '#fff'}
                            >
                              {sub}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. Common Category */}
                    <div className="form-group" ref={commonDropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
                      <label htmlFor="commonCategory">Common Category</label>
                      <div className="input-wrapper">
                        <i className="fas fa-th-large input-icon"></i>
                        <input
                          type="text"
                          id="commonCategory"
                          name="commonCategory"
                          className="form-input"
                          placeholder={selectedSubCategory ? "Type to search common category..." : "Select sub category first"}
                          value={commonSearchTerm}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCommonSearchTerm(value);
                            setShowCommonDropdown(true);
                            // If user is typing something different, clear selection
                            if (value !== selectedCommonCategory) {
                              setSelectedCommonCategory('');
                            }
                          }}
                          onFocus={() => {
                            if (commonCategories.length > 0) {
                              setShowCommonDropdown(true);
                            }
                          }}
                          disabled={!selectedSubCategory}
                          autoComplete="off"
                        />
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                      </div>
                      {showCommonDropdown && selectedSubCategory && filteredCommonCategories.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          zIndex: 10000,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          marginTop: '4px'
                        }}>
                          {filteredCommonCategories.map((common, index) => (
                            <div
                              key={index}
                              onClick={() => handleCommonSelect(common)}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: index < filteredCommonCategories.length - 1 ? '1px solid #f0f0f0' : 'none',
                                background: selectedCommonCategory === common ? '#f0f7ff' : '#fff',
                                color: selectedCommonCategory === common ? '#007bff' : '#333'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                              onMouseLeave={(e) => e.target.style.background = selectedCommonCategory === common ? '#f0f7ff' : '#fff'}
                            >
                              {common}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Item Code */}
                    <div className="form-group">
                      <label htmlFor="itemCode">Item Code</label>
                      <div className="input-wrapper">
                        <i className="fas fa-barcode input-icon"></i>
                        <input
                          type="text"
                          id="itemCode"
                          name="itemCode"
                          className="form-input"
                          placeholder="e.g., ITM-0983"
                          value={formData.itemCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* 3. Product Name */}
                    <div className="form-group">
                      <label htmlFor="productName">Product</label>
                      <div className="input-wrapper">
                        <i className="fas fa-tag input-icon"></i>
                        <input
                          type="text"
                          id="productName"
                          name="productName"
                          className="form-input"
                          placeholder="e.g., Classic Basmati Rice"
                          value={formData.productName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* 4. SKV (SKU Code) */}
                    <div className="form-group">
                      <label htmlFor="skuCode">SKV</label>
                      <div className="input-wrapper">
                        <i className="fas fa-boxes input-icon"></i>
                        <input
                          type="text"
                          id="skuCode"
                          name="skuCode"
                          className="form-input"
                          placeholder="e.g., SKU-44355"
                          value={formData.skuCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* 5. Model */}
                    <div className="form-group">
                      <label htmlFor="modelNumber">Model</label>
                      <div className="input-wrapper">
                        <i className="fas fa-tag input-icon"></i>
                        <input
                          type="text"
                          id="modelNumber"
                          name="modelNumber"
                          className="form-input"
                          placeholder="Enter model number"
                          value={formData.modelNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* 6. Opening Quantity */}
                    <div className="form-group">
                      <label htmlFor="openingQuantity">Opening Quantity</label>
                      <div className="input-wrapper">
                        <i className="fas fa-cubes input-icon"></i>
                        <input
                          type="number"
                          id="openingQuantity"
                          name="openingQuantity"
                          className="form-input"
                          placeholder="e.g., 100 units"
                          value={formData.openingQuantity}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Supplier Name - kept for backward compatibility */}
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
                </div>


                {/* Image Upload Section */}
                <div className="form-section">
                  <h3 className="section-title">Product image (optional)</h3>
                  <div className="upload-placeholder">
                    <i className="fas fa-plus"></i>
                    <span>Tap to upload image</span>
                  </div>
                </div>

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
                    {isLoading ? 'Adding...' : 'Add Product'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel
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

export default AddProduct;

