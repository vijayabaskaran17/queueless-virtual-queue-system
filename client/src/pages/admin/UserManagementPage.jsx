import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  Check,
  X,
  Edit2,
  MailPlus,
  Copy,
  CheckCheck,
  Clock,
  Building2,
  AlertCircle,
  Ban,
  Send,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { formatIndianDate } from '../../utils/dateUtils';

const UserManagementPage = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'invitations'

  // Users state
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [isActive, setIsActive] = useState(true);

  // Invitations state
  const [invitations, setInvitations] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    notes: '',
    suggestedEmployeeId: '',
    expiryHours: 48,
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', {
        params: { role: roleFilter || undefined, search: search || undefined },
      });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.warn('Users fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await api.get('/admin/invitations');
      if (res.data.success) {
        setInvitations(res.data.data);
        if (res.data.organization) {
          setOrganization(res.data.organization);
        }
      }
    } catch (err) {
      console.warn('Invitations fetch notice:', err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  useEffect(() => {
    if (activeTab === 'invitations') {
      fetchInvitations();
    }
  }, [activeTab]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await api.put(`/admin/users/${editingUser._id}`, {
        role: selectedRole,
        isActive,
      });
      if (res.data.success) {
        setEditingUser(null);
        await fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating user');
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess(null);
    setInviteSubmitting(true);

    try {
      const res = await api.post('/admin/invitations', inviteForm);
      if (res.data.success) {
        setInviteSuccess(res.data.data);
        setInviteForm({
          email: '',
          notes: '',
          suggestedEmployeeId: '',
          expiryHours: 48,
        });
        await fetchInvitations();
      }
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Error generating staff invitation');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRevokeInvitation = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this staff invitation?')) return;
    try {
      const res = await api.delete(`/admin/invitations/${id}`);
      if (res.data.success) {
        await fetchInvitations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error revoking invitation');
    }
  };

  const handleCopyLink = (url, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User &amp; Access Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization members, verify roles, and dispatch single-use staff invitations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setInviteError('');
              setInviteSuccess(null);
              setInviteModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <MailPlus className="w-4 h-4" />
            <span>Invite Staff Member</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto no-scrollbar pb-0.5">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Accounts ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invitations')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'invitations'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MailPlus className="w-4 h-4" />
            <span>Staff Invitations ({invitations.length})</span>
          </button>
        </div>

        {activeTab === 'invitations' && organization && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pb-2 shrink-0">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Organization: <b>{organization.name}</b></span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
              {organization.code}
            </span>
          </div>
        )}
      </div>

      {/* ================= TAB 1: USERS DIRECTORY ================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Role Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold w-full sm:w-auto overflow-x-auto no-scrollbar">
              {['', 'customer', 'staff', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition-colors flex-1 sm:flex-initial text-center ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {r || 'All Roles'}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-4 px-6">User</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Organization</th>
                    <th className="py-4 px-6">Assigned Counter</th>
                    <th className="py-4 px-6">Account Status</th>
                    <th className="py-4 px-6">Joined Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                        {u.employeeId && (
                          <div className="text-[10px] text-teal-700 font-mono mt-0.5">
                            ID: {u.employeeId}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : u.role === 'staff'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {u.organization?.name || (u.role === 'customer' ? 'Public' : 'QueueLess')}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {u.assignedCounter ? u.assignedCounter.name : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            u.isActive
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                        {formatIndianDate(u.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setSelectedRole(u.role);
                            setIsActive(u.isActive);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: STAFF INVITATIONS ================= */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Single-Use Staff Invitations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Invitations allow verified employees to activate a staff account without fixed email domains or public self-assignment.
                </p>
              </div>

              <button
                onClick={() => {
                  setInviteError('');
                  setInviteSuccess(null);
                  setInviteModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm self-start sm:self-auto"
              >
                <MailPlus className="w-3.5 h-3.5" />
                <span>+ Create Invitation</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-4 px-6">Invited Email</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Role / Department</th>
                    <th className="py-4 px-6">Suggested ID</th>
                    <th className="py-4 px-6">Invited By</th>
                    <th className="py-4 px-6">Expires</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No invitations sent yet. Click "+ Create Invitation" to invite a staff member.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => {
                      const isExpired =
                        inv.status === 'pending' &&
                        new Date(inv.expiresAt) < new Date();
                      const displayStatus = isExpired ? 'expired' : inv.status;
                      const invitationUrl = `${window.location.origin}/register?invitation=${inv.token}`;

                      return (
                        <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-900">
                            {inv.email}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                displayStatus === 'accepted'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                  : displayStatus === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : displayStatus === 'expired'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {displayStatus}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            {inv.notes || 'Staff Operator'}
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                            {inv.suggestedEmployeeId || '-'}
                          </td>
                          <td className="py-4 px-6 text-slate-500">
                            {inv.invitedBy?.name || 'Administrator'}
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {formatIndianDate(inv.expiresAt)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            {displayStatus === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(invitationUrl, inv._id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                                  title="Copy single-use invitation link"
                                >
                                  {copiedId === inv._id ? (
                                    <>
                                      <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy Link</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRevokeInvitation(inv._id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                                  title="Revoke invitation"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Revoke</span>
                                </button>
                              </>
                            )}

                            {displayStatus === 'accepted' && (
                              <span className="text-[11px] text-teal-700 font-semibold">
                                Activated
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.name}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-400">Email:</span> <b>{editingUser?.email}</b>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="customer">Customer</option>
              <option value="staff">Staff Member</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700">
              Account Active (Permit Login)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: INVITE STAFF MEMBER ================= */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteSuccess(null);
        }}
        title="Invite New Organization Staff Member"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          {inviteError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{inviteError}</span>
            </div>
          )}

          {inviteSuccess && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold">Single-Use Invitation Generated &amp; Dispatched!</h4>
              </div>
              <p className="text-[11px] text-teal-800 leading-snug">
                The employee can activate their staff clearance directly using this secure link:
              </p>
              <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-teal-200">
                <input
                  type="text"
                  readOnly
                  value={inviteSuccess.invitationUrl}
                  className="w-full text-[11px] font-mono text-slate-700 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(inviteSuccess.invitationUrl, 'modal-copy')}
                  className="px-3 py-1 rounded-lg bg-teal-600 text-white font-bold text-xs shrink-0 flex items-center gap-1"
                >
                  {copiedId === 'modal-copy' ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'modal-copy' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Employee Email Address *
            </label>
            <input
              type="email"
              required
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="e.g. employee@acme-corp.com or work@organization.org"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Any valid work or corporate email address. Fixed domain restriction removed.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role / Department Notes
              </label>
              <input
                type="text"
                value={inviteForm.notes}
                onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                placeholder="e.g. Express Teller, Desk 2"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Suggested Employee ID (Optional)
              </label>
              <input
                type="text"
                value={inviteForm.suggestedEmployeeId}
                onChange={(e) =>
                  setInviteForm({
                    ...inviteForm,
                    suggestedEmployeeId: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g. STF-8092"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invitation Expiry Window
            </label>
            <select
              value={inviteForm.expiryHours}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, expiryHours: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value={24}>24 Hours (Urgent)</option>
              <option value={48}>48 Hours (Standard)</option>
              <option value={168}>7 Days (Extended)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setInviteModalOpen(false);
                setInviteSuccess(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={inviteSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-teal-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{inviteSubmitting ? 'Generating...' : 'Dispatch Invitation'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
