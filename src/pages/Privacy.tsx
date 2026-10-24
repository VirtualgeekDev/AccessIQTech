import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> January 15, 2025
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              use our services, or contact us for support. This may include:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Name and email address</li>
              <li>Account credentials</li>
              <li>Payment and billing information</li>
              <li>Website URLs you submit for scanning</li>
              <li>Usage data and analytics</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Communicate about products, services, and events</li>
              <li>Monitor and analyze usage patterns</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
            <p className="text-gray-700 mb-6">
              We do not sell, trade, or rent your personal information to third parties. We may share 
              your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist our operations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-6">
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. This includes encryption 
              of sensitive data and regular security assessments.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 mb-6">
              We retain your information for as long as your account is active or as needed to provide 
              services. You may request deletion of your account and associated data at any time.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
            <p className="text-gray-700 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your information</li>
              <li>Data portability</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Cookies</h2>
            <p className="text-gray-700 mb-6">
              We use cookies and similar technologies to enhance your experience, analyze usage, 
              and assist with our marketing efforts. You can control cookies through your browser settings.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update this privacy policy from time to time. We will notify you of any changes 
              by posting the new policy on this page and updating the "last updated" date.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about this privacy policy, please contact us at:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>AccessIQ Tech</strong><br />
                Email: privacy@accessiqtech.net<br />
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

export default Privacy;