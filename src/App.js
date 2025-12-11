import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Managers from './components/Users';
import AddUser from './components/AddUser';
import Staff from './components/Staff';
import AddStaff from './components/AddStaff';
import Products from './components/Products';
import AddProduct from './components/AddProduct';
import Settings from './components/Settings';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import './components/dashboard.css';
import './components/users.css';
import './components/addUser.css';
import './components/staff.css';
import './components/products.css';
import './components/settings.css';
import './components/profile.css';
import './components/editProfile.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Check if user is already logged in
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    if (!isLoggedIn) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentPage) {
      case 'users':
        return (
          <Managers
            onBack={() => setCurrentPage('dashboard')}
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
            onBack={() => setCurrentPage('dashboard')}
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
            onBack={() => setCurrentPage('dashboard')}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return (
          <Profile
            onBack={() => setCurrentPage('settings')}
            onNavigate={handleNavigation}
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
            onBack={() => setCurrentPage('dashboard')}
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

