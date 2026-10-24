import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> January 15, 2025
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-6">
              By accessing and using AccessIQ Tech ("Service"), you accept and agree to be bound by 
              the terms and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-6">
              AccessIQ Tech is an AI-powered SaaS platform that scans websites for ADA/WCAG compliance 
              and provides automated accessibility fixes. Our service helps businesses ensure their 
              websites are accessible to all users.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 mb-4">
              To access certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Subscription and Payment</h2>
            <p className="text-gray-700 mb-4">
              Our Service operates on a subscription basis with the following terms:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Free trials are available for new users as specified</li>
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit malicious code or conduct security testing without permission</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the service for illegal or harmful activities</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-6">
              The Service and its original content, features, and functionality are owned by AccessIQ Tech 
              and are protected by international copyright, trademark, patent, trade secret, and other 
              intellectual property laws.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Privacy</h2>
            <p className="text-gray-700 mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which also governs 
              your use of the Service, to understand our practices.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Service Availability</h2>
            <p className="text-gray-700 mb-6">
              We strive to provide reliable service but cannot guarantee 100% uptime. We reserve the 
              right to modify, suspend, or discontinue the Service with reasonable notice.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-6">
              In no event shall AccessIQ Tech be liable for any indirect, incidental, special, 
              consequential, or punitive damages arising out of your use of the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Termination</h2>
            <p className="text-gray-700 mb-6">
              We may terminate or suspend your account and access to the Service immediately, without 
              prior notice, for conduct that we believe violates these Terms or is harmful to other 
              users, us, or third parties.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 mb-6">
              These Terms shall be interpreted and governed by the laws of the State of California, 
              without regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-6">
              We reserve the right to modify these terms at any time. We will notify users of any 
              material changes via email or through the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>AccessIQ Tech</strong><br />
                Email: legal@accessiqtech.net<br />
                Phone: +447877382559<br />
                Address: 7 Coronation Road, Dephna House, London, United Kingdom, NW10 7PQ<br />
                Company number: 16624435
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;