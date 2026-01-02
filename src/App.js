import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import ChitPlanMaster from './components/ChitPlanMaster';
import AddChitPlan from './components/AddChitPlan';
import ChitPlan from './components/ChitPlan';
import ChitPlanList from './components/ChitPlanList';
import ChitEntryMaster from './components/ChitEntryMaster';
import AddChitEntry from './components/AddChitEntry';
import PurchaseOrderMaster from './components/PurchaseOrderMaster';
import AddPurchaseOrder from './components/AddPurchaseOrder';
import PaymentMaster from './components/PaymentMaster';
import AddPayment from './components/AddPayment';
import QuotationMaster from './components/QuotationMaster';
import AddQuotation from './components/AddQuotation';
import StockIn from './components/StockIn';
import StockInMaster from './components/StockInMaster';
import StockOut from './components/StockOut';
import StockOutMaster from './components/StockOutMaster';
import CreateSupplierTransaction from './components/CreateSupplierTransaction';
import SupplierTransactionMaster from './components/SupplierTransactionMaster';
import CategoryMaster from './components/CategoryMaster';
import AddCategory from './components/AddCategory';
import TransactionProducts from './components/TransactionProducts';
import AddProductPricing from './components/AddProductPricing';
import Services from './components/Services';
import AddService from './components/AddService';
import Handler from './components/Handler';
import SalesOrder from './components/SalesOrder';
import AddSalesOrder from './components/AddSalesOrder';
import PurchaseBillAlert from './components/PurchaseBillAlert';
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

// Helper to get user data from localStorage
const getUserData = () => {
  const storedRole = localStorage.getItem('userRole') || 'admin';
  const storedUser = localStorage.getItem('userData');
  let normalizedRole = storedRole;
  if (normalizedRole === 'Super Admin' || normalizedRole === 'admin') {
    normalizedRole = 'admin';
  }
  let userData = null;
  if (storedUser) {
    try {
      userData = JSON.parse(storedUser);
    } catch (e) {
      userData = null;
    }
  }
  return { userRole: normalizedRole, userData };
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const loggedIn = localStorage.getItem('isLoggedIn');
  if (loggedIn !== 'true') {
    return (
      <Login onLoginSuccess={(role, user) => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userData', JSON.stringify(user));
        navigate('/admin/dashboard');
      }} />
    );
  }

  return children;
};

