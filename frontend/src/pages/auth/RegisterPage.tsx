import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRegisterEmailMutation } from '@/store/api/authApi';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Email noto\'g\'ri'),
  password: z.string().min(8, 'Kamida 8 belgi'),
  firstName: z.string().min(1, 'Ismingizni kiriting'),
  lastName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [registerEmail, { isLoading }] = useRegisterEmailMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');

  const requirements = [
    { label: 'Kamida 8 belgi', met: password.length >= 8 },
    { label: 'Katta harf (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Kichik harf (a-z)', met: /[a-z]/.test(password) },
    { label: 'Raqam (0-9)', met: /\d/.test(password) },
  ];

  const onSubmit = async (data: FormData) => {
    try {
      await registerEmail(data).unwrap();
      toast.success('Tasdiqlash kodi emailingizga yuborildi!');
      navigate(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-stone-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/60 border border-stone-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-5">
              <UserPlus className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Yangi akkount</h1>
            <p className="text-slate-500 mt-1 text-sm">Ro'yxatdan o'ting va xarid boshlang</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ism *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('firstName')}
                    className="w-full pl-10 pr-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
                    placeholder="Ism"
                  />
                </div>
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Familiya</label>
                <input
                  {...register('lastName')}
                  className="w-full px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
                  placeholder="Familiya"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Parol *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full pl-11 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2.5 space-y-1">
                  {requirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-2 text-xs">
                      {req.met ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-stone-300" />}
                      <span className={req.met ? 'text-slate-700' : 'text-slate-400'}>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                'Ro\'yxatdan o\'tish'
              )}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Allaqachon akkountingiz bor?{' '}
            <Link to="/auth/login" className="text-slate-900 hover:underline font-semibold">Kirish</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}