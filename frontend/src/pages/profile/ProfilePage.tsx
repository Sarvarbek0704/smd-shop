import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from '@/store/store';
import { selectCurrentUser, setCredentials } from '@/store/slices/authSlice';
import { apiSlice } from '@/store/api/apiSlice';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Shield,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Ismingizni kiriting'),
  lastName: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Joriy parolni kiriting'),
  newPassword: z
    .string()
    .min(8, 'Kamida 8 belgi')
    .regex(/[A-Z]/, 'Katta harf kerak')
    .regex(/[a-z]/, 'Kichik harf kerak')
    .regex(/\d/, 'Raqam kerak'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Parollar mos kelmaydi',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Profil</span>
      </div>

      {/* User card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-amber-400 text-2xl font-bold shrink-0">
          {user?.firstName?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{user?.firstName} {user?.lastName}</h1>
          <div className="flex items-center gap-3 mt-1">
            {user?.email && <span className="text-sm text-slate-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>}
            {user?.phone && <span className="text-sm text-slate-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {user?.roles?.map((role: string) => (
              <span key={role} className="px-2 py-0.5 bg-stone-100 text-slate-600 text-[11px] font-semibold rounded-md uppercase">{role}</span>
            ))}
            {user?.isVerified && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                <Shield className="w-3 h-3" /> Tasdiqlangan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'profile' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-stone-100'
          }`}
        >
          <User className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Ma'lumotlar
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'password' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-stone-100'
          }`}
        >
          <Lock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Parol
        </button>
      </div>

      {activeTab === 'profile' ? (
        <ProfileTab user={user} dispatch={dispatch} />
      ) : (
        <PasswordTab />
      )}
    </div>
  );
}

function ProfileTab({ user, dispatch }: { user: any; dispatch: any }) {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth') ?? '{}').accessToken}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        dispatch(setCredentials({
          user: { ...user, firstName: data.firstName, lastName: data.lastName ?? null },
        }));
        toast.success('Profil yangilandi');
      } else {
        toast.error(result.message ?? 'Xatolik');
      }
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-stone-200 rounded-2xl p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Ism *</label>
            <input
              {...register('firstName')}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Familiya</label>
            <input
              {...register('lastName')}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full px-3 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
          <input
            value={user?.phone ?? 'Qo\'shilmagan'}
            disabled
            className="w-full px-3 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
          />
        </div>

        <motion.button
          type="submit"
          disabled={saving}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Saqlash
        </motion.button>
      </form>
    </motion.div>
  );
}

function PasswordTab() {
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordForm) => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth') ?? '{}').accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (res.status === 204 || res.ok) {
        toast.success('Parol o\'zgartirildi. Qayta kiring.');
        reset();
      } else {
        const result = await res.json();
        toast.error(result.message ?? 'Xatolik');
      }
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-stone-200 rounded-2xl p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Joriy parol *</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showCurrent ? 'text' : 'password'}
              {...register('currentPassword')}
              className="w-full pl-11 pr-12 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Yangi parol *</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showNew ? 'text' : 'password'}
              {...register('newPassword')}
              className="w-full pl-11 pr-12 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Yangi parolni tasdiqlang *</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showNew ? 'text' : 'password'}
              {...register('confirmPassword')}
              className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <motion.button
          type="submit"
          disabled={saving}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Parolni o'zgartirish
        </motion.button>
      </form>
    </motion.div>
  );
}