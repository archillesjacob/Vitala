import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, limit, Timestamp, where, addDoc } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Activity, Map, Users, Clock, Bell, ShieldAlert } from 'lucide-react';

interface Diagnosis {
  id: string;
  patientSummary: string;
  symptoms: string[];
  suspectedCondition: string;
  urgency: string;
  district: string;
  timestamp: any;
  chvEmail: string;
}

interface Alert {
  id: string;
  district: string;
  condition: string;
  caseCount: number;
  timestamp: any;
}

export default function Dashboard() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [outbreakAlert, setOutbreakAlert] = useState<Alert | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'diagnoses'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Diagnosis));
      setDiagnoses(data);
      checkForOutbreaks(data);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      setAlerts(data);
    });
    return unsubscribe;
  }, []);

  const checkForOutbreaks = (data: Diagnosis[]) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const recentCases = data.filter(d => d.timestamp.toMillis() > oneDayAgo);
    
    // Group by district and condition
    const clusters: Record<string, number> = {};
    recentCases.forEach(d => {
      const key = `${d.district}|${d.suspectedCondition}`;
      clusters[key] = (clusters[key] || 0) + 1;
    });

    for (const [key, count] of Object.entries(clusters)) {
      if (count >= 3) {
        const [district, condition] = key.split('|');
        setOutbreakAlert({
          id: 'temp',
          district,
          condition,
          caseCount: count,
          timestamp: Timestamp.now()
        });
        return;
      }
    }
    setOutbreakAlert(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Ministry Outbreak Dashboard</h1>
          <p className="text-emerald-600">Real-time surveillance of rural health districts</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full text-emerald-800 font-bold">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live Updates
        </div>
      </div>

      <AnimatePresence>
        {outbreakAlert && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-red-600 text-white p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center gap-6 border-4 border-red-400 animate-pulse"
          >
            <ShieldAlert size={64} className="shrink-0" />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Outbreak Alert Detected!</h2>
              <p className="text-red-100 text-lg">
                A cluster of <span className="font-bold text-white">{outbreakAlert.caseCount} {outbreakAlert.condition} cases</span> has been detected in <span className="font-bold text-white">{outbreakAlert.district}</span> within the last 24 hours.
              </p>
            </div>
            <button className="bg-white text-red-600 px-8 py-3 rounded-2xl font-bold hover:bg-red-50 transition-colors">
              Dispatch Rapid Response
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-emerald-100">
          <div className="flex items-center gap-3 text-emerald-600 mb-4">
            <Users size={20} />
            <h3 className="font-bold">Total Cases (24h)</h3>
          </div>
          <p className="text-4xl font-black text-emerald-900">{diagnoses.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-emerald-100">
          <div className="flex items-center gap-3 text-emerald-600 mb-4">
            <Map size={20} />
            <h3 className="font-bold">Active Districts</h3>
          </div>
          <p className="text-4xl font-black text-emerald-900">3</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-emerald-100">
          <div className="flex items-center gap-3 text-emerald-600 mb-4">
            <AlertCircle size={20} />
            <h3 className="font-bold">High Urgency</h3>
          </div>
          <p className="text-4xl font-black text-red-600">
            {diagnoses.filter(d => d.urgency === 'HIGH').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
        <div className="p-6 border-b border-emerald-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <Clock className="text-emerald-600" />
            Recent Diagnoses
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-emerald-50 text-emerald-700 text-sm font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">District</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4">Urgency</th>
                <th className="px-6 py-4">CHV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {diagnoses.map((d) => (
                <tr key={d.id} className="hover:bg-emerald-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-emerald-600">
                    {d.timestamp.toDate().toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-900">{d.district}</td>
                  <td className="px-6 py-4 text-emerald-800">{d.suspectedCondition}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      d.urgency === 'HIGH' ? 'bg-red-100 text-red-700' : 
                      d.urgency === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {d.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-500">{d.chvEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
