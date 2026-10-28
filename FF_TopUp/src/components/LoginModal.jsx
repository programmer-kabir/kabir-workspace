import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  X, 
  LogIn, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  KeyRound,
  Gamepad2,
  HelpCircle
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const LoginModal = () => {
  const { 
    isLoginModalOpen, 
    setIsLoginModalOpen, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithQuickProfile,
    resetPassword 
  } = useAuth();
  
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'email' | 'quick'
  const [emailMode, setEmailMode] = useState('login'); // 'login' | 'register' | 'forgot'
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gamerUid, setGamerUid] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleClose = () => {
    sounds.playClick();
    setIsLoginModalOpen(false);
    setErrorMessage('');
    setInfoMessage('');
    setShowConfigHelp(false);
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    sounds.playClick();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    setShowConfigHelp(false);

    try {
      const res = await loginWithGoogle();
      if (res.success) {
        showToast(`স্বাগতম, ${res.user.displayName}!`, 'success');
        setIsLoginModalOpen(false);
      } else {
        setErrorMessage(res.message);
        if (res.code === 'auth/configuration-not-found') {
          setShowConfigHelp(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Email Submit Handler
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    setShowConfigHelp(false);

    try {
      if (emailMode === 'forgot') {
        const res = await resetPassword(email);
        if (res.success) {
          setInfoMessage(res.message);
          showToast(res.message, 'success');
        } else {
          setErrorMessage(res.message);
        }
      } else if (emailMode === 'register') {
        const res = await registerWithEmail(email, password, name);
        if (res.success) {
          showToast(`অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম ${res.user.displayName}`, 'success');
          setIsLoginModalOpen(false);
        } else {
          setErrorMessage(res.message);
          if (res.code === 'auth/configuration-not-found') {
            setShowConfigHelp(true);
          }
        }
      } else {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          showToast(`স্বাগতম, ${res.user.displayName}!`, 'success');
          setIsLoginModalOpen(false);
        } else {
          setErrorMessage(res.message);
          if (res.code === 'auth/configuration-not-found') {
            setShowConfigHelp(true);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div 
        className="modal-dialog auth-modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Close Button */}
        <button className="modal-close-btn" id="login-modal-close-btn" onClick={handleClose}>
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(255, 0, 128, 0.2))',
            border: '1px solid var(--primary-border)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            boxShadow: '0 8px 24px rgba(0, 240, 255, 0.2)'
          }}>
            <LogIn size={26} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>
            অ্যাকাউন্ট লগইন
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            TopUp BD এ সহজে ডায়মন্ড কিনুন ও ওয়ালেট কন্ট্রোল করুন
          </p>
        </div>

        {/* Auth Method Navigation Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'google' ? 'active' : ''}`}
            onClick={() => { sounds.playClick(); setActiveTab('google'); setErrorMessage(''); }}
          >
            <Sparkles size={14} />
            <span>গুগল (Google)</span>
          </button>
          
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => { sounds.playClick(); setActiveTab('email'); setErrorMessage(''); }}
          >
            <Mail size={14} />
            <span>ইমেইল ও পাসওয়ার্ড</span>
          </button>
        </div>

        {/* Error / Alert Banner */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: 1.5
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Info Message Banner */}
        {infoMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0, color: '#10b981' }} />
            <div>{infoMessage}</div>
          </div>
        )}

        {/* Firebase Config Guide Box if Firebase Auth isn't enabled in console yet */}
        {showConfigHelp && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#fcd34d'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={14} />
              <span>Firebase Console টিপস:</span>
            </div>
            <p style={{ margin: '0 0 8px', color: '#fef3c7', fontSize: '11px', lineHeight: 1.4 }}>
              ১. <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: '#00f0ff', textDecoration: 'underline' }}>Firebase Console</a> এ যান<br/>
              ২. <b>Build &gt; Authentication</b> এ গিয়ে <b>"Get started"</b> বাটনে চাপুন<br/>
              ৩. <b>Sign-in method</b> থেকে Google এবং Email/Password এনেবল করুন।
            </p>
            <button
              type="button"
              className="topup-card-btn"
              style={{ width: '100%', padding: '6px', fontSize: '11px', justifyContent: 'center' }}
              onClick={() => {
                setActiveTab('email');
                setErrorMessage('');
              }}
            >
              👉 বিকল্প: ইমেইল ও পাসওয়ার্ড দিয়ে চেষ্টা করুন
            </button>
          </div>
        )}

        {/* TAB 1: GOOGLE 1-CLICK LOGIN */}
        {activeTab === 'google' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '20px' }}>
              কোনো পাসওয়ার্ড মনে রাখার ঝামেলা ছাড়াই আপনার গুগল অ্যাকাউন্ট দিয়ে ১-ক্লিকে লগইন করুন।
            </p>

            <button
              type="button"
              id="google-login-action-btn"
              className="google-sign-in-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px 20px',
                background: '#ffffff',
                color: '#1f2937',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Google G Logo SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'লগইন হচ্ছে...' : 'Google দিয়ে চালিয়ে যান'}</span>
            </button>

            <div style={{ margin: '20px 0 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>অথবা</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            <button
              type="button"
              className="topup-card-btn"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }}
              onClick={() => { sounds.playClick(); setActiveTab('email'); }}
            >
              <Mail size={15} />
              <span>ইমেইল ও পাসওয়ার্ড দিয়ে চালিয়ে যান</span>
            </button>
          </div>
        )}

        {/* TAB 2: EMAIL / PASSWORD */}
        {activeTab === 'email' && (
          <div>
            {/* Sub Mode Toggle: Login / Register / Forgot */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                className={`cat-tab ${emailMode === 'login' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { sounds.playClick(); setEmailMode('login'); setErrorMessage(''); }}
              >
                লগইন
              </button>
              <button
                type="button"
                className={`cat-tab ${emailMode === 'register' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { sounds.playClick(); setEmailMode('register'); setErrorMessage(''); }}
              >
                নতুন অ্যাকাউন্ট
              </button>
            </div>

            <form onSubmit={handleEmailSubmit}>
              {emailMode === 'register' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    আপনার নাম:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      className="uid-input-field"
                      style={{ width: '100%', paddingLeft: '38px' }}
                      placeholder="যেমন: তানভীর আহমেদ"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={emailMode === 'register'}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  ইমেইল ঠিকানা:
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-dim)' }} />
                  <input
                    type="email"
                    className="uid-input-field"
                    style={{ width: '100%', paddingLeft: '38px' }}
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {emailMode !== 'forgot' && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      পাসওয়ার্ড:
                    </label>
                    {emailMode === 'login' && (
                      <button
                        type="button"
                        style={{ fontSize: '11px', color: 'var(--primary)', background: 'none', border: 'none', padding: 0 }}
                        onClick={() => { sounds.playClick(); setEmailMode('forgot'); }}
                      >
                        পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-dim)' }} />
                    <input
                      type="password"
                      className="uid-input-field"
                      style={{ width: '100%', paddingLeft: '38px' }}
                      placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={emailMode !== 'forgot'}
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="email-auth-submit-btn"
                className="place-order-submit-btn"
                disabled={loading}
                style={{ width: '100%', marginTop: '6px' }}
              >
                {loading ? (
                  <span>প্রসেসিং হচ্ছে...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>
                      {emailMode === 'register' ? 'অ্যাকাউন্ট তৈরি করুন' : emailMode === 'forgot' ? 'রিসেট লিঙ্ক পাঠান' : 'লগইন করুন'}
                    </span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {emailMode === 'forgot' && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '12px' }}
                    onClick={() => setEmailMode('login')}
                  >
                    ← ফিরে যান লগইনে
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Security Trust Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'var(--text-dim)'
        }}>
          <ShieldCheck size={14} color="var(--emerald)" />
          <span>২৫৬-বিট এনক্রিপশন ও শতভাগ নিরাপদ গেমিং প্ল্যাটফর্ম</span>
        </div>

      </div>
    </div>
  );
};
