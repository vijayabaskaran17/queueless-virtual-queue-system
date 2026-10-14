import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle2, Clock, ShieldCheck, Bell } from 'lucide-react';
import api from '../../services/api';

const QueueSettingsPage = () => {
  const [settings, setSettings] = useState({
    maxTokensPerCustomerPerDay: 5,
    businessHoursStart: '08:30',
    businessHoursEnd: '17:30',
    allowCancellation: true,
    autoNotifyApproachingThreshold: 3,
    soundAlertsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data.success && res.data.data) {
          setSettings(res.data.data);
        }
      } catch (err) {
        console.warn('Settings fetch notice:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await api.put('/admin/settings', settings);
      if (res.data.success) {
        setSuccessMsg('Branch queue settings updated and saved successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Queue Rules & Policies</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure automated branch queue rules, daily limits, operating hours, and notification thresholds
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-subtle space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Branch Limits & Access
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Daily Tokens Per Customer
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxTokensPerCustomerPerDay}
                onChange={(e) =>
                  setSettings({ ...settings, maxTokensPerCustomerPerDay: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Prevents token abuse across multiple services in a single day.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approaching Turn Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.autoNotifyApproachingThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, autoNotifyApproachingThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Sends proactive alert when customer reaches this position in line.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Operating Business Hours
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Queue Opening Time
              </label>
              <input
                type="time"
                value={settings.businessHoursStart}
                onChange={(e) => setSettings({ ...settings, businessHoursStart: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Queue Closing Time
              </label>
              <input
                type="time"
                value={settings.businessHoursEnd}
                onChange={(e) => setSettings({ ...settings, businessHoursEnd: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            Customer Permissions
          </h3>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowCancel"
              checked={settings.allowCancellation}
              onChange={(e) => setSettings({ ...settings, allowCancellation: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="allowCancel" className="text-xs text-slate-700 font-medium">
              Allow customers to self-cancel an active token before being called
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="soundAlerts"
              checked={settings.soundAlertsEnabled}
              onChange={(e) => setSettings({ ...settings, soundAlertsEnabled: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="soundAlerts" className="text-xs text-slate-700 font-medium">
              Enable audio chime for turn announcements and token calls
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20"
          >
            {saving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QueueSettingsPage;
