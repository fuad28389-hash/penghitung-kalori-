/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { 
  Calculator, 
  Leaf, 
  Camera, 
  Search, 
  User, 
  Activity, 
  Scale, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  Upload,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeFood, type NutritionData } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';

interface TDEEResult {
  bmr: number;
  tdee: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'tdee' | 'food'>('tdee');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <Leaf className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-display text-neutral-800">NutriCalc <span className="text-primary-600">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full">
            <button 
              onClick={() => setActiveTab('tdee')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                activeTab === 'tdee' ? "bg-white text-primary-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              Kebutuhan Kalori
            </button>
            <button 
              onClick={() => setActiveTab('food')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                activeTab === 'food' ? "bg-white text-primary-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              Cek Makanan
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'tdee' ? (
            <TDEEForm key="tdee-tab" />
          ) : (
            <FoodAnalyzer key="food-tab" />
          )}
        </AnimatePresence>
      </main>

      <footer className="py-8 border-t border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center text-neutral-500 text-sm">
          <p>© 2024 NutriCalc AI • Asisten Kesehatan Digital Anda</p>
          <p className="mt-1">Ditenagai oleh AI untuk informasi nutrisi yang lebih cerdas.</p>
        </div>
      </footer>
    </div>
  );
}

function TDEEForm() {
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [activity, setActivity] = useState<ActivityLevel>('sedentary');
  const [result, setResult] = useState<TDEEResult | null>(null);

  const calculateTDEE = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    if (!w || !h || !a) return;

    // Mifflin-St Jeor Formula
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const multipliers: Record<ActivityLevel, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extra: 1.9
    };

    const tdee = bmr * multipliers[activity];
    setResult({ bmr: Math.round(bmr), tdee: Math.round(tdee) });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid lg:grid-cols-2 gap-8"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-neutral-800">Hitung Kebutuhan Kalori Harian</h2>
          <p className="text-neutral-500">Gunakan rumus Mifflin-St Jeor untuk mengetahui energi yang Anda butuhkan berdasarkan profil fisik dan aktivitas.</p>
        </div>

        <form onSubmit={calculateTDEE} className="glass-card p-6 rounded-2xl space-y-5">
          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" /> Jenis Kelamin
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={cn(
                    "py-2.5 px-4 rounded-xl text-sm font-medium border transition-all duration-200",
                    gender === g 
                      ? "bg-primary-50 border-primary-500 text-primary-700 shadow-sm" 
                      : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                  )}
                >
                  {g === 'male' ? 'Laki-laki' : 'Perempuan'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Usia (Tahun)</label>
              <input 
                type="number" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                placeholder="25"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Berat (kg)</label>
              <input 
                type="number" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                placeholder="70"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Tinggi (cm)</label>
              <input 
                type="number" 
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
                placeholder="170"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-500" /> Tingkat Aktivitas
            </label>
            <select 
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium bg-white"
            >
              <option value="sedentary">Sedentary (Jarang olahraga)</option>
              <option value="light">Lightly Active (Olahraga 1-3x/minggu)</option>
              <option value="moderate">Moderately Active (Olahraga 3-5x/minggu)</option>
              <option value="active">Active (Olahraga 6-7x/minggu)</option>
              <option value="extra">Extra Active (Sangat aktif/atlet)</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            Hitung Sekarang <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card rounded-3xl p-8 sticky top-24 space-y-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Calculator className="w-32 h-32" />
              </div>

              <div className="space-y-1">
                <p className="text-primary-600 font-bold uppercase tracking-wider text-xs">Hasil Kalkulasi</p>
                <h3 className="text-2xl font-bold text-neutral-800">Ringkasan Energi Anda</h3>
              </div>

              <div className="grid gap-6">
                <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100 space-y-1">
                  <p className="text-sm font-medium text-primary-700">TDEE (Daily Calories)</p>
                  <p className="text-4xl font-black text-primary-700">{result.tdee} <span className="text-lg font-normal">kkal/hari</span></p>
                  <p className="text-xs text-primary-600/80 pt-2 italic">*Estimasi energi untuk menjaga berat badan saat ini.</p>
                </div>

                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-neutral-500 uppercase">Basal Metabolic Rate</p>
                    <p className="text-xl font-bold text-neutral-700">{result.bmr} <span className="text-sm font-normal">kkal</span></p>
                  </div>
                  <Info className="w-5 h-5 text-neutral-300" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <h4 className="font-bold text-neutral-800 text-sm">Saran Target Terkait Kalori</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-neutral-100 rounded-xl">
                    <p className="text-xs text-neutral-500 font-medium">Menurunkan BB</p>
                    <p className="font-bold text-neutral-700">{Math.round(result.tdee * 0.85)} kkal</p>
                  </div>
                  <div className="p-3 bg-white border border-neutral-100 rounded-xl">
                    <p className="text-xs text-neutral-500 font-medium">Menaikkan BB</p>
                    <p className="font-bold text-neutral-700">{Math.round(result.tdee * 1.15)} kkal</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-neutral-100/50 rounded-3xl border-2 border-dashed border-neutral-200 border-spacing-4"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-neutral-300">
                <Scale className="w-8 h-8" />
              </div>
              <p className="text-neutral-500 font-medium">Isi formulir di samping untuk melihat hasil kalkulasi nutrisi Anda.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function FoodAnalyzer() {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setNutrition(null);
    try {
      const result = await analyzeFood(inputText);
      setNutrition(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      setImagePreview(event.target?.result as string);
      
      setIsAnalyzing(true);
      setNutrition(null);
      try {
        const result = await analyzeFood({
          data: base64Data,
          mimeType: file.type
        });
        setNutrition(result);
      } catch (error) {
        console.error(error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black text-neutral-800 tracking-tight">Analisis Nutrisi Makanan</h2>
        <p className="text-neutral-500 max-w-lg mx-auto italic">Tanyakan detail nutrisi sebutkan jenisnya atau unggah foto piring Anda.</p>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Contoh: 1 piring nasi goreng Ayam Telur"
              className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium border border-neutral-100"
            />
          </div>
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square p-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition-all"
              title="Unggah Foto"
            >
              <Camera className="w-6 h-6" />
            </button>
            <button 
              onClick={handleTextSubmit}
              disabled={isAnalyzing || !inputText.trim()}
              className="flex-grow sm:flex-none px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 text-white rounded-xl font-bold shadow-lg shadow-primary-600/20 transition-all cursor-pointer"
            >
              Analisis
            </button>
          </div>
        </div>

        {nutrition && (
          <div className="flex justify-end">
            <button 
              onClick={() => {
                setNutrition(null);
                setImagePreview(null);
                setInputText('');
              }}
              className="text-xs font-semibold text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1"
            >
              Hapus Hasil
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-3xl border border-neutral-100">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <p className="text-neutral-500 font-medium animate-pulse text-sm">NutriCalc AI sedang menghitung nutrisi...</p>
          </div>
        )}

        <AnimatePresence>
          {nutrition && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-8">
                  {imagePreview && (
                    <div className="w-full md:w-64 h-64 shrink-0 rounded-2xl overflow-hidden shadow-lg ring-1 ring-neutral-200">
                      <img src={imagePreview} alt="Pratinjau Makanan" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="flex-grow space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-wide uppercase">
                        <CheckCircle2 className="w-4 h-4" /> Terverifikasi AI
                      </div>
                      <h3 className="text-3xl font-black text-neutral-800">{nutrition.name}</h3>
                      <p className="text-neutral-500 text-sm font-medium">Berdasarkan porsi: <span className="text-neutral-700">{nutrition.servingSize}</span></p>
                    </div>

                    <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-center justify-between">
                      <p className="font-bold text-primary-900">Total Energi</p>
                      <p className="text-3xl font-black text-primary-700">{nutrition.calories} <span className="text-base font-normal">kkal</span></p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden border border-neutral-100 rounded-2xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 text-neutral-500 uppercase text-[10px] font-black tracking-widest border-b border-neutral-100">
                      <tr>
                        <th className="px-6 py-3">Makronutrisi</th>
                        <th className="px-6 py-3 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      <tr>
                        <td className="px-6 py-4 font-medium text-neutral-700 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" /> Protein
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-neutral-900">{nutrition.protein} g</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-medium text-neutral-700 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" /> Lemak
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-neutral-900">{nutrition.fat} g</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-medium text-neutral-700 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" /> Karbohidrat
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-neutral-900">{nutrition.carbs} g</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-neutral-800">
                    <Info className="w-5 h-5 text-primary-500" /> Saran Ahli Diet
                  </div>
                  <p className="text-neutral-600 leading-relaxed italic">"{nutrition.suggestion}"</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
