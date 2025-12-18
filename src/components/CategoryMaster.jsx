import React, { useState, useEffect, useRef } from 'react';
import './products.css';

const CategoryMaster = ({ onBack, onAddCategory, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const menuRef = useRef(null);

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      setError('');
      // TODO: Replace with actual categories API when backend is ready
      // For now, using mock data
      const mockCategories = [
        { id: 1, main: 'Utensils', sub: 'Kitchen', common: 'Daily Use' },
        { id: 2, main: 'Utensils', sub: 'Dining', common: 'Common' },
      ];
      setCategories(mockCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionsClick = (e, categoryId) => {
    e.stopPropagation();
    setShowOptionsMenu(showOptionsMenu === categoryId ? null : categoryId);
  };

  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setShowViewModal(true);
    setShowOptionsMenu(null);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteConfirm(true);
    setShowOptionsMenu(null);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    
    try {
      // TODO: Replace with actual delete API call when backend is ready
      setSuccessMessage('Category deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchCategories();
      setShowDeleteConfirm(false);
      setSelectedCategory(null);
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      setShowDeleteConfirm(false);
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      const backPath = userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome';
      onNavigate(backPath);
    } else if (onBack) {
      onBack();
    }
  };

  const handleAdd = () => {
    if (onAddCategory) {
      onAddCategory();
    } else if (onNavigate) {
      onNavigate('addCategory');
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

  // Filter categories based on search
  const filtered = categories.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.main?.toLowerCase().includes(q) ||
      c.sub?.toLowerCase().includes(q) ||
      c.common?.toLowerCase().includes(q);
    return matchesSearch;
  });

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleBack}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={handleStaff}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item" onClick={handleCustomers}>
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
        </div>
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item" onClick={handleSettings}>
          <div className="nav-icon">
            <i className="fas fa-cog"></i>
          </div>
          <span>Settings</span>
        </div>
      </nav>

      {/* Main */}
      <div className="dashboard-main">
        <div className="products-container">
          {/* Header */}
          <header className="products-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Category Master</h1>
              <p className="page-subtitle">Manage product categories</p>
            </div>
          </header>

          {/* Content */}
          <main className="products-content">
            <div className="products-top-section">
              <div className="tab-indicator">
                <span className="tab-dot"></span>
                <span className="tab-label">CATEGORY MASTER</span>
              </div>
            </div>

            <div className="products-heading">
              <h2>Categories</h2>
              <p>Manage and organize product categories with Main, Sub, and Common classifications.</p>
            </div>

            {/* Search and Add Button */}
            <div className="products-controls">
              <div className="products-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="add-product-btn" onClick={handleAdd}>
                <i className="fas fa-plus"></i>
                <span>Add Category</span>
              </button>
            </div>

            {/* Results Count */}
            <div className="products-count">
              {`Showing ${filtered.length} category${filtered.length !== 1 ? 'ies' : 'y'}`}
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

            {/* Categories List */}
            <div className="products-list">
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
                  <i className="fas fa-tags" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Categories Available</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>Categories will appear here once created.</p>
                </div>
              ) : (
                filtered.map((category) => (
                  <div key={category.id} className="product-card">
                    <div className="product-info">
                      <div className="product-main-info">
                        <div>
                          <h3 className="product-name">{category.main || 'N/A'}</h3>
                          <div className="product-details">
                            <span><strong>Sub:</strong> {category.sub || 'N/A'}</span>
                            <span><strong>Common:</strong> {category.common || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="product-actions" ref={menuRef}>
                      <button
                        className="options-btn"
                        onClick={(e) => handleOptionsClick(e, category.id)}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      {showOptionsMenu === category.id && (
                        <div className="options-menu">
                          <button
                            onClick={() => handleViewCategory(category)}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              border: 'none',
                              background: 'transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#333'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            <i className="fas fa-eye" style={{ marginRight: '8px', color: '#007bff' }}></i>
                            View Category
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              border: 'none',
                              background: 'transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#dc3545'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#ffe0e0'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            <i className="fas fa-trash" style={{ marginRight: '8px' }}></i>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* View Category Modal */}
      {showViewModal && selectedCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={() => setShowViewModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Category Details</h2>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <strong>Main Category:</strong> {selectedCategory.main || 'N/A'}
              </div>
              <div>
                <strong>Sub Category:</strong> {selectedCategory.sub || 'N/A'}
              </div>
              <div>
                <strong>Common Category:</strong> {selectedCategory.common || 'N/A'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Delete Category</h2>
            <p style={{ margin: '0 0 20px 0', color: '#666' }}>
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMaster;

