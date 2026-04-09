import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, signInWithGoogle } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Activity, LayoutDashboard, LogOut, Menu, X, PlusCircle, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CHVTriage from './components/CHVTriage';
import MalnutritionScan from './components/MalnutritionScan';
import Dashboard from './components/Dashboard';

function Navigation({ user }: { user: User | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="bg-emerald-900 text-white p-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight">
          <Activity className="text-emerald-400" />
          <span>Vitala</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="hover:text-emerald-300 transition-colors">Triage</Link>
          <Link to="/scan" className="hover:text-emerald-300 transition-colors">MUAC Scan</Link>
          <Link to="/dashboard" className="hover:text-emerald-300 transition-colors">Dashboard</Link>
          <button onClick={handleSignOut} className="flex items-center space-x-1 text-emerald-200 hover:text-white cursor-pointer">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 space-y-4 pb-4"
          >
            <Link to="/" onClick={() => setIsOpen(false)} className="block py-2 border-b border-emerald-800">New Diagnosis</Link>
            <Link to="/scan" onClick={() => setIsOpen(false)} className="block py-2 border-b border-emerald-800">MUAC Scan</Link>
            <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block py-2 border-b border-emerald-800">Ministry Dashboard</Link>
            <button onClick={handleSignOut} className="w-full text-left py-2 text-emerald-200">Sign Out</button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Login() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-emerald-100"
      >
        <Activity size={64} className="text-emerald-600 mb-6 mx-auto" />
        <h1 className="text-4xl font-bold text-emerald-900 mb-4">Vitala</h1>
        <p className="text-emerald-700 mb-8 leading-relaxed">
          Empowering Community Health Volunteers with AI-driven diagnostics and real-time outbreak alerts.
        </p>
        <button 
          onClick={signInWithGoogle}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center space-x-3 cursor-pointer"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-1" />
          <span>Sign in as CHV</span>
        </button>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Activity className="text-emerald-600" size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-emerald-50 font-sans text-emerald-950">
        <Navigation user={user} />
        <main className="max-w-7xl mx-auto px-4 py-8">
          {!user ? (
            <Login />
          ) : (
            <Routes>
              <Route path="/" element={<CHVTriage user={user} />} />
              <Route path="/scan" element={<MalnutritionScan user={user} />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}
