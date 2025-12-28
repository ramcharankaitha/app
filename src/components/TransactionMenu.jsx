import React from 'react';

const TransactionMenu = ({ onNavigate, onBack }) => {
  const sections = [
    { title: 'Dispatch Department', desc: 'Manage dispatch workflows', target: 'dispatch', icon: 'fa-shipping-fast' },
    { title: 'Stock In', desc: 'Record stock entries', target: 'stockInMaster', icon: 'fa-box-open' },
    { title: 'Stock Out', desc: 'Record stock exits', target: 'stockOutMaster', icon: 'fa-box' },
    { title: 'Supplier Transaction', desc: 'Record products from supplier', target: 'supplierTransactionMaster', icon: 'fa-truck' },
    { title: 'Products', desc: 'Manage product pricing', target: 'transactionProducts', icon: 'fa-tags' },
    { title: 'Services', desc: 'Manage service transactions', target: 'services', icon: 'fa-cog' },
    { title: 'Sales Order', desc: 'View and manage sales orders', target: 'salesOrder', icon: 'fa-chart-line' },
    { title: 'Entry Chit', desc: 'Record chit payments', target: 'chitEntryMaster', icon: 'fa-file-invoice-dollar' },
    { title: 'Purchase Order', desc: 'Create and manage purchase orders', target: 'purchaseOrderMaster', icon: 'fa-shopping-cart' },
    { title: 'Purchase Bill Alert', desc: 'Monitor purchase bill alerts', target: 'purchaseBillAlert', icon: 'fa-bell' },
  ];

  const handleOpen = (target) => {
    if (target && onNavigate) {
      onNavigate(target);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        <header className="dashboard-header" style={{ padding: '16px 24px' }}>
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => onBack && onBack()}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-title">
              <h1>Transaction Section</h1>
              <p>Access transaction management sections</p>
            </div>
          </div>
        </header>

        <main className="dashboard-content" style={{ padding: '16px 24px' }}>
          <div className="master-menu-grid">
            {sections.map((item) => (
              <div
                key={item.title}
                className="stat-card"
                style={{ cursor: item.target ? 'pointer' : 'default' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpen(item.target);
                }}
              >
                <div className="stat-content">
                  <h3 className="stat-title">{item.title}</h3>
                  <p className="stat-subtitle">{item.desc}</p>
                </div>
                <div className="stat-icon" style={{ backgroundColor: '#dc354520', color: '#dc3545' }}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TransactionMenu;