// Wrapper components that get user data
const AdminDashboardWrapper = () => {
  const navigate = useNavigate();
  const { userRole, userData } = getUserData();

  const handleNavigation = (page) => {
    navigate(`/admin/${page}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    navigate('/admin/login');
  };

  const currentPage = window.location.pathname.replace('/admin/', '');

  if (userRole === 'admin') {
    return <Dashboard onLogout={handleLogout} onNavigate={handleNavigation} currentPage={currentPage} />;
  } else if (userRole === 'supervisor') {
    return <SupervisorDashboard onNavigate={handleNavigation} onLogout={handleLogout} userData={userData} currentPage={currentPage} />;
  } else {
    return <StaffDashboard onNavigate={handleNavigation} onLogout={handleLogout} userData={userData} currentPage={currentPage} />;
  }
};

const SupervisorHomeWrapper = () => {
  const navigate = useNavigate();
  const { userData } = getUserData();

  const handleNavigation = (page) => {
    navigate(`/admin/${page}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    navigate('/admin/login');
  };

  const currentPage = window.location.pathname.replace('/admin/', '');
  return <SupervisorDashboard onNavigate={handleNavigation} onLogout={handleLogout} userData={userData} currentPage={currentPage} />;
};

const StaffHomeWrapper = () => {
  const navigate = useNavigate();
  const { userData } = getUserData();

  const handleNavigation = (page) => {
    navigate(`/admin/${page}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    navigate('/admin/login');
  };

  const currentPage = window.location.pathname.replace('/admin/', '');
  return <StaffDashboard onNavigate={handleNavigation} onLogout={handleLogout} userData={userData} currentPage={currentPage} />;
};

// Generic wrapper for components that need navigation
const createNavWrapper = (Component, props = {}) => {
  return () => {
    const navigate = useNavigate();
    const { userRole } = getUserData();

    const handleNavigation = (page) => {
      navigate(`/admin/${page}`);
    };

    const handleLogout = () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      navigate('/admin/login');
    };

    return <Component {...props} onNavigate={handleNavigation} onLogout={handleLogout} userRole={userRole} />;
  };
};

// Admin Routes
const AdminRoutes = () => {
  const navigate = useNavigate();
  const { userRole, userData } = getUserData();

  const handleNavigation = (page) => {
    navigate(`/admin/${page}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    navigate('/admin/login');
  };

  const getBackPath = (defaultPath) => {
    if (userRole === 'admin') return 'dashboard';
    if (userRole === 'supervisor') return 'supervisorHome';
    return 'staffHome';
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLoginSuccess={(role, user) => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userData', JSON.stringify(user));
        navigate('/admin/dashboard');
      }} />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><AdminDashboardWrapper /></ProtectedRoute>} />
      <Route path="/supervisorHome" element={<ProtectedRoute><SupervisorHomeWrapper /></ProtectedRoute>} />
      <Route path="/staffHome" element={<ProtectedRoute><StaffHomeWrapper /></ProtectedRoute>} />
      
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Supervisors
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddUser={() => handleNavigation('addUser')}
              onNavigate={handleNavigation}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addUser"
        element={
          <ProtectedRoute>
            <AddUser onBack={() => handleNavigation('users')} onCancel={() => handleNavigation('users')} onNavigate={handleNavigation} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products
              key="products"
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddProduct={() => handleNavigation('addProduct')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addProduct"
        element={
          <ProtectedRoute>
            <AddProduct onBack={() => handleNavigation('products')} onCancel={() => handleNavigation('products')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onNavigate={handleNavigation}
              onLogout={handleLogout}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile onBack={() => handleNavigation('settings')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/editProfile"
        element={
          <ProtectedRoute>
            <EditProfile onBack={() => handleNavigation('profile')} onNavigate={handleNavigation} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <Staff
              key="staff"
              onBack={() => handleNavigation(userRole === 'admin' ? 'dashboard' : 'supervisorHome')}
              onAddStaff={() => handleNavigation('addStaff')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addStaff"
        element={
          <ProtectedRoute>
            <AddStaff onBack={() => handleNavigation('staff')} onCancel={() => handleNavigation('staff')} onNavigate={handleNavigation} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Customers
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddCustomer={() => handleNavigation('addCustomer')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addCustomer"
        element={
          <ProtectedRoute>
            <AddCustomer onBack={() => handleNavigation('customers')} onCancel={() => handleNavigation('customers')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Suppliers
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddSupplier={() => handleNavigation('addSupplier')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addSupplier"
        element={
          <ProtectedRoute>
            <AddSupplier onBack={() => handleNavigation('suppliers')} onCancel={() => handleNavigation('suppliers')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dispatch"
        element={
          <ProtectedRoute>
            <DispatchDepartment
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddDispatch={() => handleNavigation('addDispatch')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addDispatch"
        element={
          <ProtectedRoute>
            <AddDispatch onBack={() => handleNavigation('dispatch')} onCancel={() => handleNavigation('dispatch')} onNavigate={handleNavigation} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/transport"
        element={
          <ProtectedRoute>
            <TransportMaster
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddTransport={() => handleNavigation('addTransport')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addTransport"
        element={
          <ProtectedRoute>
            <AddTransport onBack={() => handleNavigation('transport')} onCancel={() => handleNavigation('transport')} onNavigate={handleNavigation} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/chitPlans"
        element={
          <ProtectedRoute>
            <ChitPlans
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddChitCustomer={() => handleNavigation('addChitCustomer')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addChitCustomer"
        element={
          <ProtectedRoute>
            <AddChitCustomer onBack={() => handleNavigation('chitPlans')} onCancel={() => handleNavigation('chitPlans')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/chitPlanMaster"
        element={
          <ProtectedRoute>
            <ChitPlanMaster
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddChitPlan={() => handleNavigation('addChitPlan')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addChitPlan"
        element={
          <ProtectedRoute>
            <AddChitPlan onBack={() => handleNavigation('chitPlanMaster')} onCancel={() => handleNavigation('chitPlanMaster')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/chitPlan"
        element={
          <ProtectedRoute>
            <ChitPlanList 
              onBack={() => handleNavigation('masterMenu')} 
              onAddChitPlan={() => handleNavigation('addChitPlanCustomer')} 
              onNavigate={handleNavigation} 
              userRole={userRole} 
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addChitPlanCustomer"
        element={
          <ProtectedRoute>
            <ChitPlan onBack={() => handleNavigation('chitPlan')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/stockInMaster"
        element={
          <ProtectedRoute>
            <StockInMaster
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddStockIn={() => handleNavigation('stockIn')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/stockIn"
        element={
          <ProtectedRoute>
            <StockIn
              onBack={() => handleNavigation('stockInMaster')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/stockOutMaster"
        element={
          <ProtectedRoute>
            <StockOutMaster
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddStockOut={() => handleNavigation('stockOut')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/stockOut"
        element={
          <ProtectedRoute>
            <StockOut
              onBack={() => handleNavigation('stockOutMaster')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/supplierTransactionMaster"
        element={
          <ProtectedRoute>
            <SupplierTransactionMaster
              onBack={() => handleNavigation('transactionMenu')}
              onAddTransaction={() => handleNavigation('createSupplier')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/createSupplier"
        element={
          <ProtectedRoute>
            <CreateSupplierTransaction
              onBack={() => handleNavigation('supplierTransactionMaster')}
              onCancel={() => handleNavigation('supplierTransactionMaster')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/categoryMaster"
        element={
          <ProtectedRoute>
            <CategoryMaster
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddCategory={() => handleNavigation('addCategory')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addCategory"
        element={
          <ProtectedRoute>
            <AddCategory onBack={() => handleNavigation('categoryMaster')} onCancel={() => handleNavigation('categoryMaster')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/transactionProducts"
        element={
          <ProtectedRoute>
            <TransactionProducts
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddPricing={() => handleNavigation('addProductPricing')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addProductPricing"
        element={
          <ProtectedRoute>
            <AddProductPricing onBack={() => handleNavigation('transactionProducts')} onCancel={() => handleNavigation('transactionProducts')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <Services
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddService={() => handleNavigation('addService')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addService"
        element={
          <ProtectedRoute>
            <AddService onBack={() => handleNavigation('services')} onCancel={() => handleNavigation('services')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/handler"
        element={
          <ProtectedRoute>
            <Handler
              onBack={() => handleNavigation('staffHome')}
              onNavigate={handleNavigation}
              userData={userData}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/salesOrder"
        element={
          <ProtectedRoute>
            <SalesOrder
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onAddSalesOrder={() => handleNavigation('addSalesOrder')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/chitEntryMaster"
        element={
          <ProtectedRoute>
            <ChitEntryMaster
              onBack={() => handleNavigation('transactionMenu')}
              onAddChitEntry={() => handleNavigation('addChitEntry')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/quotationMaster"
        element={
          <ProtectedRoute>
            <QuotationMaster
              onBack={() => handleNavigation('transactionMenu')}
              onAddQuotation={() => handleNavigation('addQuotation')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addQuotation"
        element={
          <ProtectedRoute>
            <AddQuotation onBack={() => handleNavigation('quotationMaster')} onCancel={() => handleNavigation('quotationMaster')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addChitEntry"
        element={
          <ProtectedRoute>
            <AddChitEntry
              onBack={() => handleNavigation('chitEntryMaster')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/purchaseOrderMaster"
        element={
          <ProtectedRoute>
            <PurchaseOrderMaster
              onBack={() => handleNavigation('transactionMenu')}
              onAddPurchaseOrder={() => handleNavigation('addPurchaseOrder')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addPurchaseOrder"
        element={
          <ProtectedRoute>
            <AddPurchaseOrder
              onBack={() => handleNavigation('purchaseOrderMaster')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/paymentMaster"
        element={
          <ProtectedRoute>
            <PaymentMaster
              onBack={() => handleNavigation('transactionMenu')}
              onAddPayment={() => handleNavigation('addPayment')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addPayment"
        element={
          <ProtectedRoute>
            <AddPayment
              onBack={() => handleNavigation('paymentMaster')}
              onCancel={() => handleNavigation('paymentMaster')}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addSalesOrder"
        element={
          <ProtectedRoute>
            <AddSalesOrder onBack={() => handleNavigation('salesOrder')} onCancel={() => handleNavigation('salesOrder')} onNavigate={handleNavigation} userRole={userRole} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/purchaseBillAlert"
        element={
          <ProtectedRoute>
            <PurchaseBillAlert
              onBack={() => handleNavigation(getBackPath('dashboard'))}
              onNavigate={handleNavigation}
              userRole={userRole}
            />
          </ProtectedRoute>
        }
      />
      
      <Route path="/transactionMenu" element={<ProtectedRoute><AdminDashboardWrapper /></ProtectedRoute>} />
      <Route path="/masterMenu" element={<ProtectedRoute><AdminDashboardWrapper /></ProtectedRoute>} />
      
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          
          {/* Default route - redirect to admin login */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          
          {/* Catch all - redirect to admin login */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
