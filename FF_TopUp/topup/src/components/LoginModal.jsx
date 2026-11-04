import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  X, 
  LogIn, 
  UserPlus,
  Mail, 
  Lock, 
  User, 
  Phone, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Gamepad2
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const LoginModal = () => {
  const { 
    isLoginModalOpen, 
    setIsLoginModalOpen, 
    loginWithEmail, 
    registerWithEmail, 
    resetPassword 
  } = useAuth();
  
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'forgot'
  
  // Form states
  const [identifier, setIdentifier] = useState(''); // UID or Email or Phone for Login
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [playerUid, setPlayerUid] = useState('');
  const [password, setPassword] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (!isLoginModalOpen) return null;

  const handleClose = () => {
    sounds.playClick();
    setIsLoginModalOpen(false);
    setErrorMessage('');
    setInfoMessage('');
  };

  // Login Submit Handler (Player UID / Email / Phone + Password)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await loginWithEmail(identifier, password);
      if (res.success) {
        showToast(`স্বাগতম, ${res.user.displayName}!`, 'success');
        setIsLoginModalOpen(false);
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Register Submit Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await registerWithEmail(email, password, name, phone, playerUid);
      if (res.success) {
        showToast(`অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম ${res.user.displayName}`, 'success');
        setIsLoginModalOpen(false);
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await resetPassword(email);
      if (res.success) {
        setInfoMessage(res.message);
        showToast(res.message, 'success');
      } else {
        setErrorMessage(res.message);
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
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(225, 29, 72, 0.15))',
            border: '1px solid var(--primary-border)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.2)'
          }}>
            {activeTab === 'register' ? <UserPlus size={26} /> : <LogIn size={26} />}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
            {activeTab === 'register' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : activeTab === 'forgot' ? 'পাসওয়ার্ড পুনরুদ্ধার' : 'গেমিং অ্যাকাউন্ট লগইন'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {activeTab === 'register' 
              ? 'প্লেয়ার UID বা ইমেইল দিয়ে সহজে অ্যাকাউন্ট খুলুন' 
              : 'আপনার প্লেয়ার UID অথবা ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন'}
          </p>
        </div>

        {/* Tabs: Sign In / Register */}
        {activeTab !== 'forgot' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => { sounds.playClick(); setActiveTab('login'); setErrorMessage(''); }}
            >
              <LogIn size={15} />
              <span>লগইন (Sign In)</span>
            </button>
            
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => { sounds.playClick(); setActiveTab('register'); setErrorMessage(''); }}
            >
              <UserPlus size={15} />
              <span>নতুন অ্যাকাউন্ট (Sign Up)</span>
            </button>
          </div>
        )}

        {/* Error / Alert Banner */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
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
            background: 'rgba(5, 150, 105, 0.12)',
            border: '1px solid rgba(5, 150, 105, 0.4)',
            color: 'var(--emerald)',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0, color: 'var(--emerald)' }} />
            <div>{infoMessage}</div>
          </div>
        )}

        {/* TAB 1: LOGIN (Player UID / Email / Phone + Password) */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            {/* Identifier: UID / Email / Phone */}
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                প্লেয়ার UID / ইমেইল / মোবাইল নম্বর
              </label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Gamepad2 size={17} />
                </div>
                <input
                  type="text"
                  placeholder="যেমন: 1829304918 অথবা gamer@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 40px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                  পাসওয়ার্ড
                </label>
                <button
                  type="button"
                  style={{ fontSize: '11px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => { sounds.playClick(); setActiveTab('forgot'); setErrorMessage(''); }}
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Lock size={17} />
                </div>
                <input
                  type="password"
                  placeholder="আপনার অ্যাকাউন্টের পাসওয়ার্ড লিখুন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 40px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="topup-card-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 800,
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)'
              }}
            >
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
              <ArrowRight size={16} />
            </button>

            {/* Switch to Register */}
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              অ্যাকাউন্ট নেই?{' '}
              <button
                type="button"
                style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => { sounds.playClick(); setActiveTab('register'); setErrorMessage(''); }}
              >
                নতুন অ্যাকাউন্ট তৈরি করুন
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER (Full Name + Player UID + Email + Password) */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            {/* Full Name */}
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                আপনার পুরো নাম
              </label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <User size={16} />
                </div>
                <input
                  type="text"
                  placeholder="যেমন: সাকিব হাসান"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* In-Game Player UID (Easy Login UID) */}
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                  গেম প্লেয়ার UID
                </label>
                <span style={{ fontSize: '10.5px', color: 'var(--primary)', fontWeight: 600 }}>
                  (লগইনের জন্য ব্যবহার করতে পারবেন)
                </span>
              </div>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Gamepad2 size={16} />
                </div>
                <input
                  type="text"
                  placeholder="যেমন: 1829304918 (৮-১০ ডিজিট)"
                  value={playerUid}
                  onChange={(e) => setPlayerUid(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                ইমেইল এড্রেস
              </label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="gamer@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group" style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
              </label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড লিখুন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="topup-card-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 800,
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)'
              }}
            >
              {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
              <ArrowRight size={16} />
            </button>

            {/* Switch to Login */}
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <button
                type="button"
                style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => { sounds.playClick(); setActiveTab('login'); setErrorMessage(''); }}
              >
                লগইন করুন
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {activeTab === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <div className="input-group" style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                আপনার রেজিস্টার্ড ইমেইল দিন
              </label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Mail size={17} />
                </div>
                <input
                  type="email"
                  placeholder="gamer@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 40px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="topup-card-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 800,
                justifyContent: 'center'
              }}
            >
              {loading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিঙ্ক পাঠান'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                style={{ color: 'var(--text-muted)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => { sounds.playClick(); setActiveTab('login'); setErrorMessage(''); setInfoMessage(''); }}
              >
                ← লগইন পেজে ফিরে যান
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
