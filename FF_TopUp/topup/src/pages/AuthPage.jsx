import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  Zap, 
  LogIn, 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Gamepad2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Crown, 
  Sun, 
  Moon,
  Flame,
  Check
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const AuthPage = () => {
  const { currentRoute, navigate, showToast, theme, toggleTheme } = useApp();
  const { loginWithEmail, registerWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState(() => (currentRoute === '/register' ? 'register' : 'login')); // 'login' | 'register' | 'forgot'

  // Form fields
  const [identifier, setIdentifier] = useState(''); // UID or Email
  const [name, setName] = useState('');
  const [playerUid, setPlayerUid] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await loginWithEmail(identifier, password);
      if (res.success) {
        showToast(`স্বাগতম, ${res.user.displayName}!`, 'success');
        navigate('/');
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await registerWithEmail(email, password, name, '', playerUid);
      if (res.success) {
        showToast(`অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম ${res.user.displayName}`, 'success');
        navigate('/');
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
  const handleForgot = async (e) => {
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
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--text-main)'
    }}>
      {/* Top Navbar Bar */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand Logo */}
          <a 
            href="/" 
            className="brand-logo-wrap" 
            onClick={(e) => { e.preventDefault(); sounds.playClick(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
          >
            <div className="brand-logo-icon">
              <Zap size={22} fill="currentColor" />
            </div>
            <div>
              <div className="brand-title">TOPUP BD</div>
              <div className="brand-subtitle">Bangladesh #1 Store</div>
            </div>
          </a>

          {/* Right Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Theme Toggle */}
            <button
              className="nav-icon-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? "ডার্ক মোড" : "হোয়াইট মোড"}
            >
              {theme === 'light' ? <Sun size={17} color="#d97706" /> : <Moon size={17} color="var(--primary)" />}
            </button>

            {/* Back to Home Button */}
            <button
              onClick={() => { sounds.playClick(); navigate('/'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={15} />
              <span>হোমপেজে ফিরে যান</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Body */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px'
      }}>
        <div className="app-container" style={{ width: '100%', maxWidth: '1080px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)'
          }}>

            {/* Left Showcase Banner (Gaming Visuals & Trust) */}
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(15, 23, 42, 0.98)), url("/images/banner1.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#ffffff'
            }}>
              {/* Top Badge */}
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '30px',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '16px'
                }}>
                  <ShieldCheck size={14} color="#38bdf8" />
                  <span>১০০% নিরাপদ ও অফিসিয়াল স্টোর</span>
                </div>

                <h1 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '28px',
                  fontWeight: 900,
                  lineHeight: 1.25,
                  marginBottom: '12px'
                }}>
                  বাংলাদেশের সবচেয়ে দ্রুততম ফ্রি ফায়ার ডায়মন্ড প্ল্যাটফর্ম
                </h1>

                <p style={{ fontSize: '13px', color: '#e0f2fe', lineHeight: 1.6, marginBottom: '28px' }}>
                  কোনো পাসওয়ার্ড ছাড়াই শুধুমাত্র UID দিয়ে ১-৩ মিনিটে ডায়মন্ড রিচার্জ করুন। বিকাশ, নগদ ও রকেটে ২৪ ঘণ্টা অটোমেটিক ডেলিভারি।
                </p>

                {/* 4 Trust Bullets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} color="#38bdf8" />
                    </div>
                    <span>১-৩ মিনিটে স্বয়ংক্রিয় ইন-গেম ডায়মন্ড ডেলিভারি</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} color="#38bdf8" />
                    </div>
                    <span>০% আইডি ব্যান ঝুঁকি (১০০% সেফ গ্যারান্টি)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} color="#38bdf8" />
                    </div>
                    <span>বিকাশ, নগদ ও রকেটে ১-ক্লিকে ওয়ালেট রিচার্জ</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} color="#38bdf8" />
                    </div>
                    <span>৫০,০০০+ নিয়মিত গেমারের বিশ্বস্ত শপ</span>
                  </div>
                </div>
              </div>

              {/* Bottom Live Pill */}
              <div style={{
                marginTop: '32px',
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: '#bae6fd'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <span>সার্ভার ও এপিআই সম্পূর্ণ সক্রিয় ও লাইভ</span>
              </div>
            </div>

            {/* Right Auth Form Box */}
            <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              
              {/* Switch Tabs (Login / Register) */}
              {mode !== 'forgot' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px',
                  borderRadius: '14px',
                  marginBottom: '24px'
                }}>
                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); setMode('login'); setErrorMessage(''); setInfoMessage(''); }}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
                      color: mode === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: mode === 'login' ? 'var(--shadow-card)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <LogIn size={16} />
                    <span>লগইন (Sign In)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); setMode('register'); setErrorMessage(''); setInfoMessage(''); }}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: mode === 'register' ? 'var(--bg-card)' : 'transparent',
                      color: mode === 'register' ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: mode === 'register' ? 'var(--shadow-card)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <UserPlus size={16} />
                    <span>নতুন অ্যাকাউন্ট</span>
                  </button>
                </div>
              )}

              {/* Title & Subtitle */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '22px',
                  fontWeight: 900,
                  color: 'var(--text-main)',
                  marginBottom: '4px'
                }}>
                  {mode === 'register' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : mode === 'forgot' ? 'পাসওয়ার্ড রিসেট' : 'অ্যাকাউন্টে লগইন করুন'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {mode === 'register' 
                    ? 'আপনার প্লেয়ার UID বা ইমেইল দিয়ে সহজে অ্যাকাউন্ট খুলুন' 
                    : mode === 'forgot' 
                    ? 'আপনার ইমেইল দিয়ে পাসওয়ার্ড রিসেট করুন'
                    : 'আপনার প্লেয়ার UID অথবা ইমেইল ও পাসওয়ার্ড লিখুন'}
                </p>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Info Message Alert */}
              {infoMessage && (
                <div style={{
                  background: 'rgba(5, 150, 105, 0.1)',
                  border: '1px solid rgba(5, 150, 105, 0.35)',
                  color: 'var(--emerald)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <div>{infoMessage}</div>
                </div>
              )}

              {/* FORM: LOGIN */}
              {mode === 'login' && (
                <form onSubmit={handleLogin}>
                  {/* Identifier (Player UID or Email) */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                      প্লেয়ার UID / ইমেইল এড্রেস
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                        <Gamepad2 size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="যেমন: 1829304918 অথবা gamer@gmail.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 42px',
                          borderRadius: '12px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          fontSize: '13.5px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                        পাসওয়ার্ড
                      </label>
                      <button
                        type="button"
                        style={{ fontSize: '11.5px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                        onClick={() => { sounds.playClick(); setMode('forgot'); setErrorMessage(''); }}
                      >
                        পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                        <Lock size={18} />
                      </div>
                      <input
                        type="password"
                        placeholder="আপনার অ্যাকাউন্টের পাসওয়ার্ড লিখুন"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 42px',
                          borderRadius: '12px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          fontSize: '13.5px'
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
                      padding: '13px',
                      borderRadius: '12px',
                      fontSize: '14.5px',
                      fontWeight: 800,
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
                    }}
                  >
                    {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
                    <ArrowRight size={17} />
                  </button>

                  {/* Bottom Switch */}
                  <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    অ্যাকাউন্ট নেই?{' '}
                    <button
                      type="button"
                      style={{ color: 'var(--primary)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => { sounds.playClick(); setMode('register'); setErrorMessage(''); }}
                    >
                      নতুন অ্যাকাউন্ট খুলুন
                    </button>
                  </div>
                </form>
              )}

              {/* FORM: REGISTER */}
              {mode === 'register' && (
                <form onSubmit={handleRegister}>
                  {/* Name */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                      আপনার পুরো নাম
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                        <User size={17} />
                      </div>
                      <input
                        type="text"
                        placeholder="যেমন: তানভীর আহমেদ"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 42px',
                          borderRadius: '12px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Game Player UID */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                        গেম প্লেয়ার UID
                      </label>
                      <span style={{ fontSize: '10.5px', color: 'var(--primary)', fontWeight: 700 }}>
                        (লগইনের জন্য ব্যবহার করতে পারবেন)
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                        <Gamepad2 size={17} />
                      </div>
                      <input
                        type="text"
                        placeholder="যেমন: 1829304918 (৮-১০ ডিজিট)"
                        value={playerUid}
                        onChange={(e) => setPlayerUid(e.target.value.replace(/\D/g, ''))}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 42px',
                          borderRadius: '12px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                      ইমেইল এড্রেস
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
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
                          padding: '11px 14px 11px 42px',
                          borderRadius: '12px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>
                      পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                        <Lock size={17} />
                      </div>
                      <input
                        type="password"
                        placeholder="আপনার পাসওয়ার্ড লিখুন"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 42px',
                          borderRadius: '12px',
                          background: 'var(--bg-main)',
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
                      padding: '13px',
                      borderRadius: '12px',
                      fontSize: '14.5px',
                      fontWeight: 800,
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
                    }}
                  >
                    {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
                    <ArrowRight size={17} />
                  </button>

                  {/* Bottom Switch */}
                  <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                    <button
                      type="button"
                      style={{ color: 'var(--primary)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => { sounds.playClick(); setMode('login'); setErrorMessage(''); }}
                    >
                      লগইন করুন
                    </button>
                  </div>
                </form>
              )}

              {/* FORM: FORGOT PASSWORD */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgot}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                      রেজিস্টার্ড ইমেইল এড্রেস
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        placeholder="gamer@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 42px',
                          borderRadius: '12px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          fontSize: '13.5px'
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
                      padding: '13px',
                      borderRadius: '12px',
                      fontSize: '14.5px',
                      fontWeight: 800,
                      justifyContent: 'center'
                    }}
                  >
                    {loading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিঙ্ক পাঠান'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                      type="button"
                      style={{ color: 'var(--text-muted)', fontSize: '12.5px', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => { sounds.playClick(); setMode('login'); setErrorMessage(''); setInfoMessage(''); }}
                    >
                      ← লগইন পেজে ফিরে যান
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

