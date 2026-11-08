import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import MangoHoldModal from './MangoHoldModal';
import MangoReleaseModal from './MangoReleaseModal';
import MangoTransferModal from './MangoTransferModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const getAuthToken = () => {
  return localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token') || localStorage.getItem('token') || '';
};

export default function MangoVaultModals({
  activeModal,
  selectedStaff,
  staffList = [],
  closeModal,
  onSuccess
}) {
  const [modalCount, setModalCount] = useState(1);
  const [modalNote, setModalNote] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferSource, setTransferSource] = useState('vault');
  const [submitting, setSubmitting] = useState(false);

  // Sync initial values when activeModal or selectedStaff changes
  useEffect(() => {
    if (!selectedStaff || !activeModal) return;
    setModalCount(1);
    if (activeModal === 'hold') {
      setModalNote('Reserved in Admin Vault to regulate break consumption.');
    } else if (activeModal === 'release') {
      setModalNote('Emergency release from Admin Vault to staff tree.');
    } else if (activeModal === 'transfer') {
      setTransferSource(selectedStaff.vault_held_mangoes > 0 ? 'vault' : 'tree');
      setTransferTargetId('');
      setModalNote('Administrative Mango Transfer for peer support.');
    }
  }, [activeModal, selectedStaff]);

  const handleHoldSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff || modalCount <= 0) return;
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(
        `${API_BASE}api/breaks/manage_mango_vault.php?action=hold&token=${encodeURIComponent(token)}`,
        {
          token,
          action: 'hold',
          user_id: selectedStaff.user_id,
          mango_count: modalCount,
          note: modalNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Mango(es) successfully held in vault!');
        closeModal();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.data.message || 'Failed to hold mango(es).');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error executing hold action.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff || modalCount <= 0) return;
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(
        `${API_BASE}api/breaks/manage_mango_vault.php?action=release&token=${encodeURIComponent(token)}`,
        {
          token,
          action: 'release',
          user_id: selectedStaff.user_id,
          mango_count: modalCount,
          note: modalNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Mango(es) successfully released back to tree!');
        closeModal();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.data.message || 'Failed to release mango(es).');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error executing release action.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !transferTargetId || modalCount <= 0) {
      toast.error('Please select a recipient colleague and specify mango count.');
      return;
    }
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(
        `${API_BASE}api/breaks/manage_mango_vault.php?action=transfer&token=${encodeURIComponent(token)}`,
        {
          token,
          action: 'transfer',
          source_user_id: selectedStaff.user_id,
          target_user_id: transferTargetId,
          mango_count: modalCount,
          from_source: transferSource,
          note: modalNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Mango(es) successfully transferred!');
        closeModal();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.data.message || 'Failed to transfer mango(es).');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error executing transfer action.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <MangoHoldModal
        isOpen={activeModal === 'hold'}
        selectedStaff={selectedStaff}
        modalCount={modalCount}
        setModalCount={setModalCount}
        modalNote={modalNote}
        setModalNote={setModalNote}
        submitting={submitting}
        handleHoldSubmit={handleHoldSubmit}
        closeModal={closeModal}
      />

      <MangoReleaseModal
        isOpen={activeModal === 'release'}
        selectedStaff={selectedStaff}
        modalCount={modalCount}
        setModalCount={setModalCount}
        modalNote={modalNote}
        setModalNote={setModalNote}
        submitting={submitting}
        handleReleaseSubmit={handleReleaseSubmit}
        closeModal={closeModal}
      />

      <MangoTransferModal
        isOpen={activeModal === 'transfer'}
        selectedStaff={selectedStaff}
        staffList={staffList}
        transferSource={transferSource}
        setTransferSource={setTransferSource}
        transferTargetId={transferTargetId}
        setTransferTargetId={setTransferTargetId}
        modalCount={modalCount}
        setModalCount={setModalCount}
        modalNote={modalNote}
        setModalNote={setModalNote}
        submitting={submitting}
        handleTransferSubmit={handleTransferSubmit}
        closeModal={closeModal}
      />
    </>
  );
}

