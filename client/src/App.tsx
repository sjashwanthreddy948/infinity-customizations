import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { WebSocketProvider } from './context/WebSocketContext.js';

// Layout
import { AppLayout } from './components/layout/AppLayout.js';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage.js';

// Functional Pages
import { DashboardPage } from './pages/dashboard/DashboardPage.js';
import { OrdersPage } from './pages/orders/OrdersPage.js';
import { OrderDetailPage } from './pages/orders/OrderDetailPage.js';
import { TShirtsPage } from './pages/tshirts/TShirtsPage.js';
import { CustomersPage } from './pages/customers/CustomersPage.js';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage.js';
import { InvoicesPage } from './pages/invoices/InvoicesPage.js';
import { InvoiceDetailPage } from './pages/invoices/InvoiceDetailPage.js';
import { ExpensesPage } from './pages/expenses/ExpensesPage.js';
import { ReportsPage } from './pages/reports/ReportsPage.js';
import { AIInvoicePage } from './pages/ai-invoice/AIInvoicePage.js';
import { SettingsPage } from './pages/settings/SettingsPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#051E44] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B3A82] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-bold animate-bounce shadow-xl">
            <svg className="w-7 h-7 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-bold">Infinity Customizations...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <WebSocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />

                {/* Protected Business App Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                  <Route path="/t-shirts" element={<TShirtsPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/customers/:id" element={<CustomerDetailPage />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/ai-invoice" element={<AIInvoicePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </WebSocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
