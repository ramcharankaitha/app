import React from 'react';

const MasterMenu = ({ onNavigate, onBack }) => {
  const sections = [
    { title: 'Transport Master', desc: 'Transport partners & routes', target: 'transport' },
    { title: 'Products', desc: 'Product inventory & management', target: 'products' },
    { title: 'Supply Master', desc: 'Suppliers and logistics', target: 'suppliers' },
    { title: 'Category Master', desc: 'Product categories', target: 'categoryMaster' },
    { title: 'Customers', desc: 'Customer management & details', target: 'customers' },
    { title: 'Chit Plan Master', desc: 'Create and manage chit plans', target: 'chitPlanMaster' },
    { title: 'Chit Plan', desc: 'Create customers with chit plans', target: 'chitPlan' },
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
              <h1>Master Menu</h1>
              <p>Access master data sections</p>
            </div>
          </div>
        </header>

        <main className="dashboard-content" style={{ padding: '16px 24px' }}>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {sections.map((item) => (
              <div
                key={item.title}
                className="stat-card"
                style={{ cursor: item.target ? 'pointer' : 'default' }}
                onClick={() => handleOpen(item.target)}
              >
                <div className="stat-content">
                  <h3 className="stat-title">{item.title}</h3>
                  <p className="stat-subtitle">{item.desc}</p>
                </div>
                <div className="stat-icon" style={{ backgroundColor: '#dc354520', color: '#dc3545' }}>
                  <i className="fas fa-folder-open"></i>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MasterMenu;


