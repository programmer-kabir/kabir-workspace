import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CreditCard,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  XCircle
} from "lucide-react";
import { User, FileText, DownloadCloud, UploadCloud, FileImage, CheckCircle2, Plus, ScanFace } from "lucide-react";
import Tesseract from "tesseract.js";
import { toast } from "react-toastify";
import useAuth from "../../../utlis/Hooks/useAuth";

const Verification = () => {
  const { user } = useAuth();

  const [nidStatus, setNidStatus] = useState(null); // null means not submitted
  const [loadingNid, setLoadingNid] = useState(true);
  const [documentType, setDocumentType] = useState("National ID");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [submittingNid, setSubmittingNid] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // --- Payout State ---
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [addingPayout, setAddingPayout] = useState(false);
  const [newPayoutMethod, setNewPayoutMethod] = useState("paypal");
  const [newPayoutDetails, setNewPayoutDetails] = useState("");
  const [newAccountName, setNewAccountName] = useState("");

  const fetchData = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch NID
      const nidRes = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/verification/get_nid_status.php`, { headers });
      const nidData = await nidRes.json();
      if (nidData.success) {
        setNidStatus(nidData.data);
      }
      setLoadingNid(false);

      // Fetch Payouts
      const payoutRes = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/payout/get_payout_methods.php`, { headers });
      const payoutData = await payoutRes.json();
      if (payoutData.success) {
        setPayoutMethods(payoutData.methods || []);
      }
    } catch (err) {
      console.error("Failed to load verification data", err);
      setLoadingNid(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getDocumentLabels = () => {
    switch (documentType) {
      case "Smart Card":
        return { num: "Smart Card Number", front: "Smart Card Front", back: "Smart Card Back" };
      case "Passport":
        return { num: "Passport Number", front: "Passport Photo Page", back: "Passport Cover/Address Page" };
      case "Driving License":
        return { num: "Driving License Number", front: "License Front Side", back: "License Back Side" };
      case "National ID":
      default:
        return { num: "NID Number", front: "NID Front Side", back: "NID Back Side" };
    }
  };

  const labels = getDocumentLabels();

  // --- OCR Handlers ---
  const performOCR = async (file) => {
    if (!file) return;
    setIsScanning(true);
    setScanProgress(0);

    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setScanProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text;

      console.log("=== OCR EXTRACTED TEXT ===");
      console.log(text);
      console.log("==========================");

      // Try to find "ID NO: XXXXXX" explicitly first, as it's more reliable
      const idNoMatch = text.match(/ID\s*NO[:\s]*(\d+)/i);
      if (idNoMatch) {
        setNidNumber(idNoMatch[1]);
        toast.success("Document number auto-filled!");
      } else {
        // Fallback: try to find a 10, 13, or 17 digit number (NID / Smart Card)
        const cleanTextForNid = text.replace(/[\s-]/g, '');
        const nidMatch = cleanTextForNid.match(/(\d{10}|\d{13}|\d{17})/);
        if (nidMatch) {
          setNidNumber(nidMatch[0]);
          toast.success("Document number auto-filled!");
        }
      }

      // Try to find Date of Birth (e.g. 12 May 1990 or 12/05/1990)
      const dobMatch = text.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i)
        || text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);

      if (dobMatch) {
        let year, month, day;
        if (dobMatch[2].match(/[a-z]/i)) {
          // Format: 12 May 1990
          const monthMap = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
          year = dobMatch[3];
          month = monthMap[dobMatch[2].toLowerCase().substr(0, 3)];
          day = dobMatch[1].padStart(2, '0');
        } else {
          // Format: 12/05/1990
          day = dobMatch[1];
          month = dobMatch[2];
          year = dobMatch[3];
        }
        setDateOfBirth(`${year}-${month}-${day}`);
        toast.success("Date of birth auto-filled!");
      }

      // Try to find Name (Usually follows "Name:" or "Name")
      const nameMatch = text.match(/Name[:\s]+([A-Z\s]+)/i);
      if (nameMatch && nameMatch[1].trim().length > 3) {
        // Basic clean up of name
        let cleanName = nameMatch[1].trim().replace(/\n/g, ' ').replace(/[^A-Za-z\s]/g, '');
        setFullName(cleanName);
        toast.success("Name auto-filled!");
      }

    } catch (err) {
      console.error("OCR Error:", err);
      toast.error("Auto-scan failed, please fill manually.");
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleFrontImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontImage(file);
      performOCR(file);
    }
  };

  // --- Handlers ---
  const handleNidSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !dateOfBirth || !nidNumber.trim() || !frontImage || !backImage || !selfieImage) {
      toast.error("Please fill all fields and upload all required images.");
      return;
    }

    setSubmittingNid(true);
    try {
      const token = await user.getIdToken();
      
      const uploadToR2 = async (file) => {
        const urlRes = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/config/generate_presigned_url.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ filename: file.name, contentType: file.type, type: 'nid' })
        });
        const urlData = await urlRes.json();
        if (urlData.status !== 'success') throw new Error(urlData.message || 'Failed to generate URL');
        
        await fetch(urlData.presignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file
        });
        return urlData.r2Key;
      };

      const frontImageKey = await uploadToR2(frontImage);
      const backImageKey = await uploadToR2(backImage);
      const selfieImageKey = await uploadToR2(selfieImage);

      const formData = new FormData();
      formData.append("document_type", documentType);
      formData.append("full_name", fullName);
      formData.append("date_of_birth", dateOfBirth);
      formData.append("nid_number", nidNumber);
      formData.append("front_image_key", frontImageKey);
      formData.append("back_image_key", backImageKey);
      formData.append("selfie_image_key", selfieImageKey);

      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/verification/upload_nid.php`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit identity verification.");
    } finally {
      setSubmittingNid(false);
    }
  };

  const handleAddPayoutMethod = async (e) => {
    e.preventDefault();
    if (!newPayoutDetails.trim() || !newAccountName.trim()) {
      toast.error("Please fill in all account details.");
      return;
    }
    
    setAddingPayout(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/payout/add_payout_method.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          payment_method: newPayoutMethod, 
          account_email: newPayoutDetails,
          account_name: newAccountName
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setNewPayoutDetails("");
        setNewAccountName("");
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add payout method.");
    } finally {
      setAddingPayout(false);
    }
  };

  const handleDeletePayoutMethod = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payout method?")) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/payout/delete_payout_method.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete payout method.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Verification Center</h2>
        <p className="text-sm text-gray-400 mt-1">
          Complete your identity and payment verification to start earning.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* IDENTITY VERIFICATION */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Identity Verification</h3>
                <p className="text-xs text-gray-500">Government ID (NID)</p>
              </div>
            </div>

            {loadingNid ? (
              <Loader2 className="animate-spin text-gray-400" size={16} />
            ) : nidStatus ? (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${nidStatus.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                  nidStatus.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                }`}>
                {nidStatus.status === 'verified' && <CheckCircle size={14} />}
                {nidStatus.status === 'pending' && <Clock size={14} />}
                {nidStatus.status === 'rejected' && <XCircle size={14} />}
                <span>{nidStatus.status}</span>
              </div>
            ) : null}
          </div>

          <div className="flex-1">
            {!loadingNid && (!nidStatus || nidStatus.status === 'rejected') ? (
              <form onSubmit={handleNidSubmit} className="space-y-4">
                {nidStatus?.status === 'rejected' && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 flex gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <div>
                      <p className="font-bold mb-1">Verification Rejected</p>
                      <p>{nidStatus.rejection_reason || "Your document was not accepted. Please upload clear images."}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Document Type</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="National ID" className="bg-[#0F0F1A]">National ID (NID)</option>
                      <option value="Smart Card" className="bg-[#0F0F1A]">Smart Card</option>
                      {/* <option value="Passport" className="bg-[#0F0F1A]">Passport</option>
                      <option value="Driving License" className="bg-[#0F0F1A]">Driving License</option> */}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"

                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">{labels.num}</label>
                    <input
                      type="text"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Front Image */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">{labels.front}</label>
                    <label className="flex flex-col items-center justify-center h-24 w-full rounded-xl border-2 border-dashed border-white/10 bg-black/20 cursor-pointer hover:border-blue-500 hover:bg-white/5 transition-all">
                      {isScanning ? (
                        <div className="text-center">
                          <ScanFace size={24} className="mx-auto text-blue-400 mb-1 animate-pulse" />
                          <span className="text-xs text-blue-400">Scanning... {scanProgress}%</span>
                        </div>
                      ) : frontImage ? (
                        <div className="text-center">
                          <FileImage size={24} className="mx-auto text-blue-400 mb-1" />
                          <span className="text-xs text-gray-300 line-clamp-1 px-2">{frontImage.name}</span>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <UploadCloud size={24} className="mx-auto mb-1" />
                          <span className="text-xs">Upload Front</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFrontImageUpload} disabled={isScanning} />
                    </label>
                  </div>

                  {/* Back Image */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">{labels.back}</label>
                    <label className="flex flex-col items-center justify-center h-24 w-full rounded-xl border-2 border-dashed border-white/10 bg-black/20 cursor-pointer hover:border-blue-500 hover:bg-white/5 transition-all">
                      {backImage ? (
                        <div className="text-center">
                          <FileImage size={24} className="mx-auto text-blue-400 mb-1" />
                          <span className="text-xs text-gray-300 line-clamp-1 px-2">{backImage.name}</span>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <UploadCloud size={24} className="mx-auto mb-1" />
                          <span className="text-xs">Upload Back</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setBackImage(e.target.files[0])} />
                    </label>
                  </div>
                </div>

                {/* Selfie Image */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Selfie Photo (Holding Document)</label>
                  <label className="flex flex-col items-center justify-center h-24 w-full rounded-xl border-2 border-dashed border-white/10 bg-black/20 cursor-pointer hover:border-blue-500 hover:bg-white/5 transition-all">
                    {selfieImage ? (
                      <div className="text-center">
                        <FileImage size={24} className="mx-auto text-blue-400 mb-1" />
                        <span className="text-xs text-gray-300 line-clamp-1 px-2">{selfieImage.name}</span>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <UploadCloud size={24} className="mx-auto mb-1" />
                        <span className="text-xs">Upload Selfie</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelfieImage(e.target.files[0])} />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submittingNid}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
                >
                  {submittingNid ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Submit Identity Document
                </button>
              </form>
            ) : nidStatus?.status === 'pending' ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <Clock size={48} className="text-yellow-500 mb-4 opacity-50" />
                <h4 className="text-lg font-bold text-white mb-2">Verification Pending</h4>
                <p className="text-sm text-gray-400 max-w-xs">
                  Your identity documents are currently under review. This usually takes 1-3 business days.
                </p>
              </div>
            ) : nidStatus?.status === 'verified' ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <ShieldCheck size={48} className="text-green-500 mb-4 opacity-80" />
                <h4 className="text-lg font-bold text-white mb-2">Identity Verified</h4>
                <p className="text-sm text-gray-400 max-w-xs mb-4">
                  Your identity has been successfully verified. You are eligible for payouts.
                </p>
                <div className="bg-black/20 rounded-lg px-4 py-2 border border-white/5 inline-block text-left">
                  <p className="text-xs text-gray-500">{nidStatus.document_type || "Document"} Number</p>
                  <p className="text-sm font-mono text-gray-300">{nidStatus.nid_number.replace(/.(?=.{4})/g, '*')}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* PAYOUT VERIFICATION */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#6C4FE0]/10 p-2.5 text-[#6C4FE0]">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Payout Methods</h3>
              <p className="text-xs text-gray-500">Add and manage withdrawal options</p>
            </div>
          </div>

          {/* Added Methods List */}
          {payoutMethods.length > 0 && (
            <div className="space-y-3">
              {payoutMethods.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/20">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{m.payment_method}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${m.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                          m.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                        }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{m.account_email}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{m.account_name}</p>
                  </div>
                  <button
                    onClick={() => handleDeletePayoutMethod(m.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors bg-white/5 rounded-lg border border-white/5"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddPayoutMethod} className="space-y-4 pt-4 border-t border-white/5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Add New Method</p>
            <div className="grid grid-cols-3 gap-2">
              {['paypal', 'payoneer', 'skrill'].map((opt) => (
                <label key={opt}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border py-2.5 text-[11px] font-bold uppercase transition-all duration-200 ${newPayoutMethod === opt
                      ? "border-[#6C4FE0] bg-[#6C4FE0]/10 text-white"
                      : "border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  onClick={() => setNewPayoutMethod(opt)}
                >
                  {opt}
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Account Email Address</label>
              <input
                type="email"
                value={newPayoutDetails}
                onChange={(e) => setNewPayoutDetails(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#6C4FE0] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Account Holder Name</label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#6C4FE0] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={addingPayout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-white/10 border border-white/10 disabled:opacity-50"
            >
              {addingPayout ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Submit for Verification
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Verification;
