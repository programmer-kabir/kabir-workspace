import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

/**
 * useProfileData
 * Encapsulates all data fetching, form state, and handlers for Profile.
 */
export default function useProfileData() {
  const { currentUser, updateUser } = useAuth();
  const API_URL = (import.meta.env.VITE_API_BASE_URL) + '';

  // Profile Form States
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [isStudent, setIsStudent] = useState(Boolean(currentUser?.is_student));
  const [studentStatus, setStudentStatus] = useState(currentUser?.student_status || (currentUser?.is_student ? 'approved' : 'none'));
  const [studentRejectionReason, setStudentRejectionReason] = useState(currentUser?.student_rejection_reason || null);
  const [institutionType, setInstitutionType] = useState(currentUser?.institution_type || 'College');
  const [studentInstitution, setStudentInstitution] = useState(currentUser?.student_institution || '');
  const [studentLevel, setStudentLevel] = useState(currentUser?.student_level || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('profile'); // 'profile' | 'payout' | 'security'

  // Image Cropper States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropType, setCropType] = useState('profile'); // 'profile' | 'cover'

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Payout Settings State
  const [payoutForm, setPayoutForm] = useState({
    payment_method: 'bkash',
    account_number: '',
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    routing_number: '',
  });
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState(null);

  // Stats States
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [attStats, setAttStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Sync basic info when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setUsername(currentUser.username || '');
      setIsStudent(Boolean(currentUser.is_student));
      setStudentStatus(currentUser.student_status || (currentUser.is_student ? 'approved' : 'none'));
      setStudentRejectionReason(currentUser.student_rejection_reason || null);
      setInstitutionType(currentUser.institution_type || 'College');
      setStudentInstitution(currentUser.student_institution || '');
      setStudentLevel(currentUser.student_level || '');
    }
  }, [currentUser]);

  // Fetch payout settings
  const fetchPayoutSettings = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.get(
        `${API_URL}api/payroll/get_payout_settings.php?user_id=${currentUser.id}`
      );
      if (res.data.status === 'success' && res.data.data) {
        setPayoutForm(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching payout settings:', err);
    }
  }, [currentUser?.id, API_URL]);

  // Fetch stats & tasks
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}api/profile/get_my_stats.php?user_id=${currentUser.id}`
        );
        if (res.data.status === 'success') {
          setStats(res.data.data.task_stats);
          setRecentTasks(res.data.data.recent_tasks);
          setAttStats(res.data.data.attendance_stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchStats();
      fetchPayoutSettings();
    }
  }, [currentUser?.id, API_URL, fetchPayoutSettings]);

  // Handle file selection from user (triggers Cropper Modal)
  const handleSelectImageFile = (file, type) => {
    if (!file) return;
    setCropType(type);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropImageSrc(reader.result?.toString() || '');
      setCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  // Handle applying the cropped image and uploading
  const handleApplyCroppedImage = async (croppedBlob, croppedFile) => {
    setCropModalOpen(false);
    const uid = currentUser?.id || currentUser?.user_id;
    const formData = new FormData();
    formData.append('image', croppedFile);
    formData.append('user_id', uid);
    formData.append('type', cropType);

    setProfileMessage({ text: `Uploading cropped ${cropType} picture...`, type: 'info' });
    try {
      // Do not manually set 'Content-Type': 'multipart/form-data' so browser automatically appends boundary
      const res = await axios.post(
        `${API_URL}api/profile/upload_pictures.php?user_id=${uid}&type=${cropType}`,
        formData
      );
      if (res.data.status === 'success') {
        setProfileMessage({ text: res.data.message, type: 'success' });
        updateUser({
          [cropType === 'profile' ? 'profile_picture' : 'cover_picture']: res.data.path,
        });
        setTimeout(() => setProfileMessage(null), 3500);
      } else {
        setProfileMessage({ text: res.data.message, type: 'error' });
      }
    } catch (error) {
      setProfileMessage({ text: 'Error uploading cropped image.', type: 'error' });
    }
  };

  // Payout Save Handler
  const handleSavePayoutSettings = async (e) => {
    if (e) e.preventDefault();
    if (!payoutForm.account_number.trim()) {
      setPayoutMessage({ text: 'Please enter your account number/phone number.', type: 'error' });
      return;
    }
    setPayoutLoading(true);
    setPayoutMessage(null);
    try {
      const res = await axios.post(`${API_URL}api/payroll/save_payout_settings.php`, {
        user_id: currentUser.id,
        ...payoutForm,
      });
      if (res.data.status === 'success') {
        setPayoutMessage({ text: 'Payout payment method saved successfully!', type: 'success' });
        setTimeout(() => setPayoutMessage(null), 3500);
      } else {
        setPayoutMessage({ text: res.data.message || 'Failed to save payout method.', type: 'error' });
      }
    } catch (err) {
      setPayoutMessage({ text: 'Error saving payout settings.', type: 'error' });
    } finally {
      setPayoutLoading(false);
    }
  };

  // Profile Info Update Handler
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const studentPayload = {
        is_student: isStudent ? 1 : 0,
        institution_type: isStudent ? institutionType : '',
        student_institution: isStudent ? studentInstitution : '',
        student_level: isStudent ? studentLevel : '',
      };

      const res = await axios.post(`${API_URL}api/profile/update_profile.php`, {
        user_id: currentUser.id,
        name,
        phone,
        username,
        ...studentPayload,
      });

      if (res.data.status === 'success') {
        const returnedStatus = res.data.data?.student_status || res.data.student_status || (isStudent ? 'pending' : 'none');
        setStudentStatus(returnedStatus);
        setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
        updateUser({
          name,
          phone,
          username,
          ...studentPayload,
          student_status: returnedStatus,
        });
        setTimeout(() => {
          setIsModalOpen(false);
          setProfileMessage(null);
        }, 1200);
      } else {
        setProfileMessage({ text: res.data.message || 'Failed to update profile.', type: 'error' });
      }
    } catch (error) {
      setProfileMessage({
        text: error.response?.data?.message || 'Server error occurred.',
        type: 'error',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Change Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      const res = await axios.post(`${API_URL}api/profile/change_password.php`, {
        user_id: currentUser.id,
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.data.status === 'success') {
        setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({
          text: res.data.message || 'Failed to update password.',
          type: 'error',
        });
      }
    } catch (error) {
      setPasswordMessage({ text: 'Server error occurred.', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const openSettingsModal = (tab = 'profile') => {
    setName(currentUser?.name || '');
    setPhone(currentUser?.phone || '');
    setUsername(currentUser?.username || '');
    setIsStudent(Boolean(currentUser?.is_student));
    setStudentStatus(currentUser?.student_status || (currentUser?.is_student ? 'approved' : 'none'));
    setStudentRejectionReason(currentUser?.student_rejection_reason || null);
    setInstitutionType(currentUser?.institution_type || 'College');
    setStudentInstitution(currentUser?.student_institution || '');
    setStudentLevel(currentUser?.student_level || '');
    setModalTab(tab);
    setIsModalOpen(true);
  };

  return {
    currentUser,
    API_URL,
    // Profile form
    name,
    setName,
    phone,
    setPhone,
    username,
    setUsername,
    isStudent,
    setIsStudent,
    studentStatus,
    setStudentStatus,
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
    // Image cropping
    cropModalOpen,
    setCropModalOpen,
    cropImageSrc,
    cropType,
    handleSelectImageFile,
    handleApplyCroppedImage,
    // Payout settings
    payoutForm,
    setPayoutForm,
    payoutLoading,
    payoutMessage,
    handleSavePayoutSettings,
    // Password
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordLoading,
    passwordMessage,
    handlePasswordChange,
    // Modal
    isModalOpen,
    setIsModalOpen,
    modalTab,
    setModalTab,
    openSettingsModal,
    // Stats
    stats,
    recentTasks,
    attStats,
    statsLoading,
  };
}

