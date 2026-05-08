import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <h1 className="text-8xl font-black text-slate-200 mb-4">404</h1>
        <p className="text-xl text-slate-500 mb-8">Sahifa topilmadi</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all"
        >
          <Home className="w-4 h-4" /> Bosh sahifaga
        </Link>
      </motion.div>
    </div>
  );
}