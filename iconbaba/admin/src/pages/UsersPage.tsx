// admin/src/pages/UsersPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { getAdminUsers, updateAdminUserStatus, getMe, getAdminRoles, createAdminRole } from '../lib/api';
import { AdminUserItem, SystemRoleItem } from '../types/admin';

function getRoleBadgeClass(roleSlug: string) {
  switch (roleSlug.toLowerCase()) {
    case 'admin':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'editor':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'moderator':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'contributor':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'designer':
      return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    case 'user':
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700/60';
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);

  // System Roles from DB
  const [systemRoles, setSystemRoles] = useState<SystemRoleItem[]>([]);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Notifications
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal 1: Assign Roles to User
  const [roleModalUser, setRoleModalUser] = useState<AdminUserItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  // Modal 2: Manage / Create System Roles
  const [manageRolesModal, setManageRolesModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleSlug, setNewRoleSlug] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  // Load current admin ID
  useEffect(() => {
    async function fetchMe() {
      const res = await getMe();
      if (res.success && res.data?.user) {
        setCurrentAdminId(res.data.user.id);
      }
    }
    fetchMe();
  }, []);

  // Load System Roles from DB
  const loadRoles = useCallback(async () => {
    try {
      const res = await getAdminRoles();
      if (res.success && res.data?.items) {
        setSystemRoles(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load system roles:', err);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({
        page,
        limit: 20,
        q: search.trim(),
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });

      if (res.success && res.data) {
        setUsers(res.data.items);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleStatusToggle(user: AdminUserItem) {
    if (user.id === currentAdminId) {
      setMsg({ type: 'error', text: 'You cannot suspend your own admin account.' });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await updateAdminUserStatus(user.id, nextStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
        );
        setMsg({ type: 'success', text: `User "${user.username}" status updated to ${nextStatus}.` });
        setTimeout(() => setMsg(null), 3000);
      } else {
        setMsg({ type: 'error', text: res.message || 'Failed to update user status.' });
      }
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error updating user' });
    }
  }

  // Open Role Assignment Modal
  function openRoleModal(user: AdminUserItem) {
    setRoleModalUser(user);
    const existing = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    setSelectedRoles(existing);
  }

  // Toggle role in assignment modal
  function toggleRoleSelection(slug: string) {
    setSelectedRoles((prev) => {
      if (prev.includes(slug)) {
        if (prev.length <= 1) {
          alert('A user must have at least one role assigned.');
          return prev;
        }
        return prev.filter((r) => r !== slug);
      } else {
        return [...prev, slug];
      }
    });
  }

  // Save assigned roles
  async function handleSaveRoles() {
    if (!roleModalUser) return;

    if (roleModalUser.id === currentAdminId && !selectedRoles.includes('admin')) {
      alert('You cannot remove the administrator role from your own active session.');
      return;
    }

    setSavingRoles(true);
    try {
      const nextRole = selectedRoles.includes('admin') ? 'admin' : 'user';
      const res = await updateAdminUserStatus(roleModalUser.id, undefined, nextRole, selectedRoles);

      if (res.success && res.data) {
        const updatedRoles = res.data.roles || selectedRoles;
        const updatedRole = (res.data.role as 'user' | 'admin') || nextRole;

        setUsers((prev) =>
          prev.map((u) =>
            u.id === roleModalUser.id ? { ...u, role: updatedRole, roles: updatedRoles } : u
          )
        );
        setMsg({
          type: 'success',
          text: `Roles for "${roleModalUser.username}" updated: ${updatedRoles.join(', ')}`,
        });
        setTimeout(() => setMsg(null), 3000);
        setRoleModalUser(null);
        loadRoles();
      } else {
        alert(res.message || 'Failed to save roles.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving roles');
    } finally {
      setSavingRoles(false);
    }
  }

  // Create new custom role
  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setCreatingRole(true);
    try {
      const res = await createAdminRole(newRoleName.trim(), newRoleSlug.trim() || undefined, newRoleDesc.trim());
      if (res.success && res.data) {
        setMsg({ type: 'success', text: `New role "${res.data.name}" (${res.data.slug}) created successfully!` });
        setTimeout(() => setMsg(null), 3000);
        setNewRoleName('');
        setNewRoleSlug('');
        setNewRoleDesc('');
        loadRoles();
      } else {
        alert(res.message || 'Failed to create role');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating role');
    } finally {
      setCreatingRole(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor community members, assign multi-roles via relational database, and manage permissions.
          </p>
        </div>
        <button
          onClick={() => setManageRolesModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>Manage System Roles</span>
        </button>
      </div>

      {/* Toast Notification */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          <span>{msg.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search username, email, name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Roles ({systemRoles.length} Available)</option>
            {systemRoles.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.name} ({r.slug})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Assigned Roles</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Favorites</th>
                <th className="py-3 px-4 text-center">Collections</th>
                <th className="py-3 px-4 text-center">Downloads</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((user) => {
                const isSelf = user.id === currentAdminId;
                const userRolesList = user.roles && user.roles.length > 0 ? user.roles : [user.role];

                return (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{user.username}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                                You
                              </span>
                            )}
                          </div>
                          {user.full_name && (
                            <div className="text-xs text-slate-400">{user.full_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-xs">{user.email}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1 max-w-[200px] mx-auto">
                        {userRolesList.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${getRoleBadgeClass(
                              r
                            )}`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-300">
                      {user.favorites_count}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-300">
                      {user.collections_count}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-300">
                      {user.downloads_count}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isSelf && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openRoleModal(user)}
                            className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium rounded-lg border border-purple-500/30 transition-colors"
                            title="Assign or modify roles"
                          >
                            Edit Roles
                          </button>
                          <button
                            onClick={() => handleStatusToggle(user)}
                            className={`px-2 py-1 text-xs font-medium rounded-lg border transition-colors ${
                              user.status === 'active'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No users match the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-semibold">{users.length}</span> of{' '}
            <span className="text-slate-200 font-semibold">{total}</span> users
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Assign Roles */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Assign Multiple Roles</h3>
                <p className="text-xs text-slate-400">User: <span className="text-purple-300 font-semibold">{roleModalUser.username}</span></p>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">Select active roles for this user:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {systemRoles.map((role) => {
                  const isChecked = selectedRoles.includes(role.slug);

                  return (
                    <label
                      key={role.id}
                      onClick={() => toggleRoleSelection(role.slug)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-200'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white capitalize">{role.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {role.slug}
                          </span>
                        </div>
                        {role.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{role.description}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingRoles}
                onClick={handleSaveRoles}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl transition-colors shadow-lg shadow-purple-900/30"
              >
                {savingRoles ? 'Saving...' : 'Save Roles'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Manage & Create System Roles */}
      {manageRolesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">System Roles Management</h3>
                <p className="text-xs text-slate-400">All registered roles in the relational database</p>
              </div>
              <button
                onClick={() => setManageRolesModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* List of existing roles */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Registered Roles:</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {systemRoles.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{r.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {r.slug}
                        </span>
                      </div>
                      {r.description && <p className="text-[11px] text-slate-400 mt-0.5">{r.description}</p>}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {r.users_count} {r.users_count === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form to create new role */}
            <form onSubmit={handleCreateRole} className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Create New Custom Role</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Member"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Role Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. vip_member"
                    value={newRoleSlug}
                    onChange={(e) => setNewRoleSlug(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Permissions and duties of this role..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={creatingRole || !newRoleName.trim()}
                className="w-full py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl transition-colors shadow"
              >
                {creatingRole ? 'Creating Role...' : '+ Add System Role'}
              </button>
            </form>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setManageRolesModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
