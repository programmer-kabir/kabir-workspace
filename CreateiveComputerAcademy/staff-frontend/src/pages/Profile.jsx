import React from 'react';
import useProfileData from '../components/Profile/useProfileData';
import ProfileHeaderBanner from '../components/Profile/ProfileHeaderBanner';
import ProfileSidebarCards from '../components/Profile/ProfileSidebarCards';
import ProfileStatsOverview from '../components/Profile/ProfileStatsOverview';
import ProfileRecentTasks from '../components/Profile/ProfileRecentTasks';
import ProfileSettingsModal from '../components/Profile/ProfileSettingsModal';
import ImageCropperModal from '../components/ImageCropperModal';

/**
 * Profile Page (Modularized under 300 lines)
 * Staff member personal profile, performance statistics, payout configuration, and avatar/cover cropper.
 */
export default function Profile() {
  const {
    currentUser,
    API_URL,
    name,
    setName,
    phone,
    setPhone,
    username,
    setUsername,
    isStudent,
    setIsStudent,
    studentStatus,
    studentRejectionReason,
    institutionType,
    setInstitutionType,
    studentInstitution,
    setStudentInstitution,
    studentLevel,
    setStudentLevel,
    profileLoading,
    profileMessage,
    handleProfileUpdate,
    cropModalOpen,
    setCropModalOpen,
    cropImageSrc,
    cropType,
    handleSelectImageFile,
    handleApplyCroppedImage,
    payoutForm,
    setPayoutForm,
    payoutLoading,
    payoutMessage,
    handleSavePayoutSettings,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordLoading,
    passwordMessage,
    handlePasswordChange,
    isModalOpen,
    setIsModalOpen,
    modalTab,
    setModalTab,
    openSettingsModal,
    stats,
    recentTasks,
    attStats,
    statsLoading,
  } = useProfileData();

  if (!currentUser) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
      `}</style>

      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              My Profile
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              Manage your personal information, payout settings, and track your performance.
            </p>
          </div>
        </div>

        {/* Top Header Banner (Cover, Avatar with camera button, Role) */}
        <ProfileHeaderBanner
          currentUser={currentUser}
          apiUrl={API_URL}
          onOpenModal={openSettingsModal}
          onSelectImageFile={handleSelectImageFile}
        />

        {/* Main Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Contact, Employment, Payout Setup */}
          <div className="lg:col-span-4">
            <ProfileSidebarCards
              currentUser={currentUser}
              payoutForm={payoutForm}
              onOpenPayoutSetup={() => openSettingsModal('payout')}
            />
          </div>

          {/* Right Column: Performance Stats, Attendance, Recent Tasks */}
          <div className="lg:col-span-8 space-y-8">
            <ProfileStatsOverview
              stats={stats}
              attStats={attStats}
              loading={statsLoading}
            />

            <ProfileRecentTasks recentTasks={recentTasks} />
          </div>

        </div>

        {/* Edit Profile, Payout & Security Modal */}
        <ProfileSettingsModal
          isOpen={isModalOpen}
          modalTab={modalTab}
          setModalTab={setModalTab}
          onClose={() => setIsModalOpen(false)}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          username={username}
          setUsername={setUsername}
          isStudent={isStudent}
          setIsStudent={setIsStudent}
          studentStatus={studentStatus}
          studentRejectionReason={studentRejectionReason}
          institutionType={institutionType}
          setInstitutionType={setInstitutionType}
          studentInstitution={studentInstitution}
          setStudentInstitution={setStudentInstitution}
          studentLevel={studentLevel}
          setStudentLevel={setStudentLevel}
          profileLoading={profileLoading}
          profileMessage={profileMessage}
          onProfileUpdate={handleProfileUpdate}
          onSelectImageFile={handleSelectImageFile}
          payoutForm={payoutForm}
          setPayoutForm={setPayoutForm}
          payoutLoading={payoutLoading}
          payoutMessage={payoutMessage}
          onSavePayoutSettings={handleSavePayoutSettings}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordLoading={passwordLoading}
          passwordMessage={passwordMessage}
          onPasswordChange={handlePasswordChange}
        />

        {/* Interactive Image Cropper Modal (Facebook/Instagram Style) */}
        <ImageCropperModal
          isOpen={cropModalOpen}
          imageSrc={cropImageSrc}
          type={cropType}
          onClose={() => setCropModalOpen(false)}
          onApplyCrop={handleApplyCroppedImage}
        />

      </div>
    </>
  );
}
