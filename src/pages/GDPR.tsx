import React from 'react';

const GDPR: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">GDPR Compliance</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> January 15, 2025
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-6">
              The General Data Protection Regulation (GDPR) is a comprehensive data protection law that came into 
              effect on May 25, 2018. AccessIQ Tech is committed to complying with GDPR requirements and protecting 
              the personal data of all individuals in the European Union.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Your Rights Under GDPR</h2>
            <p className="text-gray-700 mb-4">
              As a data subject under GDPR, you have the following rights:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Right to Information:</strong> Know how your data is processed</li>
              <li><strong>Right of Access:</strong> Request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Transfer your data to another service</li>
              <li><strong>Right to Object:</strong> Object to certain types of processing</li>
              <li><strong>Rights Related to Automated Decision Making:</strong> Protection from automated decisions</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-4">
              We process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Consent:</strong> When you explicitly agree to data processing</li>
              <li><strong>Contract:</strong> To fulfill our service agreement with you</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
              <li><strong>Legitimate Interest:</strong> For business operations and improvements</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect and process the following categories of personal data:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Identity data (name, username)</li>
              <li>Contact data (email address, phone number)</li>
              <li>Technical data (IP address, browser type, device information)</li>
              <li>Usage data (how you interact with our service)</li>
              <li>Marketing data (preferences and communication history)</li>
              <li>Financial data (payment information, billing address)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. How We Use Your Data</h2>
            <p className="text-gray-700 mb-4">
              We use your personal data for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Providing and maintaining our accessibility scanning service</li>
              <li>Processing payments and managing subscriptions</li>
              <li>Communicating with you about our service</li>
              <li>Improving our service and developing new features</li>
              <li>Complying with legal obligations</li>
              <li>Marketing (with your consent)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Sharing and Transfers</h2>
            <p className="text-gray-700 mb-4">
              We may share your data with:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Service providers who help us operate our business</li>
              <li>Payment processors for billing and subscription management</li>
              <li>Analytics providers to understand service usage</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p className="text-gray-700 mb-6">
              When transferring data outside the EU, we ensure appropriate safeguards are in place, 
              such as Standard Contractual Clauses or adequacy decisions.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-6">
              We retain your personal data only for as long as necessary to fulfill the purposes for which 
              it was collected, comply with legal obligations, resolve disputes, and enforce our agreements. 
              Specific retention periods vary based on the type of data and legal requirements.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Data Security</h2>
            <p className="text-gray-700 mb-6">
              We implement appropriate technical and organizational measures to protect your personal data 
              against unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
              access controls, regular security assessments, and staff training.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Exercising Your Rights</h2>
            <p className="text-gray-700 mb-4">
              To exercise any of your GDPR rights, please contact us using the information below. 
              We will respond to your request within one month. You may also:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Update your account information through your dashboard</li>
              <li>Unsubscribe from marketing emails using the link provided</li>
              <li>Adjust cookie preferences through our cookie banner</li>
              <li>Contact our Data Protection Officer for complex requests</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Complaints</h2>
            <p className="text-gray-700 mb-6">
              If you believe we have not handled your personal data in accordance with GDPR, you have the 
              right to lodge a complaint with your local supervisory authority. However, we encourage you 
              to contact us first so we can address your concerns directly.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Data Protection Officer</h2>
            <p className="text-gray-700 mb-6">
              We have appointed a Data Protection Officer (DPO) to oversee our GDPR compliance. 
              You can contact our DPO at: dpo@accessiqtech.net
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Updates to This Notice</h2>
            <p className="text-gray-700 mb-6">
              We may update this GDPR compliance notice from time to time. We will notify you of any 
              material changes by email or through our service, and update the "last updated" date above.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 mb-6">
              For any questions about GDPR compliance or to exercise your rights, please contact us:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>AccessIQ Tech - Data Protection</strong><br />
                Email: privacy@accessiqtech.net<br />
                DPO Email: dpo@accessiqtech.net<br />
                Phone: +447877382559<br />
                Address: 7 Coronation Road, Dephna House, London, United Kingdom, NW10 7PQ<br />
                Company number: 16624435<br />
                EU Representative: [To be appointed if required]
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPR;