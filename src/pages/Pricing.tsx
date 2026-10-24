import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialLength, setTrialLength] = useState(14);

  useEffect(() => {
    fetchPlans();
    fetchSettings();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPlans(data.plans || []);
      } else {
        throw new Error(data.error || 'Failed to fetch plans');
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/general', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings.trial_length_days) {
          setTrialLength(data.settings.trial_length_days.value);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      // Use default trial length if settings fetch fails
    }
  };

  const handleCheckout = (planId: string) => {
    // Store selected plan in localStorage for checkout page
    localStorage.setItem('selectedPlan', JSON.stringify({
      planId,
      billing: isAnnual ? 'annual' : 'monthly'
    }));
  };

  return (
    <div className="py-20 animate-fade-in">
      {/* Header */}
      <section className="bg-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, Transparent
            <span className="text-brand-accent block mt-2">Pricing</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your accessibility needs. 
            All plans include a {trialLength}-day free trial.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isAnnual 
                  ? 'bg-brand-accent text-brand-dark' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isAnnual 
                  ? 'bg-brand-accent text-brand-dark' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button 
                onClick={fetchPlans}
                className="bg-brand-accent text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular ? 'ring-2 ring-brand-accent scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-brand-accent text-brand-dark px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Star className="h-4 w-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      ${isAnnual ? Math.floor(plan.priceAnnual / 12) : plan.priceMonthly}
                    </span>
                    <span className="text-gray-500 ml-2">/month</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-gray-500 mt-1">
                      Billed annually (${plan.priceAnnual}/year)
                    </p>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to="/checkout"
                  onClick={() => handleCheckout(plan.id)}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-brand-accent text-brand-dark hover:bg-yellow-400'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Start Free Trial
                </Link>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  {trialLength}-day free trial • No credit card required
                </p>
              </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing
            </p>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's included in the free trial?
              </h3>
              <p className="text-gray-600">
                Your {trialLength}-day free trial includes full access to all features of your chosen plan. 
                No credit card required to start, and you can cancel anytime during the trial period.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing adjustments.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee on all plans. If you're not satisfied, 
                contact our support team for a full refund.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600">
                No setup fees, no hidden costs. The price you see is exactly what you'll pay. 
                All plans include customer support and regular updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of businesses making their websites accessible with AccessIQ Tech.
          </p>
          <Link
            to="/signup"
            className="bg-brand-accent text-brand-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 transition-all transform hover:scale-105 inline-block"
          >
            Start Your Free Trial
          </Link>
          <p className="text-gray-400 mt-4">
            No credit card required • {trialLength}-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
};

export default Pricing;