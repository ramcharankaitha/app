import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ManagerDashboard from './components/ManagerDashboard';
import Managers from './components/Users';
import AddUser from './components/AddUser';
import Staff from './components/Staff';
import AddStaff from './components/AddStaff';
import Products from './components/Products';
import AddProduct from './components/AddProduct';
import Customers from './components/Customers';
import AddCustomer from './components/AddCustomer';
import Suppliers from './components/Suppliers';
import AddSupplier from './components/AddSupplier';
import ChitPlans from './components/ChitPlans';
import AddChitCustomer from './components/AddChitCustomer';
import Settings from './components/Settings';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import './components/dashboard.css';
import './components/users.css';
import './components/addUser.css';
import './components/staff.css';
import './components/products.css';
import './components/customers.css';
import './components/suppliers.css';
import './components/chitPlans.css';
import './components/settings.css';
import './components/profile.css';
import './components/editProfile.css';
import './components/managerDashboard.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userRole, setUserRole] = useState('admin');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    let storedRole = localStorage.getItem('userRole') || 'admin';
    const storedUser = localStorage.getItem('userData');
    
    if (storedRole === 'Super Admin' || storedRole === 'admin') {
      storedRole = 'admin';
    }
    
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
      setUserRole(storedRole);
      if (storedUser) {
        try {
          setUserData(JSON.parse(storedUser));
        } catch (e) {
          setUserData(null);
        }
      }
      setCurrentPage(storedRole === 'admin' ? 'dashboard' : 'managerHome');
    }
  }, []);

  const handleLoginSuccess = (role = 'admin', user = null) => {
    let normalizedRole = role;
    if (role === 'Super Admin' || role === 'admin') {
      normalizedRole = 'admin';
    }
    
    setIsLoggedIn(true);
    setUserRole(normalizedRole);
    setUserData(user);
    setCurrentPage(normalizedRole === 'admin' ? 'dashboard' : 'managerHome');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserRole('admin');
    setUserData(null);
    setCurrentPage('dashboard');
  };

  const mapPageForRole = (page) => {
    if (page === 'dashboard' && userRole !== 'admin') {
      return 'managerHome';
    }
    return page;
  };

  const handleNavigation = (page) => {
    setCurrentPage(mapPageForRole(page));
  };

  const renderPage = () => {
    if (!isLoggedIn) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentPage) {
      case 'users':
        return (
          <Managers
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : 'managerHome')}
            onAddUser={() => setCurrentPage('addUser')}
            onNavigate={handleNavigation}
          />
        );
      case 'addUser':
        return (
          <AddUser
            onBack={() => setCurrentPage('users')}
            onCancel={() => setCurrentPage('users')}
            onNavigate={handleNavigation}
          />
        );
      case 'products':
        return (
          <Products
            key="products"
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : 'managerHome')}
            onAddProduct={() => setCurrentPage('addProduct')}
            onNavigate={handleNavigation}
          />
        );
      case 'addProduct':
        return (
          <AddProduct
            onBack={() => setCurrentPage('products')}
            onCancel={() => setCurrentPage('products')}
            onNavigate={handleNavigation}
          />
        );
      case 'settings':
        return (
          <Settings
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : 'managerHome')}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            userRole={userRole}
          />
        );
      case 'profile':
        return (
          <Profile
            onBack={() => setCurrentPage('settings')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'editProfile':
        return (
          <EditProfile
            onBack={() => setCurrentPage('profile')}
            onNavigate={handleNavigation}
          />
        );
      case 'staff':
        return (
          <Staff
            key="staff"
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : 'managerHome')}
            onAddStaff={() => setCurrentPage('addStaff')}
            onNavigate={handleNavigation}
          />
        );
      case 'addStaff':
        return (
          <AddStaff
            onBack={() => setCurrentPage('staff')}
            onCancel={() => setCurrentPage('staff')}
            onNavigate={handleNavigation}
          />
        );
      case 'customers':
        return (
          <Customers
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : 'managerHome')}
            onAddCustomer={() => setCurrentPage('addCustomer')}
            onNavigate={handleNavigation}
          />
        );
      case 'addCustomer':
        return (
          <AddCustomer
            onBack={() => setCurrentPage('customers')}
            onCancel={() => setCurrentPage('customers')}
            onNavigate={handleNavigation}
          />
        );
      case 'suppliers':
        return (
          <Suppliers
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : 'managerHome')}
            onAddSupplier={() => setCurrentPage('addSupplier')}
            onNavigate={handleNavigation}
          />
        );
      case 'addSupplier':
        return (
          <AddSupplier
            onBack={() => setCurrentPage('suppliers')}
            onCancel={() => setCurrentPage('suppliers')}
            onNavigate={handleNavigation}
          />
        );
      case 'chitPlans':
        return (
          <ChitPlans
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : 'managerHome')}
            onAddChitCustomer={() => setCurrentPage('addChitCustomer')}
            onNavigate={handleNavigation}
          />
        );
      case 'addChitCustomer':
        return (
          <AddChitCustomer
            onBack={() => setCurrentPage('chitPlans')}
            onCancel={() => setCurrentPage('chitPlans')}
            onNavigate={handleNavigation}
          />
        );
      case 'managerHome':
        return (
          <ManagerDashboard
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            userData={userData}
            currentPage={currentPage}
          />
        );
      default:
        return (
          <Dashboard
            onLogout={handleLogout}
            onNavigate={handleNavigation}
            currentPage={currentPage}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      {renderPage()}
    </ThemeProvider>
  );
}

export default App;

