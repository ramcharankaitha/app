// Optimized App.js with lazy loading for better performance
// This file demonstrates code splitting - you can replace App.js with this

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

// Lazy load components for code splitting
const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const SupervisorDashboard = lazy(() => import('./components/SupervisorDashboard'));
const StaffDashboard = lazy(() => import('./components/StaffDashboard'));
const Supervisors = lazy(() => import('./components/Users'));
const AddUser = lazy(() => import('./components/AddUser'));
const Staff = lazy(() => import('./components/Staff'));
const AddStaff = lazy(() => import('./components/AddStaff'));
const Products = lazy(() => import('./components/Products'));
const AddProduct = lazy(() => import('./components/AddProduct'));
const Customers = lazy(() => import('./components/Customers'));
const AddCustomer = lazy(() => import('./components/AddCustomer'));
const Suppliers = lazy(() => import('./components/Suppliers'));
const AddSupplier = lazy(() => import('./components/AddSupplier'));
const DispatchDepartment = lazy(() => import('./components/DispatchDepartment'));
const AddDispatch = lazy(() => import('./components/AddDispatch'));
const TransportMaster = lazy(() => import('./components/TransportMaster'));
const AddTransport = lazy(() => import('./components/AddTransport'));
const ChitPlans = lazy(() => import('./components/ChitPlans'));
const AddChitCustomer = lazy(() => import('./components/AddChitCustomer'));
const ChitPlanMaster = lazy(() => import('./components/ChitPlanMaster'));
const AddChitPlan = lazy(() => import('./components/AddChitPlan'));
const ChitPlan = lazy(() => import('./components/ChitPlan'));
const ChitPlanList = lazy(() => import('./components/ChitPlanList'));
const ChitEntryMaster = lazy(() => import('./components/ChitEntryMaster'));
const AddChitEntry = lazy(() => import('./components/AddChitEntry'));
const PurchaseOrderMaster = lazy(() => import('./components/PurchaseOrderMaster'));
const AddPurchaseOrder = lazy(() => import('./components/AddPurchaseOrder'));
const QuotationMaster = lazy(() => import('./components/QuotationMaster'));
const AddQuotation = lazy(() => import('./components/AddQuotation'));
const StockIn = lazy(() => import('./components/StockIn'));
const StockInMaster = lazy(() => import('./components/StockInMaster'));
const StockOut = lazy(() => import('./components/StockOut'));
const StockOutMaster = lazy(() => import('./components/StockOutMaster'));
const CreateSupplierTransaction = lazy(() => import('./components/CreateSupplierTransaction'));
const SupplierTransactionMaster = lazy(() => import('./components/SupplierTransactionMaster'));
const CategoryMaster = lazy(() => import('./components/CategoryMaster'));
const AddCategory = lazy(() => import('./components/AddCategory'));
const TransactionProducts = lazy(() => import('./components/TransactionProducts'));
const AddProductPricing = lazy(() => import('./components/AddProductPricing'));
const Services = lazy(() => import('./components/Services'));
const AddService = lazy(() => import('./components/AddService'));
const Handler = lazy(() => import('./components/Handler'));
const SalesOrder = lazy(() => import('./components/SalesOrder'));
const AddSalesOrder = lazy(() => import('./components/AddSalesOrder'));
const PurchaseBillAlert = lazy(() => import('./components/PurchaseBillAlert'));
const Settings = lazy(() => import('./components/Settings'));
const Profile = lazy(() => import('./components/Profile'));
const EditProfile = lazy(() => import('./components/EditProfile'));

// Import CSS (these are small and can stay synchronous)
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

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    <div>Loading...</div>
  </div>
);

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

// Protected Route Component with Suspense
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const loggedIn = localStorage.getItem('isLoggedIn');
  
  if (loggedIn !== 'true') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Login onLoginSuccess={(role, user) => {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', role);
          localStorage.setItem('userData', JSON.stringify(user));
          navigate('/admin/dashboard');
        }} />
      </Suspense>
    );
  }

  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
};

// Note: You'll need to update the rest of App.js to use Suspense for all lazy-loaded components
// This is a template showing the pattern

