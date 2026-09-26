import React, { useState } from 'react';
import { useDynamicPage } from '../../hooks/useDynamicPage';
import DynamicSEO from '../../components/CMS/DynamicSEO';
import SafeRichText from '../../components/CMS/SafeRichText';
import { Mail, Clock, ShieldCheck, Send, HelpCircle, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';

const ContactUs = () => {
  const { pageData, loading, error } = useDynamicPage('contact-us');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'General Support',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', department: 'General Support', subject: '', message: '' });
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF]"></div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center transition-colors duration-300">
        <p className="text-xl text-gray-600 dark:text-gray-400">Error loading page content. Please try again later.</p>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO pageData={pageData} />
      <div className="min-h-screen bg-white dark:bg-[#050505] relative pt-28 pb-24 overflow-hidden transition-colors duration-300">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#00D4FF]/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Hero Title Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#00D4FF]/10 text-[#00D4FF] rounded-full text-xs font-semibold tracking-widest uppercase mb-5 border border-[#00D4FF]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customer Support &amp; Assistance</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight font-outfit mb-4">
              {pageData.title || 'Contact Us'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              We value your questions, feedback, and suggestions. Whether you need assistance with your account, licensing, or downloads, our dedicated team is here to help.
            </p>
          </div>

          {/* Top Quick Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            
            {/* Card 1: Support Email */}
            <div className="bg-gray-50 dark:bg-[#111] p-6 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-[#00D4FF]/40 transition-all duration-300 flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Support Email</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Account, billing &amp; general help</p>
                <a 
                  href="mailto:support@dayalstock.com" 
                  className="text-[#00D4FF] hover:underline font-medium text-sm inline-flex items-center gap-1"
                >
                  support@dayalstock.com
                </a>
              </div>
            </div>

            {/* Card 2: DMCA & Copyright */}
            <div className="bg-gray-50 dark:bg-[#111] p-6 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-purple-500/40 transition-all duration-300 flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Copyright &amp; DMCA</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Licensing &amp; IP inquiries</p>
                <a 
                  href="mailto:copyright@dayalstock.com" 
                  className="text-purple-500 dark:text-purple-400 hover:underline font-medium text-sm inline-flex items-center gap-1"
                >
                  copyright@dayalstock.com
                </a>
              </div>
            </div>

            {/* Card 3: Response Time */}
            <div className="bg-gray-50 dark:bg-[#111] p-6 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Typical Response Time</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">General: 24–48 business hours</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Active Support
                </span>
              </div>
            </div>

          </div>

          {/* Main Content & Interactive Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Rich Text Content */}
            <div className="lg:col-span-7 bg-gray-50 dark:bg-[#111] p-8 sm:p-10 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg">
              <div className="mb-6 pb-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-outfit">
                  Help &amp; Documentation
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 px-3 py-1 rounded-full border border-gray-200 dark:border-white/10">
                  Official Guidelines
                </span>
              </div>

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <SafeRichText content={pageData.content} />
              </div>
            </div>

            {/* Right Column: Interactive Form & Help Box */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              
              {/* Form Card */}
              <div className="bg-gray-50 dark:bg-[#111] p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg relative overflow-hidden">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit mb-2">
                    Send Us a Message
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Fill out the form below and our support team will get back to you promptly.
                  </p>
                </div>

                {isSubmitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Message Sent Successfully!</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs mx-auto">
                      Thank you for reaching out. We have received your inquiry and will respond to your email shortly.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="mt-4 px-6 py-2.5 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[#00D4FF] rounded-xl text-sm font-semibold transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF] bg-white dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm transition-all"
                        placeholder="e.g. Dayal Stock"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF] bg-white dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm transition-all"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        Department / Inquiry Type
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF] bg-white dark:bg-[#181818] text-gray-900 dark:text-white outline-none text-sm transition-all"
                      >
                        <option value="General Support">General Support &amp; Account</option>
                        <option value="Billing & Payment">Billing, Payments &amp; Refunds</option>
                        <option value="Licensing & DMCA">Licensing &amp; Copyright (DMCA)</option>
                        <option value="Contributor Support">Contributor Support</option>
                        <option value="Business Partnership">Business Partnership</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF] bg-white dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm transition-all"
                        placeholder="How can we help?"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        Message
                      </label>
                      <textarea
                        rows="4"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF] bg-white dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm transition-all"
                        placeholder="Please describe your question or issue in detail..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#00D4FF] text-gray-950 px-6 py-3.5 rounded-xl font-bold hover:bg-[#00b8e6] active:scale-[0.99] transition-all shadow-lg shadow-[#00D4FF]/20 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-950 border-t-transparent" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Before Contacting Us Helpful Box */}
              <div className="bg-gradient-to-br from-[#00D4FF]/5 to-transparent p-6 rounded-3xl border border-[#00D4FF]/20">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                      Before Contacting Support
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                      To help us resolve your inquiry faster, please include your registered email address, username, order ID (if applicable), and screenshots of the issue.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
};

export default ContactUs;
