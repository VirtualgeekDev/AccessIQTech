import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Settings,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const Billing: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [billingData, setBillingData] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, [activeTab]);

  const fetchBillingData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '/api/billing';
      
      switch (activeTab) {
        case 'overview':
          endpoint += '/overview';
          break;
        case 'history':
          endpoint += '/history';
          break;
        case 'payment':
          endpoint += '/payment-method';
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch billing data: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch billing data');
      }

      switch (activeTab) {
        case 'overview':
          setBillingData(data.data);
          // Also fetch usage stats
          fetchUsageStats();
          break;
        case 'history':
          setBillingHistory(data.data);
          break;
        case 'payment':
          setPaymentMethod(data.data);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/billing/usage', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsageStats(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    }
  };
  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'history', name: 'Billing History' },
    { id: 'payment', name: 'Payment Method' }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription, payment methods, and billing history.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-brand-accent text-brand-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={fetchBillingData}
                  className="mt-4 bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400"
                >
                  Retry
                </button>
              </div>
            ) : billingData ? (
          <div className="space-y-8">
            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user?.subscriptionStatus === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user?.subscriptionStatus === 'trialing' ? 'Free Trial' : 'Active'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {billingData?.current_plan?.name || 'N/A'} Plan
                  </h3>
                  <p className="text-3xl font-bold text-gray-900">
                    ${billingData?.current_plan?.billing_cycle === 'annual' 
                      ? Math.floor((billingData?.current_plan?.price_annual || 0) / 12)
                      : (billingData?.current_plan?.price_monthly || 0)}
                    <span className="text-lg font-normal text-gray-500">/month</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Billed {billingData?.current_plan?.billing_cycle || 'monthly'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Next Billing Date</h4>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">
                      {billingData?.next_billing?.date ? formatDate(billingData.next_billing.date) : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    ${billingData?.next_billing?.amount?.toFixed(2) || '0.00'} will be charged
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h4>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">
                      {billingData?.payment_method?.brand || 'N/A'} •••• {billingData?.payment_method?.last4 || '****'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Expires {billingData?.payment_method?.expiryMonth || 'MM'}/{billingData?.payment_method?.expiryYear || 'YYYY'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/pricing"
                    className="bg-brand-accent text-brand-dark px-4 py-2 rounded-md font-medium hover:bg-yellow-400 transition-colors text-center"
                  >
                    Change Plan
                  </Link>
                  <button 
                    onClick={() => alert('Cancel Subscription\n\nThis feature allows you to cancel your subscription. Your access will continue until the end of your current billing period.\n\nWould you like to proceed with cancellation?')}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>

            {/* Usage Summary */}
            {usageStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">This Month's Usage</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{usageStats.scans_used}</div>
                  <div className="text-sm text-gray-600">Scans Used</div>
                  <div className="text-xs text-gray-500 mt-1">
                    of {usageStats.scan_limit === 999999 ? 'unlimited' : usageStats.scan_limit} included
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{usageStats.websites_scanned}</div>
                  <div className="text-sm text-gray-600">Websites Scanned</div>
                  <div className="text-xs text-gray-500 mt-1">unlimited</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{usageStats.reports_generated}</div>
                  <div className="text-sm text-gray-600">Reports Generated</div>
                  <div className="text-xs text-gray-500 mt-1">unlimited</div>
                </div>
              </div>
            </div>
            )}

            {/* Trial Status (if applicable) */}
            {billingData?.trial_info?.is_trial && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium text-blue-900">Free Trial Active</h3>
                    <p className="text-blue-700 mt-1">
                      Your 14-day free trial expires in {billingData?.trial_info?.days_remaining || 0} days. 
                      Upgrade to continue using AccessIQ Tech without interruption.
                    </p>
                    <div className="mt-4">
                      <Link
                        to="/pricing"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors inline-block"
                      >
                        Upgrade Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
            ) : null}
          </>
        )}

        {/* Billing History Tab */}
        {activeTab === 'history' && (
          <>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={fetchBillingData}
                  className="mt-4 bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400"
                >
                  Retry
                </button>
              </div>
            ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
                <button 
                  onClick={() => alert('Download All Invoices\n\nThis will download a ZIP file containing all your invoices and receipts.\n\nFeature coming soon!')}
                  className="flex items-center space-x-2 text-brand-accent hover:text-yellow-600 font-medium"
                >
                  <Download className="h-5 w-5" />
                  <span>Download All</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingHistory?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item?.date || new Date().toISOString())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item?.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(item?.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item?.status || 'unknown')}`}>
                          {(item?.status || 'unknown').charAt(0).toUpperCase() + (item?.status || 'unknown').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => alert(`Download Invoice: ${item?.invoice || 'N/A'}\n\nThis will download the PDF invoice for this transaction.\n\nFeature coming soon!`)}
                          className="text-brand-accent hover:text-yellow-600 font-medium flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>{item?.invoice || 'N/A'}</span>
                        </button>
                      </td>
                    </tr>
                  )) || []}
                </tbody>
              </table>
              {(!billingHistory || billingHistory.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No billing history available</p>
                </div>
              )}
            </div>
          </div>
            )}
          </>
        )}

        {/* Payment Method Tab */}
        {activeTab === 'payment' && (
          <>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={fetchBillingData}
                  className="mt-4 bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400"
                >
                  Retry
                </button>
              </div>
            ) : paymentMethod ? (
          <div className="space-y-8">
            {/* Current Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{(paymentMethod?.payment_method?.brand || 'CARD').toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {paymentMethod?.payment_method?.brand || 'Card'} ending in {paymentMethod?.payment_method?.last4 || '****'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires {paymentMethod?.payment_method?.expiryMonth || 'MM'}/{paymentMethod?.payment_method?.expiryYear || 'YYYY'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => alert('Update Payment Method\n\nThis will allow you to update your credit card information.\n\nFeature coming soon!')}
                  className="text-brand-accent hover:text-yellow-600 font-medium"
                >
                  Update
                </button>
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={() => alert('Add New Payment Method\n\nThis will allow you to add a new credit card or payment method to your account.\n\nFeature coming soon!')}
                  className="bg-brand-accent text-brand-dark px-4 py-2 rounded-md font-medium hover:bg-yellow-400 transition-colors"
                >
                  Add New Payment Method
                </button>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Address</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900">{paymentMethod?.billing_address?.name || 'N/A'}</p>
                  <p className="text-gray-600">{paymentMethod?.billing_address?.email || 'N/A'}</p>
                </div>
                <div className="text-gray-600">
                  <p>{paymentMethod?.billing_address?.address || 'N/A'}</p>
                  <p>{paymentMethod?.billing_address?.city || 'N/A'}, {paymentMethod?.billing_address?.state || 'N/A'} {paymentMethod?.billing_address?.postal_code || 'N/A'}</p>
                  <p>{paymentMethod?.billing_address?.country || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={() => alert('Update Billing Address\n\nThis will allow you to update your billing address information.\n\nFeature coming soon!')}
                  className="text-brand-accent hover:text-yellow-600 font-medium"
                >
                  Update Billing Address
                </button>
              </div>
            </div>

            {/* Tax Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tax Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your tax ID"
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type
                  </label>
                  <select className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent">
                    <option value="">Select business type</option>
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                    <option value="nonprofit">Non-profit</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={() => alert('Save Tax Information\n\nThis will save your tax ID and business type for invoicing purposes.\n\nFeature coming soon!')}
                  className="bg-brand-accent text-brand-dark px-4 py-2 rounded-md font-medium hover:bg-yellow-400 transition-colors"
                >
                  Save Tax Information
                </button>
              </div>
            </div>
          </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default Billing;