import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { BlogProvider } from './contexts/BlogContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Blog from './pages/Blog';
import Integrations from './pages/Integrations';
import Contact from './pages/Contact';
import SingleArticle from './pages/SingleArticle';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import SingleScanReport from './pages/SingleScanReport';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Billing from './pages/Billing';
import AdminPanel from './pages/AdminPanel';
import Checkout from './pages/Checkout';
import PrivateCheckout from './pages/PrivateCheckout';
import Subscription from './pages/Subscription';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import CookiePolicy from './pages/CookiePolicy';
import GDPR from './pages/GDPR';
import RefundPolicy from './pages/RefundPolicy';
import PaymentPolicy from './pages/PaymentPolicy';
import Docs from './pages/Docs';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Layout component to conditionally show header/footer
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BlogProvider>
          <Router>
            <Routes>
              {/* Standalone pages without header/footer */}
              <Route path="/private-checkout" element={<PrivateCheckout />} />
              <Route path="/subscription" element={<Subscription />} />
              
              {/* All other routes with header/footer */}
              <Route path="/" element={<AppLayout><Home /></AppLayout>} />
              <Route path="/features" element={<AppLayout><Features /></AppLayout>} />
              <Route path="/pricing" element={<AppLayout><Pricing /></AppLayout>} />
              <Route path="/about" element={<AppLayout><About /></AppLayout>} />
              <Route path="/blog" element={<AppLayout><Blog /></AppLayout>} />
              <Route path="/blog/:slug" element={<AppLayout><SingleArticle /></AppLayout>} />
              <Route path="/integrations" element={<AppLayout><Integrations /></AppLayout>} />
              <Route path="/contact" element={<AppLayout><Contact /></AppLayout>} />
              <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
              <Route path="/signup" element={<AppLayout><SignUp /></AppLayout>} />
              <Route path="/checkout" element={<AppLayout><Checkout /></AppLayout>} />
              <Route path="/privacy" element={<AppLayout><Privacy /></AppLayout>} />
              <Route path="/terms" element={<AppLayout><Terms /></AppLayout>} />
              <Route path="/cookie-policy" element={<AppLayout><CookiePolicy /></AppLayout>} />
              <Route path="/gdpr" element={<AppLayout><GDPR /></AppLayout>} />
              <Route path="/refund-policy" element={<AppLayout><RefundPolicy /></AppLayout>} />
              <Route path="/payment-policy" element={<AppLayout><PaymentPolicy /></AppLayout>} />
              <Route path="/docs" element={<AppLayout><Docs /></AppLayout>} />
              <Route path="/verify-email" element={<AppLayout><VerifyEmail /></AppLayout>} />
              <Route path="/reset-password" element={<AppLayout><ResetPassword /></AppLayout>} />
              <Route 
                path="/dashboard" 
                element={
                  <AppLayout>
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  </AppLayout>
                } 
              />
              <Route 
                path="/dashboard/scan/:id" 
                element={
                  <AppLayout>
                    <ProtectedRoute>
                      <SingleScanReport />
                    </ProtectedRoute>
                  </AppLayout>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <AppLayout>
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  </AppLayout>
                } 
              />
              <Route 
                path="/billing" 
                element={
                  <AppLayout>
                    <ProtectedRoute>
                      <Billing />
                    </ProtectedRoute>
                  </AppLayout>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AppLayout>
                    <ProtectedRoute adminOnly>
                      <AdminPanel />
                    </ProtectedRoute>
                  </AppLayout>
                } 
              />
              <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
            </Routes>
          </Router>
        </BlogProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;