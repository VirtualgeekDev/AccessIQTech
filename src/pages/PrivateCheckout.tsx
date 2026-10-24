import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Lock, CreditCard, Shield } from 'lucide-react';

const PrivateCheckout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: false,
    paypalEnabled: false
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  // Get parameters from URL
  const price = searchParams.get('price') || '15.00';
  const currency = searchParams.get('currency') || '€';
  const product = searchParams.get('product') || 'Starter program';
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    adultPack: false,
    paymentMethod: 'stripe'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fetch payment settings on component mount
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch('/api/settings/public-settings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            setPaymentSettings({
              stripeEnabled: data.settings.stripe_enabled || false,
              paypalEnabled: data.settings.paypal_enabled || false
            });
            
            // Set default payment method to the first enabled option
            if (data.settings.stripe_enabled && !data.settings.paypal_enabled) {
              setFormData(prev => ({ ...prev, paymentMethod: 'stripe' }));
            } else if (!data.settings.stripe_enabled && data.settings.paypal_enabled) {
              setFormData(prev => ({ ...prev, paymentMethod: 'paypal' }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment settings:', error);
        // Default to both enabled if fetch fails
        setPaymentSettings({ stripeEnabled: true, paypalEnabled: true });
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchPaymentSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const orderData = {
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        adultPack: formData.adultPack,
        paymentMethod: formData.paymentMethod,
        product: product,
        price: price,
        currency: currency,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/private_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Order processing failed');
      }

      if (result.success) {
        setOrderComplete(true);
      } else {
        throw new Error(result.error || 'Order processing failed');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert(error instanceof Error ? error.message : 'Order processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Order Details:</strong><br />
              {product} - {currency}{price}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 pt-8 px-4">
          <div className="flex items-center space-x-4 sm:space-x-8 justify-center">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className={`text-xs sm:text-sm font-medium ${
                currentStep >= 1 ? 'text-gray-800' : 'text-gray-500'
              }`}>
                Panier
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className={`text-xs sm:text-sm font-medium ${
                currentStep >= 2 ? 'text-gray-800' : 'text-gray-500'
              }`}>
                Paiement
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className={`text-xs sm:text-sm font-medium ${
                currentStep >= 3 ? 'text-gray-800' : 'text-gray-500'
              }`}>
                Confirmation
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              {/* Client Information */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Informations Client</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 sm:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="3ezbladi@gmail.com"
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Détails De Facturation</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 sm:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${
                        errors.fullName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="ABDELAZIZ"
                      required
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone (facultatif)
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        +
                      </span>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Pays que vous souhaitez (facultatif)
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="Françaises uniquement"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="adultPack"
                      name="adultPack"
                      checked={formData.adultPack}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="adultPack" className="ml-2 block text-sm text-gray-700">
                      Je veux le pack adulte
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Paiement</h2>
                
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Paiement sécurisé</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4">
                    Payez en toute sécurité avec votre carte bancaire. Nous utilisons Stripe, SumUp et Paypal pour 
                    accepter les paiements.
                  </p>
                  
                  <div className="space-y-3">
                    {!settingsLoading && paymentSettings.stripeEnabled && (
                      <label className="flex items-center p-2 sm:p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="stripe"
                          checked={formData.paymentMethod === 'stripe'}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">Credit Card (Stripe)</span>
                      </label>
                    )}
                    
                    {!settingsLoading && paymentSettings.paypalEnabled && (
                      <label className="flex items-center p-2 sm:p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={formData.paymentMethod === 'paypal'}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <div className="w-8 h-5 bg-blue-600 rounded mr-3 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">PP</span>
                        </div>
                        <span className="text-sm font-medium">PayPal</span>
                      </label>
                    )}
                    
                    {settingsLoading && (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-accent"></div>
                        <span className="ml-2 text-gray-600">Loading payment options...</span>
                      </div>
                    )}
                    
                    {!settingsLoading && !paymentSettings.stripeEnabled && !paymentSettings.paypalEnabled && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">No payment methods are currently available. Please contact support.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mb-4 sm:mb-6">
                  Vos données personnelles seront utilisées pour soutenir votre expérience sur ce site Web, pour gérer 
                  l'accès à votre compte et à d'autres fins décrites dans notre politique de confidentialité.
                </div>
                
                <button
                  type="submit"
                  disabled={isProcessing || settingsLoading || (!paymentSettings.stripeEnabled && !paymentSettings.paypalEnabled)}
                  className="w-full bg-brand-accent hover:bg-yellow-400 text-brand-dark font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Lock className="h-5 w-5" />
                  <span>
                    {settingsLoading ? 'Loading...' : isProcessing ? 'Processing...' : `Passer Commande ${currency}${price}`}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Votre Commande</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Product</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Subtotal</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-700 text-sm sm:text-base">{product}</span>
                    <span className="text-gray-500 ml-2">× 1</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{currency}{price}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-gray-700 text-sm sm:text-base">Subtotal</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{currency}{price}</span>
                </div>
                
                <div className="flex justify-between items-center text-base sm:text-lg font-semibold pt-4 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{currency}{price}</span>
                </div>
              </div>
              
              {/* Coupon Code */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    className="bg-brand-accent hover:bg-yellow-400 text-brand-dark px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateCheckout;