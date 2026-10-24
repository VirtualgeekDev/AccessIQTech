import React from 'react';

const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Refund Policy</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> January 15, 2025
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. 30-Day Money-Back Guarantee</h2>
            <p className="text-gray-700 mb-6">
              We offer a 30-day money-back guarantee on all paid subscriptions. If you're not completely 
              satisfied with AccessIQ Tech within 30 days of your first payment, we'll provide a full refund.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Refund Eligibility</h2>
            <p className="text-gray-700 mb-4">
              You are eligible for a refund if:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>You request a refund within 30 days of your initial payment</li>
              <li>You have not violated our Terms of Service</li>
              <li>Your account is in good standing</li>
              <li>You provide a valid reason for the refund request</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Non-Refundable Items</h2>
            <p className="text-gray-700 mb-4">
              The following are not eligible for refunds:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Free trial periods (no payment required)</li>
              <li>Subscription renewals after 30 days from initial payment</li>
              <li>Custom development or consulting services</li>
              <li>Third-party integrations or add-ons</li>
              <li>Accounts terminated for Terms of Service violations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Refund Process</h2>
            <p className="text-gray-700 mb-4">
              To request a refund:
            </p>
            <ol className="list-decimal list-inside text-gray-700 mb-6 space-y-2">
              <li>Contact our support team at refunds@accessiqtech.net</li>
              <li>Include your account email and reason for the refund request</li>
              <li>Our team will review your request within 2 business days</li>
              <li>If approved, refunds are processed within 5-10 business days</li>
              <li>Refunds are issued to the original payment method</li>
            </ol>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Partial Refunds</h2>
            <p className="text-gray-700 mb-6">
              In certain circumstances, we may offer partial refunds for annual subscriptions based on 
              unused time. This is evaluated on a case-by-case basis and is at our sole discretion.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Subscription Cancellation</h2>
            <p className="text-gray-700 mb-6">
              You can cancel your subscription at any time through your account dashboard. Cancellation 
              stops future billing but does not automatically trigger a refund. You'll retain access 
              to paid features until the end of your current billing period.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Chargebacks and Disputes</h2>
            <p className="text-gray-700 mb-6">
              We encourage customers to contact us directly before initiating chargebacks or payment 
              disputes. Chargebacks may result in immediate account suspension and additional fees. 
              We're committed to resolving billing issues fairly and promptly.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Processing Time</h2>
            <p className="text-gray-700 mb-6">
              Approved refunds are typically processed within 5-10 business days. The time for the 
              refund to appear in your account depends on your payment method and financial institution.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact Information</h2>
            <p className="text-gray-700 mb-6">
              For refund requests or questions about this policy, please contact us:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>AccessIQ Tech - Refunds Department</strong><br />
                Email: refunds@accessiqtech.net<br />
                Phone: +447877382559<br />
                Address: 7 Coronation Road, Dephna House, London, United Kingdom, NW10 7PQ<br />
                Company number: 16624435<br />
                Response Time: Within 2 business days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;