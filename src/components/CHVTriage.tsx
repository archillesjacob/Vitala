import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { db, collection, addDoc, Timestamp } from '../firebase';
import { analyzeSymptoms, TriageResult } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Send, AlertCircle, CheckCircle, Loader2, MapPin, PlusCircle } from 'lucide-react';

export default function CHVTriage({ user }: { user: User }) {
  const [input, setInput] = useState('');
  const [district, setDistrict] = useState('District A');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [saved, setSaved] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const analysis = await analyzeSymptoms(input);
      setResult(analysis);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'diagnoses'), {
        patientSummary: input,
        symptoms: result.symptoms,
        suspectedCondition: result.suspectedCondition,
        urgency: result.urgency,
        district: district,
        timestamp: Timestamp.now(),
        chvId: user.uid,
        chvEmail: user.email
      });
      setSaved(true);
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100"
      >
        <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          <PlusCircle className="text-emerald-600" />
          New Patient Diagnosis
        </h2>

        <form onSubmit={handleAnalyze} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-emerald-700 mb-2">Select District</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
              <select 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
              >
                <option>District A</option>
                <option>District B</option>
                <option>District C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-700 mb-2">Describe Symptoms</label>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Child has high fever, fast breathing, and is very weak..."
              className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[150px] resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            Analyze with Gemini
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 bg-white rounded-3xl p-6 shadow-2xl border-2 border-emerald-500 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl font-bold text-white ${
              result.urgency === 'HIGH' ? 'bg-red-500' : 
              result.urgency === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}>
              {result.urgency} URGENCY
            </div>

            <h3 className="text-xl font-bold text-emerald-900 mb-4">AI Triage Result</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-emerald-600 mt-1 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Suspected Condition</p>
                  <p className="text-lg font-bold text-emerald-900">{result.suspectedCondition}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-700 mb-2">Extracted Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {result.symptoms.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-sm font-semibold text-emerald-700 mb-1">Recommended Action</p>
                <p className="text-emerald-900 font-medium leading-relaxed">{result.recommendedAction}</p>
              </div>

              {!saved ? (
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                  Log Case to Ministry
                </button>
              ) : (
                <div className="bg-emerald-100 text-emerald-800 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold">
                  <CheckCircle />
                  Case Logged Successfully
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
