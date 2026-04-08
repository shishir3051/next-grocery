"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Check
} from "lucide-react";
import Image from "next/image";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    
    setModalConfig({
      isOpen: true,
      title: "Change User Role",
      message: `Are you sure you want to change this user's role to ${newRole}?`,
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
            fetchUsers();
          } else {
            const data = await res.json();
            alert(data.error || "Failed to update role");
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
            fetchUsers();
          } else {
            const data = await res.json();
            alert(data.error || "Failed to delete user");
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

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-800">Cusomter Management</h2>
          <p className="text-sm text-slate-500 font-medium">Manage your {users.length} registered users and administrator roles.</p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
          />
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
                {filteredUsers.map((user) => (
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
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {user._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Mail size={12} className="text-slate-400" />
                          {user.email}
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
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          disabled={actionLoading === user._id}
                          onClick={() => handleRoleChange(user._id, user.role)}
                          title={user.role === 'admin' ? "Demote to User" : "Promote to Admin"}
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
        </div>
      )}

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

