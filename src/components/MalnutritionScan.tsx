import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { analyzeMUACImage, MUACResult } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle2, Info, Scan } from 'lucide-react';

export default function MalnutritionScan({ user }: { user: User }) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MUACResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Remove data:image/jpeg;base64, prefix
      const base64 = image.split(',')[1];
      const analysis = await analyzeMUACImage(base64);
      setResult(analysis);
    } catch (error) {
      console.error("Scan failed", error);
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
          <Scan className="text-emerald-600" />
          MUAC Malnutrition Scan
        </h2>

        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-video rounded-3xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
              image ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-200 bg-emerald-50 hover:border-emerald-400'
            }`}
          >
            {image ? (
              <img src={image} alt="MUAC Scan" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera size={48} className="text-emerald-300 mb-4" />
                <p className="text-emerald-700 font-semibold">Tap to upload MUAC tape photo</p>
                <p className="text-emerald-500 text-sm">Ensure the tape is clearly visible</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <button 
            onClick={handleScan}
            disabled={loading || !image}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
            Analyze Scan
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 bg-white rounded-3xl p-6 shadow-2xl border-2 border-emerald-500"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-emerald-900">Scan Analysis</h3>
              <div className={`px-4 py-1 rounded-full font-bold text-white flex items-center gap-2 ${
                result.riskLevel === 'RED' ? 'bg-red-500' : 
                result.riskLevel === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}>
                {result.riskLevel === 'RED' && <AlertTriangle size={18} />}
                {result.riskLevel === 'GREEN' && <CheckCircle2 size={18} />}
                {result.riskLevel} RISK
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Measurement</p>
                <p className="text-2xl font-black text-emerald-900">{result.measurementCm} <span className="text-lg font-normal">cm</span></p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Status</p>
                <p className="text-lg font-bold text-emerald-900">
                  {result.riskLevel === 'RED' ? 'Severe Malnutrition' : 
                   result.riskLevel === 'YELLOW' ? 'Moderate Risk' : 'Healthy'}
                </p>
              </div>
            </div>

            <div className="bg-emerald-900 text-white p-6 rounded-2xl flex gap-4">
              <Info className="text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold mb-1">Recommended Action</p>
                <p className="text-emerald-100 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
