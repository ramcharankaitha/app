import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import './products.css';

const ProductList = ({ onBack, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch products from database
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productsAPI.getAll();
      if (response.success) {
        setProducts(response.products || []);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const productName = (product.product_name || '').toLowerCase();
    const itemCode = (product.item_code || '').toLowerCase();
    const skuCode = (product.sku_code || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const supplier = (product.supplier_name || '').toLowerCase();
    
    return (
      productName.includes(query) ||
      itemCode.includes(query) ||
      skuCode.includes(query) ||
      category.includes(query) ||
      supplier.includes(query)
    );
  });

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('dashboard');
    }
  };

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
        <div className="nav-item" onClick={() => onNavigate && onNavigate('users')}>
          <div className="nav-icon">
            <i className="fas fa-users"></i>
          </div>
          <span>Supervisors</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('staff')}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
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
        <div className="nav-item" onClick={() => onNavigate && onNavigate('settings')}>
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
              <h1 className="page-title">All Products</h1>
              <p className="page-subtitle">View all products in inventory</p>
            </div>
          </header>

          {/* Content */}
          <main className="products-content">
            <div className="products-heading">
              <h2>Product Listing</h2>
              <p>Search and view all products in your inventory</p>
            </div>

            {/* Search Bar */}
            <div className="products-controls">
              <div className="products-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by name, item code, SKU, category, or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Product Count */}
            <div className="products-count">
              {loading ? (
                'Loading products...'
              ) : error ? (
                <span style={{ color: '#dc3545' }}>{error}</span>
              ) : (
                `Showing ${filteredProducts.length} of ${products.length} product${products.length !== 1 ? 's' : ''}`
              )}
            </div>

            {/* Error Message */}
            {error && !loading && (
              <div style={{ 
                padding: '12px', 
                background: '#ffe0e0', 
                color: '#dc3545', 
                borderRadius: '8px', 
                marginBottom: '20px' 
              }}>
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666' 
              }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                <p>Loading products...</p>
              </div>
            )}

            {/* Products List */}
            {!loading && !error && (
              <>
                {filteredProducts.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    color: '#666' 
                  }}>
                    <i className="fas fa-box-open" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}></i>
                    <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                      {searchQuery ? 'No products found' : 'No products available'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#999' }}>
                      {searchQuery 
                        ? 'Try adjusting your search query' 
                        : 'Products will appear here once added'}
                    </p>
                  </div>
                ) : (
                  <div className="products-list" style={{ 
                    marginTop: '0', 
                    maxHeight: 'none',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    width: '100%',
                    maxWidth: '100%',
                    position: 'relative'
                  }}>
                    <div style={{
                      minWidth: '100%',
                      width: 'max-content',
                      maxWidth: '100%'
                    }}>
                      <table style={{ 
                        width: '100%', 
                        minWidth: '800px',
                        borderCollapse: 'collapse',
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px var(--shadow-light)',
                        tableLayout: 'auto'
                      }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                          <th style={{ 
                            textAlign: 'left', 
                            fontWeight: '600', 
                            color: '#333', 
                            padding: '14px 16px', 
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '13px'
                          }}>
                            Product Name
                          </th>
                          <th style={{ 
                            textAlign: 'left', 
                            fontWeight: '600', 
                            color: '#333', 
                            padding: '14px 16px', 
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '13px'
                          }}>
                            Item Code
                          </th>
                          <th style={{ 
                            textAlign: 'left', 
                            fontWeight: '600', 
                            color: '#333', 
                            padding: '14px 16px', 
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '13px'
                          }}>
                            SKU Code
                          </th>
                          <th style={{ 
                            textAlign: 'left', 
                            fontWeight: '600', 
                            color: '#333', 
                            padding: '14px 16px', 
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '13px'
                          }}>
                            Category
                          </th>
                          <th style={{ 
                            textAlign: 'center', 
                            fontWeight: '600', 
                            color: '#333', 
                            padding: '14px 16px', 
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '13px'
                          }}>
                            Quantity
                          </th>
                          <th style={{ 
                            textAlign: 'center', 
                            fontWeight: '600', 
                            color: '#333', 
                            padding: '14px 16px', 
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '13px'
                          }}>
                            Sell Rate
                          </th>
                          <th style={{ 
                            textAlign: 'center', 
                            fontWeight: '600', 
                            color: '#333', 
                            padding: '14px 16px', 
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '13px'
                          }}>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product, index) => {
                          const currentQty = parseInt(product.current_quantity) || 0;
                          const minQty = parseInt(product.minimum_quantity) || 0;
                          const isLowStock = currentQty <= minQty && currentQty > 0;
                          const isOutOfStock = currentQty === 0;
                          
                          return (
                            <tr 
                              key={product.id} 
                              style={{ 
                                borderBottom: '1px solid #e9ecef',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <td style={{ 
                                padding: '14px 16px',
                                fontSize: '14px',
                                color: '#333',
                                fontWeight: '600'
                              }}>
                                {product.product_name || 'Unnamed Product'}
                              </td>
                              <td style={{ 
                                padding: '14px 16px',
                                fontSize: '13px',
                                color: '#666',
                                fontFamily: 'monospace'
                              }}>
                                {product.item_code || 'N/A'}
                              </td>
                              <td style={{ 
                                padding: '14px 16px',
                                fontSize: '13px',
                                color: '#666',
                                fontFamily: 'monospace'
                              }}>
                                {product.sku_code || 'N/A'}
                              </td>
                              <td style={{ 
                                padding: '14px 16px',
                                fontSize: '13px',
                                color: '#666'
                              }}>
                                {product.category ? (
                                  <span style={{ 
                                    fontSize: '12px', 
                                    color: '#dc3545',
                                    background: '#ffe0e0',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontWeight: '500',
                                    display: 'inline-block'
                                  }}>
                                    <i className="fas fa-tag" style={{ marginRight: '4px', fontSize: '10px' }}></i>
                                    {product.category}
                                  </span>
                                ) : (
                                  <span style={{ color: '#999' }}>—</span>
                                )}
                              </td>
                              <td style={{ 
                                padding: '14px 16px',
                                textAlign: 'center',
                                fontSize: '14px',
                                color: '#333',
                                fontWeight: '600'
                              }}>
                                <div>
                                  {currentQty.toLocaleString()} {currentQty === 1 ? 'unit' : 'units'}
                                  {minQty > 0 && (
                                    <div style={{ 
                                      fontSize: '11px', 
                                      color: '#999', 
                                      marginTop: '4px',
                                      fontWeight: 'normal'
                                    }}>
                                      Min: {minQty}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ 
                                padding: '14px 16px',
                                textAlign: 'center',
                                fontSize: '14px',
                                color: '#28a745',
                                fontWeight: '600'
                              }}>
                                <div>
                                  {product.sell_rate ? (
                                    <>
                                      ₹{parseFloat(product.sell_rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      {product.mrp && (
                                        <div style={{ 
                                          fontSize: '11px', 
                                          color: '#999', 
                                          marginTop: '4px',
                                          textDecoration: 'line-through',
                                          fontWeight: 'normal'
                                        }}>
                                          MRP: ₹{parseFloat(product.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <span style={{ color: '#999' }}>N/A</span>
                                  )}
                                </div>
                              </td>
                              <td style={{ 
                                padding: '14px 16px',
                                textAlign: 'center'
                              }}>
                                <span className={`product-status ${isOutOfStock ? 'status-outofstock' : isLowStock ? 'status-lowstock' : 'status-instock'}`} style={{
                                  display: 'inline-block',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductList;

