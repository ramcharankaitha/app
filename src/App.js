import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import StaffDashboard from './components/StaffDashboard';
import Supervisors from './components/Users';
import AddUser from './components/AddUser';
import Staff from './components/Staff';
import AddStaff from './components/AddStaff';
import Products from './components/Products';
import AddProduct from './components/AddProduct';
import Customers from './components/Customers';
import AddCustomer from './components/AddCustomer';
import Suppliers from './components/Suppliers';
import AddSupplier from './components/AddSupplier';
import DispatchDepartment from './components/DispatchDepartment';
import AddDispatch from './components/AddDispatch';
import TransportMaster from './components/TransportMaster';
import AddTransport from './components/AddTransport';
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
import './components/supervisorDashboard.css';

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
      if (storedRole === 'admin') {
        setCurrentPage('dashboard');
      } else if (storedRole === 'supervisor') {
        setCurrentPage('supervisorHome');
      } else if (storedRole === 'staff') {
        setCurrentPage('staffHome');
      }
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
    if (normalizedRole === 'admin') {
      setCurrentPage('dashboard');
    } else if (normalizedRole === 'supervisor') {
      setCurrentPage('supervisorHome');
    } else if (normalizedRole === 'staff') {
      setCurrentPage('staffHome');
    }
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
      return 'supervisorHome';
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
          <Supervisors
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : 'supervisorHome')}
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
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome')}
            onAddProduct={() => setCurrentPage('addProduct')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'addProduct':
        return (
          <AddProduct
            onBack={() => setCurrentPage('products')}
            onCancel={() => setCurrentPage('products')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'settings':
        return (
          <Settings
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome')}
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
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : 'supervisorHome')}
            onAddStaff={() => setCurrentPage('addStaff')}
            onNavigate={handleNavigation}
            userRole={userRole}
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
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome')}
            onAddCustomer={() => setCurrentPage('addCustomer')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'addCustomer':
        return (
          <AddCustomer
            onBack={() => setCurrentPage('customers')}
            onCancel={() => setCurrentPage('customers')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'suppliers':
        return (
          <Suppliers
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome')}
            onAddSupplier={() => setCurrentPage('addSupplier')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'addSupplier':
        return (
          <AddSupplier
            onBack={() => setCurrentPage('suppliers')}
            onCancel={() => setCurrentPage('suppliers')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'dispatch':
        return (
          <DispatchDepartment
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome')}
            onAddDispatch={() => setCurrentPage('addDispatch')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'addDispatch':
        return (
          <AddDispatch
            onBack={() => setCurrentPage('dispatch')}
            onCancel={() => setCurrentPage('dispatch')}
            onNavigate={handleNavigation}
          />
        );
      case 'transport':
        return (
          <TransportMaster
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome')}
            onAddTransport={() => setCurrentPage('addTransport')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'addTransport':
        return (
          <AddTransport
            onBack={() => setCurrentPage('transport')}
            onCancel={() => setCurrentPage('transport')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'chitPlans':
        return (
          <ChitPlans
            onBack={() => setCurrentPage(userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome')}
            onAddChitCustomer={() => setCurrentPage('addChitCustomer')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'addChitCustomer':
        return (
          <AddChitCustomer
            onBack={() => setCurrentPage('chitPlans')}
            onCancel={() => setCurrentPage('chitPlans')}
            onNavigate={handleNavigation}
            userRole={userRole}
          />
        );
      case 'masterMenu':
        return userRole === 'admin' ? (
          <Dashboard
            onLogout={handleLogout}
            onNavigate={handleNavigation}
            currentPage={currentPage}
          />
        ) : userRole === 'supervisor' ? (
          <SupervisorDashboard
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            userData={userData}
            currentPage={currentPage}
          />
        ) : (
          <StaffDashboard
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            userData={userData}
            currentPage={currentPage}
          />
        );
      case 'supervisorHome':
        return (
          <SupervisorDashboard
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            userData={userData}
            currentPage={currentPage}
          />
        );
      case 'staffHome':
        return (
          <StaffDashboard
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            userData={userData}
            currentPage={currentPage}
          />
        );
      default:
        return userRole === 'admin' ? (
          <Dashboard
            onLogout={handleLogout}
            onNavigate={handleNavigation}
            currentPage={currentPage}
          />
        ) : userRole === 'supervisor' ? (
          <SupervisorDashboard
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            userData={userData}
            currentPage={currentPage}
          />
        ) : (
          <StaffDashboard
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            userData={userData}
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

