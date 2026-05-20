import { useSearchParams } from "react-router-dom";
import {
  useGetAdminUsersQuery,
  useAssignRoleMutation,
  useRemoveRoleMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
} from "@/store/api/adminApi";
import toast from "react-hot-toast";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Users,
  Shield,
  ShieldOff,
  ChevronDown,
  Mail,
  Phone,
  Search,
  UserCheck,
  UserX,
  Plus,
  X,
} from "lucide-react";

const ROLES = ["admin", "seller", "buyer", "delivery"];

export function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role") ?? "";

  const { data, isLoading } = useGetAdminUsersQuery({
    page,
    limit: 20,
    ...(search && { search }),
    ...(role && { role }),
  });
  const [assignRole] = useAssignRoleMutation();
  const [removeRole] = useRemoveRoleMutation();
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const users = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams(searchParams);
    if (searchInput) p.set("search", searchInput);
    else p.delete("search");
    p.set("page", "1");
    setSearchParams(p);
  };

  const handleAssignRole = async (userId: string, roleName: string) => {
    try {
      await assignRole({ userId, role: roleName }).unwrap();
      toast.success(`${roleName} roli berildi`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  const handleRemoveRole = async (userId: string, roleName: string) => {
    try {
      await removeRole({ userId, role: roleName }).unwrap();
      toast.success(`${roleName} roli olib tashlandi`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateUser(userId).unwrap();
        toast.success("Foydalanuvchi bloklandi");
      } else {
        await activateUser(userId).unwrap();
        toast.success("Foydalanuvchi faollashtirildi");
      }
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">
        Foydalanuvchilar
      </h1>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ism, email yoki telefon..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </form>
        <select
          value={role}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value) p.set("role", e.target.value);
            else p.delete("role");
            p.set("page", "1");
            setSearchParams(p);
          }}
          className="px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">Barcha rollar</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Jami: <span className="font-semibold text-slate-900">{meta.total}</span>
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => {
            const isExpanded = expandedId === u.id;
            return (
              <div
                key={u.id}
                className="bg-white border border-stone-100 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                    {u.firstName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {u.firstName} {u.lastName}
                      {!u.isActive && (
                        <span className="ml-2 text-[10px] text-red-600 font-semibold">
                          (Bloklangan)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      {u.email && (
                        <span className="flex items-center gap-1 truncate max-w-[160px] sm:max-w-none">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </span>
                      )}
                      {u.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {u.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5">
                      {u.roles?.map((r: string) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 bg-stone-100 text-slate-600 text-[10px] font-semibold rounded uppercase"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-stone-100 pt-4">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="text-xs text-slate-500 mr-2">
                            Rollar:
                          </span>
                          {u.roles?.map((r: string) => (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg"
                            >
                              {r}
                              <button
                                onClick={() => handleRemoveRole(u.id, r)}
                                className="hover:text-red-300 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {ROLES.filter((r) => !u.roles?.includes(r)).map(
                            (r) => (
                              <button
                                key={r}
                                onClick={() => handleAssignRole(u.id, r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-stone-200 transition-colors"
                              >
                                <Plus className="w-3 h-3" /> {r}
                              </button>
                            ),
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                          <span>ID: {u.id.slice(0, 8)}...</span>
                          <span>
                            {u.isVerified
                              ? "✓ Tasdiqlangan"
                              : "✗ Tasdiqlanmagan"}
                          </span>
                          <span>
                            Ro'yxatdan:{" "}
                            {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                          </span>
                        </div>

                        <button
                          onClick={() => handleToggleActive(u.id, u.isActive)}
                          className={`px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors ${
                            u.isActive
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <UserX className="w-4 h-4" /> Bloklash
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4" /> Faollashtirish
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", String(p));
                setSearchParams(params);
              }}
              className={`w-10 h-10 rounded-xl text-sm font-medium ${p === meta.page ? "bg-slate-900 text-white" : "bg-white border border-stone-200 text-slate-600 hover:bg-stone-50"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
