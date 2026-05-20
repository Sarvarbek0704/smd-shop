import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useGetSimulatorInfoQuery, useProcessSimulationMutation } from '@/store/api/paymentsApi';
import {
  Loader2, Lock, Shield, Check, X, CreditCard,
  Smartphone, Eye, EyeOff, AlertCircle, Wifi, Battery,
  Signal,
} from 'lucide-react';

const PROVIDER_THEMES: Record<string, {
  name: string; logo: string; gradient: string; accent: string; textLight: string;
  keypad: string; cardBg: string; btnGradient: string;
}> = {
  payme: {
    name: 'Payme',
    logo: '💙',
    gradient: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-500',
    textLight: 'text-blue-100',
    keypad: 'bg-blue-700 hover:bg-blue-600 text-white',
    cardBg: 'bg-white/10 backdrop-blur-sm border border-white/20',
    btnGradient: 'from-green-400 to-emerald-500',
  },
  click: {
    name: 'Click',
    logo: '🟢',
    gradient: 'from-emerald-600 to-teal-700',
    accent: 'bg-emerald-500',
    textLight: 'text-emerald-100',
    keypad: 'bg-emerald-700 hover:bg-emerald-600 text-white',
    cardBg: 'bg-white/10 backdrop-blur-sm border border-white/20',
    btnGradient: 'from-green-400 to-emerald-500',
  },
  uzum: {
    name: 'Uzum Bank',
    logo: '💜',
    gradient: 'from-purple-600 to-violet-800',
    accent: 'bg-purple-500',
    textLight: 'text-purple-100',
    keypad: 'bg-purple-700 hover:bg-purple-600 text-white',
    cardBg: 'bg-white/10 backdrop-blur-sm border border-white/20',
    btnGradient: 'from-green-400 to-emerald-500',
  },
};

function PinDot({ filled }: { filled: boolean }) {
  return (
    <motion.div
      animate={{ scale: filled ? 1 : 0.6, opacity: filled ? 1 : 0.4 }}
      className={`w-3.5 h-3.5 rounded-full transition-colors ${filled ? 'bg-white' : 'bg-white/30'}`}
    />
  );
}

