import React from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, Printer, Share2, Sparkles, MessageCircle } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const OrderReceiptModal = () => {
  const { activeReceipt, setActiveReceipt, paymentChannels, showToast } = useApp();

  if (!activeReceipt) return null;

  const getWhatsAppNumber = () => {
    const raw = paymentChannels?.bkash?.number || paymentChannels?.nagad?.number || '01738679399';
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('880')) return digits;
    if (digits.startsWith('0')) return '88' + digits;
    return '880' + digits;
  };

  const handleWhatsAppSend = () => {
    sounds.playClick();
    const phone = getWhatsAppNumber();
    const formattedDate = activeReceipt.createdAt ? new Date(activeReceipt.createdAt).toLocaleString('bn-BD') : '';
    const msg = `⚡ *TopUp BD Order Slip* ⚡\n` +
      `------------------------------------\n` +
      `🆔 *অর্ডার আইডি:* ${activeReceipt.id}\n` +
      `👤 *প্লেয়ার UID:* ${activeReceipt.uid}\n` +
      `🎮 *প্লেয়ার নাম:* ${activeReceipt.playerNickname || 'Player'}\n` +
      `💎 *প্যাকেজ:* ${activeReceipt.packageName}\n` +
      `💰 *টাকার পরিমাণ:* ৳${activeReceipt.amount} (${activeReceipt.method})\n` +
      (activeReceipt.trxId ? `🧾 *TrxID:* ${activeReceipt.trxId}\n` : '') +
      (formattedDate ? `🕒 *সময়:* ${formattedDate}\n` : '') +
      `------------------------------------\n` +
      `এডমিন ভাই, আমি টাকা পাঠিয়েছি। দয়া করে দ্রুত চেক করে ডেলিভারি দিন। ধন্যবাদ!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  const handleShare = () => {
    sounds.playClick();
    const text = `অর্ডার আইডি: ${activeReceipt.id} | প্যাকেজ: ${activeReceipt.packageName} | প্লেয়ার UID: ${activeReceipt.uid} | স্ট্যাটাস: ${activeReceipt.status}`;
    navigator.clipboard.writeText(text);
    showToast('অর্ডারের বিবরণ কপি করা হয়েছে!', 'success');
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveReceipt(null)}>
      <div className="modal-dialog" style={{ maxWidth: '440px', padding: 0 }} onClick={(e) => e.stopPropagation()}>
        
        <button 
          className="modal-close-btn" 
          onClick={() => {
            sounds.playClick();
            setActiveReceipt(null);
          }}
        >
          <X size={18} />
        </button>

        <div className="receipt-paper">
          
          <div className="receipt-header">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800 }}>TOPUP BD</h2>
            <p style={{ fontSize: '11px', color: '#64748b' }}>অফিসিয়াল ডিজিটাল ক্যাশ মেমো</p>
            <div className="receipt-status-badge">
              ✓ {activeReceipt.status === 'Completed' ? 'ডেলিভারি সম্পন্ন' : 'অর্ডার গৃহীত হয়েছে'}
            </div>
          </div>

          <table className="receipt-table">
            <tbody>
              <tr>
                <td style={{ color: '#64748b' }}>অর্ডার নং:</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{activeReceipt.id}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>গ্রাহক নাম:</td>
                <td>{activeReceipt.customerName}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>প্লেয়ার UID:</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{activeReceipt.uid}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>প্লেয়ার নাম:</td>
                <td>{activeReceipt.playerNickname || 'Player Verified'}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>সার্ভিস:</td>
                <td>{activeReceipt.productName}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>প্যাকেজ:</td>
                <td>{activeReceipt.packageName}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>পেমেন্ট মেথড:</td>
                <td>{activeReceipt.method}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>TrxID:</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{activeReceipt.trxId}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>তারিখ ও সময়:</td>
                <td style={{ fontSize: '11px' }}>{new Date(activeReceipt.createdAt).toLocaleTimeString()}</td>
              </tr>
              <tr style={{ borderTop: '2px solid #0f172a', fontSize: '16px' }}>
                <td style={{ paddingTop: '8px' }}>পরিশোধিত টাকা:</td>
                <td style={{ paddingTop: '8px', color: '#e11d48' }}>৳{activeReceipt.amount}</td>
              </tr>
            </tbody>
          </table>

          {/* Simulated Barcode */}
          <div className="receipt-barcode">
            {[3, 1, 4, 2, 5, 2, 3, 1, 4, 2, 3, 1, 2, 4, 3, 5, 1, 2, 3].map((w, idx) => (
              <span key={idx} className="barcode-bar" style={{ width: `${w}px` }}></span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <button 
              type="button" 
              className="topup-card-btn" 
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                background: '#25d366', 
                color: '#fff', 
                fontWeight: 700, 
                fontSize: '13.5px', 
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={handleWhatsAppSend}
            >
              <MessageCircle size={18} /> WhatsApp এ স্লিপ পাঠান (দ্রুত ডেলিভারি)
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="topup-card-btn" 
                style={{ flex: 1, justifyContent: 'center', background: '#0f172a', color: '#fff' }}
                onClick={handlePrint}
              >
                <Printer size={15} /> প্রিন্ট / সেভ
              </button>
              <button 
                type="button" 
                className="topup-card-btn" 
                style={{ flex: 1, justifyContent: 'center', background: '#475569', color: '#fff' }}
                onClick={handleShare}
              >
                <Share2 size={15} /> কপি মেমো
              </button>
            </div>
          </div>

          <button 
            type="button" 
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '10px',
              borderRadius: '8px',
              background: '#f1f5f9',
              color: '#334155',
              fontWeight: 700,
              fontSize: '13px',
              textAlign: 'center',
              border: '1px solid #cbd5e1'
            }}
            onClick={() => {
              sounds.playClick();
              setActiveReceipt(null);
            }}
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
