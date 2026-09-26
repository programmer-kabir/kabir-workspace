import { useState } from "react";
import {
  Bell,
  Eye,
  Shield,
  Trash2,
  AlertTriangle,
  Monitor,
  Globe,
  CheckCircle,
  CreditCard,
  Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "../../../utlis/Hooks/useAuth";

const Toggle = ({ checked, onChange, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? "bg-[#6C4FE0]" : "bg-white/10"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

const SettingRow = ({ label, description, checked, onChange, id }) => (
  <div className="flex items-center justify-between gap-6 py-4 border-b border-white/5 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white">{label}</p>
      {description && (
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      )}
    </div>
    <Toggle id={id} checked={checked} onChange={onChange} />
  </div>
);

const Settings = () => {
  const { user } = useAuth();
  
  const [notifs, setNotifs] = useState({
    contentApproved: true,
    contentRejected: true,
    newDownload: false,
    weeklyReport: true,
    payoutProcessed: true,
    platformUpdates: false,
  });

  const [privacy, setPrivacy] = useState({
    showPortfolio: true,
    showEarnings: false,
    showDownloads: true,
  });

  const [display, setDisplay] = useState({
    compactMode: false,
    showThumbnails: true,
    showFileSize: true,
  });

  const [language, setLanguage] = useState("en");
  const [saved, setSaved] = useState(false);

  const toggle = (group, key) => {
    const setters = { notifs: setNotifs, privacy: setPrivacy, display: setDisplay };
    setters[group]((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    toast.success("Settings saved successfully!");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage your notification preferences, privacy, and display options
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* NOTIFICATION SETTINGS */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl bg-[#6C4FE0]/10 p-2.5 text-[#6C4FE0]">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Email Notifications</h3>
                <p className="text-xs text-gray-500">Choose which emails you want to receive</p>
              </div>
            </div>
            <div>
              <SettingRow
                id="notif-approved"
                label="Content Approved"
                description="Get notified when your submitted content is approved and published"
                checked={notifs.contentApproved}
                onChange={() => toggle("notifs", "contentApproved")}
              />
              <SettingRow
                id="notif-rejected"
                label="Content Rejected"
                description="Get notified when a submission is rejected with reviewer feedback"
                checked={notifs.contentRejected}
                onChange={() => toggle("notifs", "contentRejected")}
              />
              <SettingRow
                id="notif-download"
                label="New Download Alert"
                description="Receive an email every time someone downloads your asset"
                checked={notifs.newDownload}
                onChange={() => toggle("notifs", "newDownload")}
              />
              <SettingRow
                id="notif-weekly"
                label="Weekly Performance Report"
                description="A weekly digest of your downloads, views, and earnings"
                checked={notifs.weeklyReport}
                onChange={() => toggle("notifs", "weeklyReport")}
              />
              <SettingRow
                id="notif-payout"
                label="Payout Processed"
                description="Confirmation email when your earnings payout is sent"
                checked={notifs.payoutProcessed}
                onChange={() => toggle("notifs", "payoutProcessed")}
              />
              <SettingRow
                id="notif-platform"
                label="Platform Updates & News"
                description="Announcements about new features, policy changes, and promotions"
                checked={notifs.platformUpdates}
                onChange={() => toggle("notifs", "platformUpdates")}
              />
            </div>
          </div>

          {/* PRIVACY SETTINGS */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                <Eye size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Privacy Controls</h3>
                <p className="text-xs text-gray-500">Control what others can see on your public profile</p>
              </div>
            </div>
            <div>
              <SettingRow
                id="priv-portfolio"
                label="Public Portfolio"
                description="Allow your published assets to appear on your public contributor page"
                checked={privacy.showPortfolio}
                onChange={() => toggle("privacy", "showPortfolio")}
              />
              <SettingRow
                id="priv-earnings"
                label="Show Earnings on Profile"
                description="Display your total earnings badge on your public profile"
                checked={privacy.showEarnings}
                onChange={() => toggle("privacy", "showEarnings")}
              />
              <SettingRow
                id="priv-downloads"
                label="Show Download Count"
                description="Display total download count on individual asset pages"
                checked={privacy.showDownloads}
                onChange={() => toggle("privacy", "showDownloads")}
              />
            </div>
          </div>

          {/* DISPLAY PREFERENCES */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
                <Monitor size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Display Preferences</h3>
                <p className="text-xs text-gray-500">Customize how the dashboard looks for you</p>
              </div>
            </div>
            <div>
              <SettingRow
                id="disp-compact"
                label="Compact Table Mode"
                description="Show more items per page with reduced row height in file lists"
                checked={display.compactMode}
                onChange={() => toggle("display", "compactMode")}
              />
              <SettingRow
                id="disp-thumbnails"
                label="Show File Thumbnails"
                description="Display preview thumbnails in your files list for quick identification"
                checked={display.showThumbnails}
                onChange={() => toggle("display", "showThumbnails")}
              />
              <SettingRow
                id="disp-filesize"
                label="Show File Sizes"
                description="Display file size column in your portfolio and upload views"
                checked={display.showFileSize}
                onChange={() => toggle("display", "showFileSize")}
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button
            onClick={handleSave}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold text-white transition-all duration-300 ${
              saved
                ? "bg-emerald-500 shadow-lg shadow-emerald-500/25"
                : "bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] shadow-lg shadow-[#6C4FE0]/25 hover:shadow-[#6C4FE0]/40 active:scale-[0.99]"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle size={18} />
                <span>Saved!</span>
              </>
            ) : (
              "Save All Settings"
            )}
          </button>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">

          {/* LANGUAGE */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-400">
                <Globe size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Language</h3>
                <p className="text-xs text-gray-500">Dashboard display language</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#6C4FE0] appearance-none cursor-pointer"
            >
              <option value="en" className="bg-[#0F0F1A]">English</option>
              <option value="bn" className="bg-[#0F0F1A]">বাংলা (Bengali)</option>
              <option value="hi" className="bg-[#0F0F1A]">हिन्दी (Hindi)</option>
              <option value="ar" className="bg-[#0F0F1A]">العربية (Arabic)</option>
              <option value="es" className="bg-[#0F0F1A]">Español (Spanish)</option>
            </select>
          </div>

          {/* SECURITY */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#6C4FE0]/10 p-2.5 text-[#6C4FE0]">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Security</h3>
                <p className="text-xs text-gray-500">Account protection info</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Authentication</span>
                <span className="font-semibold text-white">Google SSO</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">2FA Status</span>
                <span className="font-semibold text-emerald-400">Enabled via Google</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Last Sign-in</span>
                <span className="font-semibold text-white">Today</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Your account is protected via Google authentication. Password management is handled by Google.
            </p>
          </div>

          {/* DANGER ZONE */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-500/10 p-2.5 text-red-400">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
                <p className="text-xs text-gray-500">Irreversible actions</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Deleting your contributor account will permanently remove all your assets, earnings records, and statistics. This action cannot be undone.
            </p>
            <button
              onClick={() =>
                toast.error("To delete your account, please contact support@dayalstock.com")
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition-all duration-200 hover:bg-red-500/20 hover:border-red-500/50"
            >
              <Trash2 size={16} />
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
