"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Loader2,
  User as UserIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Navigation
} from "lucide-react";
import Image from "next/image";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  PANEL_CLASS,
  TH_CLASS,
  TD_CLASS,
  LABEL_CLASS,
  INPUT_CLASS,
  HELP_CLASS,
  PAGE_BUTTON_CLASS,
  BADGE_CLASS,
  BADGE_TONES,
  ICON_BUTTON_CLASS,
  ICON_BUTTON_DANGER_CLASS
} from "@/components/admin/adminStyles";
import toast from "react-hot-toast";

// How each role is shown in the table: badge tone, icon and readable label.
const ROLE_BADGES = {
  admin: { tone: BADGE_TONES.brand, Icon: ShieldCheck, label: "Admin" },
  delivery: { tone: BADGE_TONES.warning, Icon: Navigation, label: "Delivery" },
  user: { tone: BADGE_TONES.neutral, Icon: UserIcon, label: "User" },
} as const;

// "12 Mar 2026", or an em dash when the date is missing/invalid (instead of "Invalid Date").
function formatJoinedDate(value: unknown) {
  const date = new Date(value as string);
  if (!value || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: 'warning'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close the create-user dialog on Escape (same rule as the backdrop: not while saving)
  useEffect(() => {
    if (!isCreateModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !createLoading) setIsCreateModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateModalOpen, createLoading]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("User created successfully!");
        setIsCreateModalOpen(false);
        setNewUser({ name: "", email: "", password: "", role: "user" });
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    // Basic logic: rotate roles admin -> user -> delivery -> admin
    let newRole = "user";
    if (currentRole === "user") newRole = "delivery";
    else if (currentRole === "delivery") newRole = "admin";
    else newRole = "user";

    setModalConfig({
      isOpen: true,
      title: "Change User Role",
      message: `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`,
      type: 'warning',
      onConfirm: async () => {
        setActionLoading(userId);
        try {
          const res = await fetch("/api/admin/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId, role: newRole }),
          });
          if (res.ok) {
            toast.success("Role updated!");
            fetchUsers();
          } else {
            const data = await res.json();
            toast.error(data.error || "Failed to update role");
          }
        } catch (error) {
          console.error("Role update error:", error);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleDeleteUser = async (userId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Delete User Account",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      type: 'danger',
      onConfirm: async () => {
        setActionLoading(userId);
        try {
          const res = await fetch(`/api/admin/users?id=${userId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast.success("User deleted");
            fetchUsers();
          } else {
            const data = await res.json();
            toast.error(data.error || "Failed to delete user");
          }
        } catch (error) {
          console.error("Delete error:", error);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Range shown in the pagination footer ("Showing 1–10 of 42")
  const firstShown = filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastShown = Math.min(currentPage * itemsPerPage, filteredUsers.length);

  return (
    <div className="space-y-4">
      {/* Header & toolbar */}
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">User management</h2>
          <p className="text-sm text-slate-500">
            Manage your <span className="tabular-nums">{users.length}</span> registered users, delivery staff and administrators.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <label htmlFor="user-search" className="sr-only">Search users</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
            <input
              id="user-search"
              type="search"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(INPUT_CLASS, "pl-10")}
            />
          </div>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="whitespace-nowrap">
            <Plus size={16} aria-hidden="true" /> Create user
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center" role="status">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
          <span className="sr-only">Loading users…</span>
        </div>
      ) : (
        <div className={cn(PANEL_CLASS, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[860px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className={TH_CLASS}>User</th>
                  <th scope="col" className={TH_CLASS}>Role</th>
                  <th scope="col" className={TH_CLASS}>Email status</th>
                  <th scope="col" className={cn(TH_CLASS, "text-right")}>Wallet</th>
                  <th scope="col" className={TH_CLASS}>Joined</th>
                  <th scope="col" className={cn(TH_CLASS, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                      {searchTerm ? `No users match "${searchTerm}".` : "No users yet."}
                    </td>
                  </tr>
                )}
                {paginatedUsers.map((user) => {
                  const roleBadge = ROLE_BADGES[user.role as keyof typeof ROLE_BADGES] ?? ROLE_BADGES.user;
                  const RoleIcon = roleBadge.Icon;
                  const isBusy = actionLoading === user._id;
                  // Mark the signed-in admin's own row (the API refuses self-demotion and self-delete)
                  const isCurrentUser = !!session?.user?.email && session.user.email === user.email;
                  const displayName = user.name || user.email || "User";

                  return (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                      {/* Avatar + name + email */}
                      <td className={TD_CLASS}>
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0 text-sm font-semibold">
                            {user.image ? (
                              <Image src={user.image} alt="" width={40} height={40} className="object-cover" />
                            ) : (
                              <span aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-medium text-slate-900">
                              <span className="min-w-0 truncate">{user.name}</span>
                              {isCurrentUser && (
                                <span className={cn(BADGE_CLASS, BADGE_TONES.neutral, "px-2")}>You</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className={TD_CLASS}>
                        <span className={cn(BADGE_CLASS, roleBadge.tone)}>
                          <RoleIcon size={12} aria-hidden="true" />
                          {roleBadge.label}
                        </span>
                      </td>

                      <td className={TD_CLASS}>
                        {user.isVerified ? (
                          <span className={cn(BADGE_CLASS, BADGE_TONES.success)}>
                            <Check size={12} strokeWidth={3} aria-hidden="true" /> Verified
                          </span>
                        ) : (
                          <span className={cn(BADGE_CLASS, BADGE_TONES.neutral)}>Unverified</span>
                        )}
                      </td>

                      <td className={cn(TD_CLASS, "text-right font-medium text-slate-900 tabular-nums")}>
                        ৳{(Number(user.walletBalance) || 0).toLocaleString()}
                      </td>

                      <td className={cn(TD_CLASS, "text-slate-600 tabular-nums whitespace-nowrap")}>
                        {formatJoinedDate(user.createdAt)}
                      </td>

                      <td className={cn(TD_CLASS, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRoleChange(user._id, user.role)}
                            aria-label={`Change role for ${displayName}`}
                            title="Change role"
                            className={cn(ICON_BUTTON_CLASS, "disabled:opacity-50 disabled:cursor-not-allowed")}
                          >
                            {isBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Shield size={16} aria-hidden="true" />}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDeleteUser(user._id)}
                            aria-label={`Delete ${displayName}`}
                            title="Delete user"
                            className={cn(ICON_BUTTON_DANGER_CLASS, "disabled:opacity-50 disabled:cursor-not-allowed")}
                          >
                            {isBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <nav
            aria-label="Users pagination"
            className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900 tabular-nums">{firstShown}</span>–<span className="font-semibold text-slate-900 tabular-nums">{lastShown}</span> of <span className="font-semibold text-slate-900 tabular-nums">{filteredUsers.length}</span> users
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                aria-label="Previous page"
                className={cn(PAGE_BUTTON_CLASS, "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  type="button"
                  key={i+1}
                  onClick={() => setCurrentPage(i+1)}
                  aria-label={`Page ${i+1}`}
                  aria-current={currentPage === i+1 ? "page" : undefined}
                  className={cn(
                    PAGE_BUTTON_CLASS,
                    currentPage === i+1
                      ? "bg-brand-600 text-white"
                      : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {i+1}
                </button>
              )).slice(Math.max(0, currentPage-3), Math.min(totalPages, currentPage+2))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                aria-label="Next page"
                className={cn(PAGE_BUTTON_CLASS, "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !createLoading && setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-user-title"
              aria-describedby="create-user-description"
              className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="px-5 py-3 border-b border-slate-200 flex items-start justify-between gap-4">
                <div>
                  <h2 id="create-user-title" className="text-base font-semibold text-slate-900">Create new user</h2>
                  <p id="create-user-description" className="text-sm text-slate-500 mt-0.5">The account is created already verified.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  aria-label="Close"
                  className={cn(ICON_BUTTON_CLASS, "-mr-2 -mt-1 flex-shrink-0")}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <label htmlFor="new-user-name" className={LABEL_CLASS}>Full name</label>
                    <input
                      id="new-user-name"
                      required
                      type="text"
                      autoComplete="off"
                      placeholder="e.g. Rahim Uddin"
                      className={INPUT_CLASS}
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-user-email" className={LABEL_CLASS}>Email address</label>
                    <input
                      id="new-user-email"
                      required
                      type="email"
                      autoComplete="off"
                      placeholder="name@example.com"
                      className={INPUT_CLASS}
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-user-password" className={LABEL_CLASS}>Initial password</label>
                    <input
                      id="new-user-password"
                      required
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      aria-describedby="new-user-password-help"
                      className={INPUT_CLASS}
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                    <p id="new-user-password-help" className={HELP_CLASS}>At least 8 characters. Share it with the user securely.</p>
                  </div>
                  <div>
                    <label htmlFor="new-user-role" className={LABEL_CLASS}>Role</label>
                    <select
                      id="new-user-role"
                      className={cn(INPUT_CLASS, "cursor-pointer")}
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="user">User (customer)</option>
                      <option value="delivery">Delivery (rider)</option>
                      <option value="admin">Admin (full access)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3">
                  <Button variant="secondary" size="sm" disabled={createLoading} onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" loading={createLoading}>Create account</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({...modalConfig, isOpen: false})}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.type === 'danger' ? "Delete Account" : "Confirm"}
      />
    </div>
  );
}