export function PaymentSimulator() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const { data: info, isLoading, error } = useGetSimulatorInfoQuery(token ?? '', { skip: !token });
  const [processSimulation, { isLoading: processing }] = useProcessSimulationMutation();

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [stage, setStage] = useState<'card' | 'pin' | 'processing' | 'done' | 'error'>('card');
  const [result, setResult] = useState<'success' | 'cancel' | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cardNumber] = useState(() => {
    const digits = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10));
    return digits.join('').replace(/(.{4})/g, '$1 ').trim();
  });
  const [cardExpiry] = useState(() => {
    const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return `${m}/28`;
  });

  const theme = PROVIDER_THEMES[info?.provider ?? ''] ?? PROVIDER_THEMES.payme;

  useEffect(() => {
    if (!info?.expiresAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(info.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [info?.expiresAt]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleKeypad = (key: string) => {
    if (key === '⌫') { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length < 4) setPin((p) => p + key);
  };

  useEffect(() => {
    if (pin.length === 4) {
      setTimeout(() => setStage('pin'), 0);
    }
  }, [pin]);

  const handleConfirm = async (action: 'pay' | 'cancel') => {
    if (!token) return;
    setStage('processing');
    try {
      await processSimulation({ token, action }).unwrap();
      setResult(action === 'pay' ? 'success' : 'cancel');
      setStage('done');
      setTimeout(() => {
        navigate(orderId ? `/orders/${orderId}` : '/orders', { replace: true });
      }, 2500);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik yuz berdi');
      setStage('error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center text-white px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Token yaroqsiz yoki muddati o'tgan</h2>
        <p className="text-slate-400 text-sm mb-6">To'lov sessiyasi tugagan. Qayta urinib ko'ring.</p>
        <button
          onClick={() => navigate(orderId ? `/payment/${orderId}` : '/orders')}
          className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
        >
          Qaytish
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-center px-4 py-8`}>
      {/* Fake phone status bar */}
      <div className="w-full max-w-sm mb-2 flex justify-between items-center px-1">
        <span className="text-white/60 text-xs font-medium">9:41</span>
        <div className="flex items-center gap-1.5">
          <Signal className="w-3 h-3 text-white/60" />
          <Wifi className="w-3 h-3 text-white/60" />
          <Battery className="w-3.5 h-3.5 text-white/60" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        {/* App header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{theme.logo}</span>
            <div>
              <p className="text-white font-bold text-lg leading-none">{theme.name}</p>
              <p className={`text-xs ${theme.textLight}`}>To'lov tizimi · DEMO</p>
            </div>
          </div>
          {timeLeft > 0 && (
            <div className={`px-2.5 py-1 rounded-lg ${timeLeft < 60 ? 'bg-red-500/30 text-red-200' : 'bg-white/10 text-white/70'} text-xs font-mono font-bold`}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Virtual card */}
        <div className={`${theme.cardBg} rounded-2xl p-5 mb-5`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className={`text-xs ${theme.textLight} mb-0.5`}>Karta raqami</p>
              <p className="text-white font-mono text-sm tracking-widest">{cardNumber}</p>
            </div>
            <CreditCard className="w-8 h-8 text-white/50" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-xs ${theme.textLight} mb-0.5`}>Amal qilish muddati</p>
              <p className="text-white font-mono text-sm">{cardExpiry}</p>
            </div>
            <div className="text-right">
              <p className={`text-xs ${theme.textLight} mb-0.5`}>To'lov miqdori</p>
              <p className="text-white font-bold text-lg">{info.amount.toLocaleString('uz-UZ')} so'm</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* Stage: card entry */}
          {stage === 'card' && (
            <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-white/10 rounded-2xl p-5 mb-4">
                <p className="text-white/70 text-xs mb-3 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> PIN-kodni kiriting
                </p>
                <div className="flex justify-center gap-4 mb-4">
                  {[0, 1, 2, 3].map((i) => (
                    <PinDot key={i} filled={showPin ? false : i < pin.length} />
                  ))}
                </div>
                {showPin && (
                  <p className="text-center text-white font-mono text-xl tracking-[0.3em] mb-4">{pin.padEnd(4, '·')}</p>
                )}
                <button onClick={() => setShowPin(!showPin)} className="flex items-center gap-1.5 text-white/50 text-xs mx-auto mb-4">
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPin ? 'Yashirish' : 'Ko\'rsatish'}
                </button>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2">
                  {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                    k === '' ? <div key={i} /> :
                    <button
                      key={i}
                      onClick={() => handleKeypad(k)}
                      className={`${theme.keypad} h-12 rounded-xl text-lg font-semibold transition-all active:scale-95 flex items-center justify-center`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {pin.length === 4 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
                  <button
                    onClick={() => handleConfirm('pay')}
                    className={`w-full py-4 bg-gradient-to-r ${theme.btnGradient} text-white font-bold text-base rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2`}
                  >
                    <Check className="w-5 h-5" />
                    To'lovni tasdiqlash
                  </button>
                  <button
                    onClick={() => handleConfirm('cancel')}
                    className="w-full py-3 bg-white/10 text-white/70 font-medium text-sm rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Bekor qilish
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Stage: processing */}
          {stage === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <div className="relative mx-auto w-16 h-16 mb-5">
                <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>
              <p className="text-white font-semibold text-lg mb-1">Jarayon...</p>
              <p className="text-white/60 text-sm">Bank bilan aloqa o'rnatilmoqda</p>

              <div className="mt-6 bg-white/10 rounded-xl p-3 space-y-2">
                {['Karta tekshirilmoqda...', 'Balans tekshirilmoqda...', 'Tranzaksiya amalga oshirilmoqda...'].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.6 }}
                    className="flex items-center gap-2 text-xs text-white/70"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stage: done */}
          {stage === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              {result === 'success' ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                    className="w-20 h-20 rounded-full bg-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30"
                  >
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  </motion.div>
                  <p className="text-white font-bold text-2xl mb-2">Muvaffaqiyatli!</p>
                  <p className="text-white/70 text-sm">{info.amount.toLocaleString('uz-UZ')} so'm to'landi</p>
                  <div className="mt-4 bg-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/50">Tranzaksiya ID</p>
                    <p className="text-white font-mono text-xs">SIM-{Date.now().toString(16).toUpperCase()}</p>
                  </div>
                  <p className="text-white/40 text-xs mt-4 flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Buyurtmaga yo'naltirilmoqda...
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                    className="w-20 h-20 rounded-full bg-red-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-500/30"
                  >
                    <X className="w-10 h-10 text-white" strokeWidth={3} />
                  </motion.div>
                  <p className="text-white font-bold text-2xl mb-2">Bekor qilindi</p>
                  <p className="text-white/70 text-sm">To'lov bekor qilindi</p>
                  <p className="text-white/40 text-xs mt-4 flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Yo'naltirilmoqda...
                  </p>
                </>
              )}
            </motion.div>
          )}

          {/* Stage: error */}
          {stage === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
              <p className="text-white font-semibold mb-4">Xatolik yuz berdi</p>
              <button
                onClick={() => navigate(orderId ? `/payment/${orderId}` : '/orders')}
                className="px-6 py-2.5 bg-white text-slate-900 font-semibold rounded-xl"
              >
                Qayta urinish
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-white/40 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>PCI DSS Level 1 xavfsizlik standartlari · 256-bit SSL</span>
        </div>
        <p className="text-center text-white/25 text-[10px] mt-1">DEMO MODE — haqiqiy to'lov amalga oshirilmaydi</p>
      </motion.div>
    </div>
  );
}
