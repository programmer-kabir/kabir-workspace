// frontend/src/pages/ContactPage.tsx
import { useState } from 'react';
import { Mail, MessageSquare, Clock, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import { submitContactMessage } from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic client validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMsg('Please enter your name (at least 2 characters).');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      setErrorMsg('Please enter a subject (at least 3 characters).');
      return;
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setErrorMsg('Please enter a message (at least 10 characters).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitContactMessage(formData);
      if (res.success) {
        setSuccessMsg(res.message || 'Thank you! Your message has been sent successfully.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setErrorMsg(res.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0e15]">
      <SiteHeader />

      <main className="flex-1 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-4">
            <Sparkles className="size-3.5 text-purple-400" />
            We&apos;re Here to Help
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
            Have questions about licensing, need a custom icon design, or want to discuss enterprise team seats? Send us a message and we&apos;ll get back to you promptly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-4xl mx-auto">
          {/* Left: Contact Info & Benefits */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#141522] border border-white/10 space-y-6 shadow-xl">
              <h3 className="text-lg font-bold text-white">Get in Touch</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Whether you need assistance with an existing order or have a custom inquiry, our support team is ready to help.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Email Support</h4>
                    <p className="text-xs text-slate-400 mt-0.5">support@iconbaba.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Response Time</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Within 24 hours on business days</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <MessageSquare className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Community</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Follow @iconbaba on Twitter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-9 rounded-3xl bg-[#11121c] border border-white/10 shadow-2xl space-y-5"
            >
              <h3 className="text-xl font-bold text-white mb-2">Send a Message</h3>

              {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
                  <AlertCircle className="size-5 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Inquiry about Team License or Custom Icons"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Message *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="How can we help you today? Please provide as much detail as possible..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {submitting ? (
                  <span>Sending message...</span>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
