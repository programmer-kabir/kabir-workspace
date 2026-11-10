import React from 'react';
import { FiUser, FiLock, FiX, FiCreditCard } from 'react-icons/fi';
import ProfileModalProfileTab from './ProfileModalProfileTab';
import ProfileModalPayoutTab from './ProfileModalPayoutTab';
import ProfileModalSecurityTab from './ProfileModalSecurityTab';

/**
 * ProfileSettingsModal
 * Tabbed modal container delegating to Profile, Payout, and Security tabs.
 */
export default function ProfileSettingsModal({
  isOpen,
  modalTab,
  setModalTab,
  onClose,
  // Profile
  name,
  setName,
  phone,
  setPhone,
  username,
  setUsername,
  isStudent,
  setIsStudent,
  institutionType,
  setInstitutionType,
  studentInstitution,
  setStudentInstitution,
  studentLevel,
  setStudentLevel,
  profileLoading,
  profileMessage,
  onProfileUpdate,
  onSelectImageFile,
  // Payout
  payoutForm,
  setPayoutForm,
  payoutLoading,
  payoutMessage,
  onSavePayoutSettings,
  // Security
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordLoading,
  passwordMessage,
  onPasswordChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl z-10 relative overflow-hidden animate-in zoom-in-95 duration-250 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shadow-sm">
              {modalTab === 'profile' ? <FiUser /> : modalTab === 'payout' ? <FiCreditCard /> : <FiLock />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Settings</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Manage your profile, payout & security.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl">
          <button
            type="button"
            onClick={() => setModalTab('profile')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${modalTab === 'profile'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setModalTab('payout')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${modalTab === 'payout'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            💳 Payout Setup
          </button>
          <button
            type="button"
            onClick={() => setModalTab('security')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${modalTab === 'security'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Security
          </button>
        </div>

        {/* Tab 1: Profile */}
        {modalTab === 'profile' && (
          <ProfileModalProfileTab
            profileMessage={profileMessage}
            onSelectImageFile={onSelectImageFile}
            username={username}
            setUsername={setUsername}
            name={name}
            setName={setName}
            phone={phone}
            setPhone={setPhone}
            isStudent={isStudent}
            setIsStudent={setIsStudent}
            institutionType={institutionType}
            setInstitutionType={setInstitutionType}
            studentInstitution={studentInstitution}
            setStudentInstitution={setStudentInstitution}
            studentLevel={studentLevel}
            setStudentLevel={setStudentLevel}
            profileLoading={profileLoading}
            onProfileUpdate={onProfileUpdate}
          />
        )}

        {/* Tab 2: Payout */}
        {modalTab === 'payout' && (
          <ProfileModalPayoutTab
            payoutMessage={payoutMessage}
            payoutForm={payoutForm}
            setPayoutForm={setPayoutForm}
            onSavePayoutSettings={onSavePayoutSettings}
            payoutLoading={payoutLoading}
          />
        )}

        {/* Tab 3: Security */}
        {modalTab === 'security' && (
          <ProfileModalSecurityTab
            passwordMessage={passwordMessage}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            passwordLoading={passwordLoading}
            onPasswordChange={onPasswordChange}
          />
        )}

      </div>
    </div>
  );
}
