import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Lock, Check } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

const Checkout: React.FC = () => {
  const { paymentSettings, planSettings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'US'
  });

  useEffect(() => {
    // Get selected plan from localStorage or default to first plan
    const storedPlan = localStorage.getItem('selectedPlan');
    if (storedPlan) {
      const { planId, billing: storedBilling } = JSON.parse(storedPlan);
      const plan = planSettings.plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        setBilling(storedBilling);
      }
    }
    
    if (!selectedPlan && planSettings.plans.length > 0) {
      setSelectedPlan(planSettings.plans[1]); // Default to Pro plan
    }
  }, [planSettings.plans, selectedPlan]);

  useEffect(() => {
    // Set default payment method based on what's enabled
    if (paymentSettings.stripeEnabled) {
      setPaymentMethod('stripe');
    } else if (paymentSettings.paypalEnabled) {
      setPaymentMethod('paypal');
    }
  }, [paymentSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const isPaymentMethodActive = paymentSettings.stripeEnabled || paymentSettings.paypalEnabled;
    
    // If payment is not required or payment gateways are deactivated, start trial directly
    if (!paymentSettings.paymentRequired || !isPaymentMethodActive) {
      try {
        // Create subscription without payment gateway
        const response = await fetch('/api/checkout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: selectedPlan.id,
            billing_cycle: billing,
            payment_method: 'none',
            skip_payment: true,
            contact_data: {
              email: formData.email,
              address: formData.address,
              city: formData.city,
              postalCode: formData.postalCode,
              country: formData.country
            }
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        if (data.success) {
          alert(`Your ${planSettings.trialLength || 8}-day free trial has started! One of the team members will contact you to complete the payment.`);
          navigate('/dashboard');
        } else {
          throw new Error(data.error || 'Registration failed');
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert(error instanceof Error ? error.message : 'Registration failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          billing_cycle: billing,
          payment_method: paymentMethod,
          payment_data: paymentMethod === 'stripe' ? {
            cardNumber: formData.cardNumber,
            expiryDate: formData.expiryDate,
            cvv: formData.cvv,
            name: formData.name,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country
          } : {}
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment processing failed');
      }

      if (data.success) {
        alert(`Payment successful! Welcome to AccessIQ Tech. Your ${planSettings.trialLength || 8}-day free trial has started.`);
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPrice = () => {
    if (!selectedPlan) return 0;
    return billing === 'annual' 
      ? Math.floor(selectedPlan.priceAnnual / 12) 
      : selectedPlan.priceMonthly;
  };

  const getTotalPrice = () => {
    if (!selectedPlan) return 0;
    return billing === 'annual' ? selectedPlan.priceAnnual : selectedPlan.priceMonthly;
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Plan Selected</h2>
          <p className="text-gray-600 mb-6">Please select a plan from our pricing page.</p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-brand-accent text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400"
          >
            View Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Subscription</h1>
          <p className="text-gray-600 mt-2">Start your {planSettings.trialLength}-day free trial today</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium text-gray-900">{selectedPlan.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Billing</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setBilling('monthly')}
                      className={`px-3 py-1 rounded text-sm ${
                        billing === 'monthly' 
                          ? 'bg-brand-accent text-brand-dark' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBilling('annual')}
                      className={`px-3 py-1 rounded text-sm ${
                        billing === 'annual' 
                          ? 'bg-brand-accent text-brand-dark' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Annual
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price</span>
                  <span className="font-medium text-gray-900">
                    ${getPrice()}/{billing === 'annual' ? 'month' : 'month'}
                  </span>
                </div>
                
                {billing === 'annual' && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Annual Discount</span>
                    <span>-20%</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total {billing === 'annual' ? '(Billed Annually)' : '(Monthly)'}</span>
                  <span>${getTotalPrice()}</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {planSettings.trialLength}-Day Free Trial
                  </span>
                </div>
                <p className="text-blue-600 text-sm mt-1">
                  You won't be charged until your trial ends. Cancel anytime.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">What's included:</h3>
                {selectedPlan.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
              
              <form onSubmit={handleSubmit}>
                {!paymentSettings.stripeEnabled && !paymentSettings.paypalEnabled ? (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-amber-600 flex-shrink-0" />
                    <p className="text-amber-800 font-medium text-sm sm:text-base">
                      one of the team memebrs will contact you to complate the payment
                    </p>
                  </div>
                ) : !paymentSettings.paymentRequired ? (
                  <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">No Payment Required</h3>
                    <p className="text-blue-700">
                      There is no payment required for the moment. Once we have our payment accounts ready, 
                      we will add the necessary keys and API configurations to activate payment processing.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Payment Method Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {paymentSettings.stripeEnabled && (
                          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="stripe"
                              checked={paymentMethod === 'stripe'}
                              onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                              className="mr-3"
                            />
                            <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                            <span>Credit Card (Stripe)</span>
                          </label>
                        )}
                        
                        {paymentSettings.paypalEnabled && (
                          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="paypal"
                              checked={paymentMethod === 'paypal'}
                              onChange={(e) => setPaymentMethod(e.target.value as 'paypal')}
                              className="mr-3"
                            />
                            <div className="w-8 h-5 bg-blue-600 rounded mr-3 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-6 h-4 fill-white">
                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a.641.641 0 0 1-.633-.74L23.696.901C23.778.382 24.226 0 24.75 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106h-4.606a.641.641 0 0 1-.633-.74l3.107-19.696z"/>
                              </svg>
                            </div>
                            <span>PayPal</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {paymentMethod === 'stripe' && (
                      <div className="grid grid-cols-1 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number
                          </label>
                          <input
                            type="text"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              name="expiryDate"
                              value={formData.expiryDate}
                              onChange={handleInputChange}
                              placeholder="MM/YY"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              name="cvv"
                              value={formData.cvv}
                              onChange={handleInputChange}
                              placeholder="123"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'paypal' && (
                      <div className="bg-gray-100 rounded-lg p-6 mb-6 text-center">
                        <div className="w-20 h-12 bg-blue-600 rounded mx-auto mb-4 flex items-center justify-center">
                          <svg viewBox="0 0 100 24" className="w-16 h-8 fill-white">
                            <path d="M12 4.917v.583c0 1.11-.766 2.5-1.916 2.5s-1.917-1.39-1.917-2.5V4.917C8.167 3.806 8.933 2.417 10.084 2.417S12 3.806 12 4.917zm2.5 0v.583c0 1.11-.766 2.5-1.916 2.5s-1.917-1.39-1.917-2.5V4.917c0-1.111.766-2.5 1.917-2.5s1.916 1.389 1.916 2.5zM22 4.917v.583c0 1.11-.766 2.5-1.916 2.5s-1.917-1.39-1.917-2.5V4.917c0-1.111.766-2.5 1.917-2.5S22 3.806 22 4.917zm2.5 0v.583c0 1.11-.766 2.5-1.916 2.5s-1.917-1.39-1.917-2.5V4.917c0-1.111.766-2.5 1.917-2.5s1.916 1.389 1.916 2.5z"/>
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm9.007-5.301c.828 0 1.611-.209 2.273-.602.662-.394 1.186-.96 1.522-1.634.336-.675.463-1.42.37-2.157-.093-.737-.402-1.433-.897-2.02a3.84 3.84 0 0 0-1.797-1.197c-.7-.2-1.44-.2-2.14 0a3.84 3.84 0 0 0-1.798 1.197c-.495.587-.804 1.283-.897 2.02-.093.737.034 1.482.37 2.157.336.674.86 1.24 1.522 1.634.662.393 1.445.602 2.273.602z"/>
                            <text x="35" y="16" className="fill-current text-lg font-bold">PayPal</text>
                          </svg>
                        </div>
                        <p className="text-gray-600">
                          You'll be redirected to PayPal to complete your payment securely.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Billing Address / Contact Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Billing Address
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="123 Main Street"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="San Francisco"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          placeholder="94102"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-brand-accent text-brand-dark py-3 px-6 rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Lock className="h-5 w-5" />
                  <span>
                    {isProcessing 
                      ? 'Processing...' 
                      : `Start ${planSettings.trialLength || 8}-Day Free Trial`
                    }
                  </span>
                </button>
                
                <p className="text-center text-xs text-gray-500 mt-4">
                  Your trial starts today. You'll be charged ${getTotalPrice()} {billing === 'annual' ? 'annually' : 'monthly'} after your trial ends.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;