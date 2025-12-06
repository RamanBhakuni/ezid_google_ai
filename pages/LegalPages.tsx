
import React from 'react';
import { Shield, Lock, Eye, FileText, RefreshCcw } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Shield className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-lg text-slate-500">Last updated: March 10, 2024</p>
        </div>

        <div className="prose prose-indigo prose-lg text-slate-500 mx-auto space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
            <p>
              At EZID ("we", "our", or "us"), we respect your privacy and are committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you visit ezid.in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Personal Identity Information:</strong> Name, Email address, Password (encrypted).</li>
              <li><strong>Usage Data:</strong> Lookup history (for businesses), IP addresses, and browser type.</li>
              <li><strong>Business Data:</strong> Organization name, GSTIN (optional), and payment history.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. How We Use Your Data</h2>
            <p>
              The core function of EZID is to allow authorized exchange of contact information.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>For Individuals:</strong> We store your email and link it to your Short ID. Your email is <em>never</em> publicly displayed on the web. It is only revealed to authenticated Business users who perform a specific lookup.</li>
              <li><strong>For Businesses:</strong> We track your lookup usage to manage quotas and billing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Payment Information</h2>
            <p>
              We use <strong>Razorpay</strong> for processing payments. We/EZID do not store your card data on our servers. The data is encrypted through the Payment Card Industry Data Security Standard (PCI-DSS) when processing payment. Your purchase transaction data is only used as long as is necessary to complete your purchase transaction.
            </p>
            <p>
              For more insight, you may also want to read Razorpay’s Terms and Conditions <a href="https://razorpay.com/terms" target="_blank" rel="noreferrer" className="text-indigo-600 underline">here</a> or Privacy Statement <a href="https://razorpay.com/privacy" target="_blank" rel="noreferrer" className="text-indigo-600 underline">here</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Security</h2>
            <p>
              We implement state-of-the-art security measures designed to secure your personal information from accidental loss and from unauthorized access. All passwords are hashed using bcrypt. All data in transit is encrypted via SSL/TLS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Contact Information</h2>
            <p>
              To ask questions or comment about this privacy policy and our privacy practices, contact us at: <a href="mailto:privacy@ezid.in" className="text-indigo-600 hover:underline">privacy@ezid.in</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const TermsOfUse: React.FC = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <FileText className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-lg text-slate-500">Effective Date: March 10, 2024</p>
        </div>

        <div className="prose prose-indigo prose-lg text-slate-500 mx-auto space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using EZID, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. User Conduct</h2>
            <p>You agree NOT to use the service to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Upload invalid or malicious data via CSV.</li>
              <li>Attempt to scrape or harvest email addresses in bulk beyond your plan limits.</li>
              <li>Impersonate any person or entity or falsely state your affiliation.</li>
              <li>Create Short IDs that are offensive, vulgar, or infringe on trademarks.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Billing & Payments</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Pricing:</strong> All prices listed on the website are in Indian Rupees (INR) and are exclusive of GST unless stated otherwise.</li>
              <li><strong>Billing Cycle:</strong> Subscriptions are billed on a monthly or annual basis as per the plan selected.</li>
              <li><strong>Payment Processing:</strong> Payments are processed via Razorpay. By making a purchase, you agree to abide by Razorpay's terms of service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Account Termination</h2>
            <p>
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Limitation of Liability</h2>
            <p>
              In no event shall EZID, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const RefundPolicy: React.FC = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <RefreshCcw className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Refund & Cancellation Policy</h1>
          <p className="mt-4 text-lg text-slate-500">Effective Date: March 10, 2024</p>
        </div>

        <div className="prose prose-indigo prose-lg text-slate-500 mx-auto space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Cancellation Policy</h2>
            <p>
              You can cancel your subscription at any time via your dashboard or by contacting support@ezid.in.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>If you cancel, your subscription will remain active until the end of the current billing period.</li>
              <li>You will not be charged for the next billing cycle.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Refund Policy</h2>
            <p>
              We strive to provide the best service possible. However, if you are not satisfied, our refund terms are as follows:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Eligibility:</strong> Refunds are only applicable for the first purchase of a subscription plan. Renewals are generally non-refundable unless there was a technical error (e.g., double charge).</li>
              <li><strong>Timeframe:</strong> You must request a refund within <strong>5 days</strong> of the initial purchase.</li>
              <li><strong>Processing Time:</strong> Approved refunds will be processed within <strong>5-7 business days</strong> and credited back to the original payment source (credit card, bank account, or UPI).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Non-Refundable Scenarios</h2>
            <p>Refunds will <strong>not</strong> be granted in the following cases:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>If you have already utilized a significant portion of the plan's quota (e.g., performed bulk lookups).</li>
              <li>If the request is made after the 5-day window.</li>
              <li>For violation of our Terms of Service (e.g., abuse of the platform).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Contact Us</h2>
            <p>
              If you have any questions about our Returns and Refunds Policy, please contact us:
            </p>
            <ul className="list-none space-y-1">
              <li>By email: support@ezid.in</li>
              <li>By phone: +91 80 1234 5678</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
