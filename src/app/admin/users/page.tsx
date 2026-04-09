"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users as UsersIcon, 
  Search, 
  Mail, 
  Shield, 
  ShieldCheck, 
  Trash2, 
  MoreVertical, 
  Loader2, 
  User as UserIcon,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Navigation
} from "lucide-react";
import Image from "next/image";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
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

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500 font-medium">Manage your {users.length} registered users and system administrators.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 max-w-2xl justify-end">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 whitespace-nowrap"
            >
              <Plus size={16} /> Create User
            </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined Date</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic-none">
                {paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden flex-shrink-0">
                          {user.image ? (
                            <Image src={user.image} alt={user.name} width={40} height={40} className="object-cover" />
                          ) : (
                            <UserIcon size={20} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {user._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium truncate">
                          <Mail size={12} className="text-slate-400" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.isVerified && (
                           <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                             <Check size={10} strokeWidth={3} /> Verified Email
                           </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-black ring-1 ring-amber-200 shadow-sm shadow-amber-900/5">
                          <ShieldCheck size={14} className="text-amber-500" />
                          ADMIN
                        </span>
                      ) : user.role === 'delivery' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-black ring-1 ring-teal-200 shadow-sm shadow-teal-900/5">
                          <Navigation size={14} className="text-teal-500" />
                          DELIVERY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold ring-1 ring-slate-200">
                           <UserIcon size={14} className="text-slate-400" />
                           USER
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          disabled={actionLoading === user._id}
                          onClick={() => handleRoleChange(user._id, user.role)}
                          title="Change Role"
                          className="p-2 hover:bg-amber-50 hover:text-amber-600 text-slate-400 rounded-lg transition-all"
                        >
                          {actionLoading === user._id ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                        </button>
                        <button 
                          disabled={actionLoading === user._id}
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-all"
                        >
                          {actionLoading === user._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">
              Showing <span className="text-slate-700">{(currentPage-1)*itemsPerPage + 1}</span> to <span className="text-slate-700">{Math.min(currentPage*itemsPerPage, filteredUsers.length)}</span> of <span className="text-slate-700">{filteredUsers.length}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={16} /></button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i+1 ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'bg-white border border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-600'}`}>{i+1}</button>
                )).slice(Math.max(0, currentPage-3), Math.min(totalPages, currentPage+2))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={16} /></button>
            </div>
          </div>
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Create New User</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Account Setup</p>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="John Doe"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    required
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                  <select 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-2 focus:ring-teal-500 outline-none transition-all cursor-pointer"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">USER (Customer)</option>
                    <option value="delivery">DELIVERY (Specialist)</option>
                    <option value="admin">ADMIN (System Owner)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={createLoading}
                    type="submit"
                    className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-50 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {createLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Verify & Create Account"}
                  </button>
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
