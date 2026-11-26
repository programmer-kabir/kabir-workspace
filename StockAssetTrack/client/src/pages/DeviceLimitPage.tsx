import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Laptop, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { replaceDeviceSlot } from '../services/api';

export function DeviceLimitPage() {
  const navigate = useNavigate();
  const { deviceChallenge, completeDeviceReplace, clearDeviceChallenge } = useAuth();
  const [replacingId, setReplacingId] = useState<number | null>(null);

  if (!deviceChallenge) {
    return (
      <section className="mx-auto max-w-xl px-4 py-14 text-center sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 dark:border-slate-800 dark:bg-slate-900/75">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">No Active Device Conflict</h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Your browser slot is currently within your plan limit.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/dashboard" className="rounded-xl bg-brand-indigo px-4 py-2 text-xs font-semibold text-white">
              Open Dashboard
            </Link>
            <Link
              to="/auth"
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const handleReplace = async (oldDeviceId: number) => {
    setReplacingId(oldDeviceId);
    try {
      await replaceDeviceSlot({
        replaceDeviceId: oldDeviceId,
        deviceToken: deviceChallenge.deviceToken,
        deviceLabel: navigator.platform || 'Web Browser',
        pendingToken: deviceChallenge.pendingToken,
      });
      await completeDeviceReplace(deviceChallenge.pendingToken, deviceChallenge.deviceToken);
      toast.success('Device slot swapped! Signed in cleanly.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to swap device slot');
    } finally {
      setReplacingId(null);
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-amber-500/40 bg-white/90 p-6 shadow-xl dark:bg-slate-900/80">
        <div className="flex items-center gap-2.5 text-amber-500">
          <ShieldAlert className="h-6 w-6" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Active Device Limit Reached ({deviceChallenge.devices.length} / {deviceChallenge.maxDevices})
          </h1>
        </div>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Your <strong className="uppercase">{deviceChallenge.planTier}</strong> plan allows up to{' '}
          <strong>{deviceChallenge.maxDevices}</strong> concurrent device slots. Select an existing device below to sign it out and authorize this browser.
        </p>

        <div className="mt-5 space-y-3">
          {deviceChallenge.devices.map((device) => (
            <div
              key={device.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center gap-3">
                <Laptop className="h-5 w-5 text-brand-indigo" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{device.deviceLabel}</div>
                  <div className="text-[11px] text-slate-500">
                    Last active: {new Date(`${device.lastActiveAt}Z`).toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={replacingId === device.id}
                onClick={() => void handleReplace(device.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-indigo px-3.5 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${replacingId === device.id ? 'animate-spin' : ''}`} />
                <span>Replace &amp; Continue</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              clearDeviceChallenge();
              navigate('/auth');
            }}
            className="text-slate-500 hover:underline"
          >
            Back to Sign In
          </button>
          <Link to="/pricing" className="font-semibold text-brand-cyan hover:underline">
            Upgrade to Pro (3 Slots) or Annual (5 Slots) &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
