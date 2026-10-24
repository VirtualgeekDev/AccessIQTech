import React from 'react';

const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> January 15, 2025
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-700 mb-6">
              Cookies are small text files that are stored on your computer or mobile device when you visit a website. 
              They help websites remember information about your visit, which can make it easier to visit the site again 
              and make the site more useful to you.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Cookies</h2>
            <p className="text-gray-700 mb-4">
              AccessIQ Tech uses cookies for several purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>To remember your login status and preferences</li>
              <li>To analyze how our website is used and improve performance</li>
              <li>To provide personalized content and advertisements</li>
              <li>To ensure security and prevent fraud</li>
              <li>To enable certain website functionality</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Essential Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are necessary for the website to function properly. They enable basic functions like 
              page navigation, access to secure areas, and authentication.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Analytics Cookies</h3>
            <p className="text-gray-700 mb-4">
              We use Google Analytics to understand how visitors interact with our website. These cookies collect 
              information about pages visited, time spent on the site, and any errors encountered.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Functional Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies enable enhanced functionality and personalization, such as remembering your preferences 
              and settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Marketing Cookies</h3>
            <p className="text-gray-700 mb-6">
              These cookies track your browsing habits to show you relevant advertisements and measure the 
              effectiveness of our marketing campaigns.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              We may use third-party services that set cookies on our behalf:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
              <li><strong>Stripe:</strong> For secure payment processing</li>
              <li><strong>PayPal:</strong> For payment processing</li>
              <li><strong>Intercom:</strong> For customer support chat functionality</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Managing Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Use our cookie consent banner to accept or reject non-essential cookies</li>
              <li>Modify your browser settings to block or delete cookies</li>
              <li>Use browser extensions that manage cookies automatically</li>
              <li>Opt out of Google Analytics tracking</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Browser Settings</h2>
            <p className="text-gray-700 mb-4">
              Most web browsers allow you to control cookies through their settings:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Impact of Disabling Cookies</h2>
            <p className="text-gray-700 mb-6">
              Disabling cookies may affect your experience on our website. Some features may not work properly, 
              and you may need to re-enter information more frequently.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Updates to This Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update this Cookie Policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "last updated" date.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about this Cookie Policy, please contact us at:
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

export default CookiePolicy;