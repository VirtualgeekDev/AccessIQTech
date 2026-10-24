import React from 'react';

const PaymentPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment Policy</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> January 15, 2025
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Accepted Payment Methods</h2>
            <p className="text-gray-700 mb-4">
              We accept the following payment methods:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Credit Cards:</strong> Visa, Mastercard, American Express, Discover</li>
              <li><strong>Debit Cards:</strong> All major debit cards with Visa or Mastercard logos</li>
              <li><strong>PayPal:</strong> PayPal account or PayPal Credit</li>
              <li><strong>Digital Wallets:</strong> Apple Pay, Google Pay (where available)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Billing Cycles and Charges</h2>
            <p className="text-gray-700 mb-4">
              AccessIQ Tech offers flexible billing options:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Monthly Billing:</strong> Charged on the same date each month</li>
              <li><strong>Annual Billing:</strong> Charged once per year with 20% discount</li>
              <li><strong>Free Trial:</strong> 14-day trial period with no upfront payment required</li>
              <li><strong>Pro-rated Charges:</strong> Plan upgrades are pro-rated for the current billing period</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Payment Processing</h2>
            <p className="text-gray-700 mb-6">
              All payments are processed securely through our trusted payment partners Stripe and PayPal. 
              We do not store your complete credit card information on our servers. All payment data is 
              encrypted and handled in compliance with PCI DSS standards.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Automatic Renewal</h2>
            <p className="text-gray-700 mb-6">
              Subscriptions automatically renew at the end of each billing period unless cancelled. 
              You will be charged the then-current subscription fee. We'll send you a reminder email 
              before each renewal. You can cancel your subscription at any time through your account dashboard.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Failed Payments</h2>
            <p className="text-gray-700 mb-4">
              If a payment fails, we will:
            </p>
            <ol className="list-decimal list-inside text-gray-700 mb-6 space-y-2">
              <li>Attempt to process the payment again within 24 hours</li>
              <li>Send you an email notification about the failed payment</li>
              <li>Retry the payment up to 3 times over 7 days</li>
              <li>Suspend your account if payment cannot be processed</li>
              <li>Cancel your subscription after 14 days of failed payment attempts</li>
            </ol>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Price Changes</h2>
            <p className="text-gray-700 mb-6">
              We reserve the right to change our pricing at any time. For existing subscribers, 
              price changes will take effect at the next billing cycle. We'll provide at least 
              30 days advance notice of any price increases via email.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Taxes and Fees</h2>
            <p className="text-gray-700 mb-6">
              Prices displayed are exclusive of applicable taxes. Depending on your location, 
              you may be charged additional taxes (such as VAT, GST, or sales tax) as required 
              by local law. These taxes will be clearly shown during checkout.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Currency and Exchange Rates</h2>
            <p className="text-gray-700 mb-6">
              All prices are listed in US Dollars (USD). If you pay with a card issued in a 
              different currency, your bank or payment provider may apply currency conversion 
              fees and exchange rates.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Payment Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>SSL encryption for all payment transactions</li>
              <li>PCI DSS compliance for credit card processing</li>
              <li>Fraud detection and prevention systems</li>
              <li>Secure tokenization of payment information</li>
              <li>Regular security audits and monitoring</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Billing Support</h2>
            <p className="text-gray-700 mb-6">
              For billing questions, payment issues, or to update your payment information, 
              please contact our billing support team. We're here to help resolve any 
              payment-related concerns quickly and efficiently.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Dispute Resolution</h2>
            <p className="text-gray-700 mb-6">
              If you have concerns about a charge, please contact us before disputing the 
              charge with your bank or credit card company. We're committed to resolving 
              billing issues fairly and will work with you to address any legitimate concerns.
            </p>

            <h2 className="text-2xl font-semibent text-gray-900 mt-8 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 mb-6">
              For payment-related questions or support, please contact us:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>AccessIQ Tech - Billing Department</strong><br />
                Email: billing@accessiqtech.net<br />
                Phone: +447877382559<br />
                Address: 7 Coronation Road, Dephna House, London, United Kingdom, NW10 7PQ<br />
                Company number: 16624435<br />
                Business Hours: Monday-Friday, 9 AM - 6 PM PST
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPolicy;