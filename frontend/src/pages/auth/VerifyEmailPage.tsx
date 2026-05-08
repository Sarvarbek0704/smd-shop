import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useVerifyEmailMutation, useResendVerificationMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/store';
import { setCredentials } from '@/store/slices/authSlice';
import { ShieldCheck } from 'lucide-react';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [resendCode, { isLoading: resending }] = useResendVerificationMutation();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    const code = newDigits.join('');
    if (code.length === 6) handleVerify(code);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = [...digits];
    for (let i = 0; i < text.length; i++) newDigits[i] = text[i];
    setDigits(newDigits);
    if (text.length === 6) handleVerify(text);
  };

  const handleVerify = async (code: string) => {
    try {
      const result = await verifyEmail({ email, code }).unwrap();
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }));
      toast.success('Email tasdiqlandi!');
      navigate('/');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Noto\'g\'ri kod');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await resendCode({ email }).unwrap();
      toast.success('Yangi kod yuborildi!');
      setCooldown(60);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-stone-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/60 border border-stone-100 p-8 sm:p-10 text-center">
          <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Kodni kiriting</h1>
          <p className="text-slate-500 text-sm mb-8">
            <span className="font-medium text-slate-700">{email}</span> manziliga 6 xonali kod yuborildi
          </p>

          <div className="flex justify-center gap-2.5 mb-8" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold bg-stone-50 border-2 border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
              Tekshirilmoqda...
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-sm text-slate-500 hover:text-slate-900 font-medium disabled:text-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            {cooldown > 0 ? `Qayta yuborish (${cooldown}s)` : resending ? 'Yuborilmoqda...' : 'Kodni qayta yuborish'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}