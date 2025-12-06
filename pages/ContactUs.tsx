import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send to backend here
    console.log("Contact Form Submitted:", formData);
    setSubmitted(true);
  };

  return (
    <div className="bg-white min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto md:max-w-none md:grid md:grid-cols-2 md:gap-12">
          
          {/* Contact Info */}
          <div className="mb-12 md:mb-0">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Get in touch
            </h2>
            <p className="mt-3 text-lg text-slate-500">
              Have questions about Enterprise plans? Need help recovering an account? 
              Our support team is based in Bangalore and ready to help.
            </p>
            
            <div className="mt-9">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Phone className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <div className="ml-3 text-base text-slate-500">
                  <p>+91 80 1234 5678</p>
                  <p className="mt-1">Mon-Fri 9am to 6pm IST</p>
                </div>
              </div>
              <div className="mt-6 flex">
                <div className="flex-shrink-0">
                  <Mail className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <div className="ml-3 text-base text-slate-500">
                  <p>support@ezid.in</p>
                  <p className="mt-1">sales@ezid.in</p>
                </div>
              </div>
              <div className="mt-6 flex">
                <div className="flex-shrink-0">
                  <MapPin className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <div className="ml-3 text-base text-slate-500">
                  <p>123, Tech Park, Indiranagar</p>
                  <p className="mt-1">Bangalore, Karnataka 560038</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-sm">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Message Sent!</h3>
                <p className="text-slate-500 mt-2">Thank you for contacting us. We will get back to you shortly.</p>
                <button 
                  onClick={() => { setSubmitted(false); setFormData({name:'', email:'', message:''}); }}
                  className="mt-6 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6">
                <div>
                  <label htmlFor="full-name" className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    name="full-name"
                    id="full-name"
                    required
                    className="mt-1 block w-full py-3 px-4 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="mt-1 block w-full py-3 px-4 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    className="mt-1 block w-full py-3 px-4 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};