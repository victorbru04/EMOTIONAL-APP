/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Camera, 
  Check, 
  CircleCheck, 
  Info,
  TrendingUp,
  Calendar as CalendarIcon,
  LayoutDashboard,
  Plus,
  BarChart2,
  Sparkles,
  User
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type Gender = 'Masculino' | 'Femenino' | 'Neutro' | null;

interface UserData {
  name: string;
  gender: Gender;
  profilePic: string | null;
}

export default function App() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    gender: null,
    profilePic: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData({ ...userData, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const [isRegistering, setIsRegistering] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'Balance' | 'Intensidad' | 'Resumen'>('Balance');
  const [balancePeriod, setBalancePeriod] = useState<'Semana' | 'Mes'>('Semana');
  const [note, setNote] = useState('');

  const emotions = [
    { name: 'GENIAL', x: 75, y: 15, color: '#00f2ff' },
    { name: 'FELIZ', x: 25, y: 25, color: '#70e0ff' },
    { name: 'BIEN', x: 75, y: 40, color: '#a0c4ff' },
    { name: 'REGULAR', x: 20, y: 55, color: '#4a6fa5' },
    { name: 'TRISTE', x: 75, y: 70, color: '#2a4a75' },
    { name: 'FATAL', x: 25, y: 82, color: '#0a2a45' },
  ];

  const [selectedEmotionIndex, setSelectedEmotionIndex] = useState(0);

  const balanceData = {
    Semana: {
      outer: [
        { name: 'BIEN', value: 15, color: '#a0c4ff' },
        { name: 'FELIZ', value: 10, color: '#70e0ff' },
        { name: 'GENIAL', value: 3, color: '#00f2ff' },
        { name: 'FATAL', value: 12, color: '#0a2a45' },
        { name: 'TRISTE', value: 30, color: '#2a4a75' },
        { name: 'REGULAR', value: 30, color: '#4a6fa5' },
      ],
      inner: [
        { name: 'POSITIVAS', value: 28, color: '#00f2ff' },
        { name: 'NEGATIVAS', value: 72, color: '#0a2a45' },
      ],
      stats: { pos: 8, neg: 22, posPct: 28, negPct: 72 }
    },
    Mes: {
      outer: [
        { name: 'BIEN', value: 25, color: '#a0c4ff' },
        { name: 'FELIZ', value: 20, color: '#70e0ff' },
        { name: 'GENIAL', value: 15, color: '#00f2ff' },
        { name: 'FATAL', value: 5, color: '#0a2a45' },
        { name: 'TRISTE', value: 15, color: '#2a4a75' },
        { name: 'REGULAR', value: 20, color: '#4a6fa5' },
      ],
      inner: [
        { name: 'POSITIVAS', value: 60, color: '#00f2ff' },
        { name: 'NEGATIVAS', value: 40, color: '#0a2a45' },
      ],
      stats: { pos: 45, neg: 30, posPct: 60, negPct: 40 }
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isRegistering || showSummary) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const height = window.innerHeight;
    const relativeY = clientY / height;
    
    // Map Y position to emotion index with more generous thresholds
    const index = Math.min(
      emotions.length - 1,
      Math.max(0, Math.floor(relativeY * emotions.length))
    );
    
    if (index !== selectedEmotionIndex) {
      setSelectedEmotionIndex(index);
    }
  };

  const handleSelectEmotion = () => {
    setShowSummary(true);
  };

  const handleSaveEmotion = () => {
    setShowBalance(true);
  };

  const resetFlow = () => {
    setIsRegistering(false);
    setShowSummary(false);
    setShowBalance(false);
    setActiveTab('Balance');
    setNote('');
  };

  const Logo = () => (
    <div className="flex justify-center mb-8">
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 5C25.147 5 5 25.147 5 50C5 74.853 25.147 95 50 95C74.853 95 95 74.853 95 50C95 25.147 74.853 5 50 5ZM50 85C30.67 85 15 69.33 15 50C15 30.67 30.67 15 50 15C69.33 15 85 30.67 85 50C85 69.33 69.33 85 50 85Z" fill="#D4F01D" fillOpacity="0.2"/>
        <g clipPath="url(#clip0)">
          {Array.from({ length: 18 }).map((_, i) => (
            <path
              key={i}
              d={`M50 50C50 50 60 20 80 30C100 40 70 60 50 50Z`}
              fill="#D4F01D"
              transform={`rotate(${i * 20} 50 50)`}
            />
          ))}
        </g>
        <defs>
          <clipPath id="clip0">
            <rect width="100" height="100" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    </div>
  );

  const Pagination = ({ current }: { current: number }) => (
    <div className="flex justify-center gap-2 mb-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? 'w-8 bg-white' : 'w-3 bg-white/40'
          }`}
        />
      ))}
    </div>
  );

  if (isRegistering) {
    return (
      <div 
        className="min-h-screen bg-[#004a99] relative touch-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onClick={(!showSummary && !showBalance) ? handleSelectEmotion : undefined}
      >
        <AnimatePresence mode="wait">
          {!showSummary && !showBalance ? (
            <motion.div
              key="emotion-selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full cursor-pointer"
            >
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.2
                    }
                  }
                }}
                className="absolute inset-0 flex flex-col justify-between py-24 px-12"
              >
                {emotions.map((e, i) => (
                  <motion.div 
                    key={i} 
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className={`text-5xl font-black transition-all duration-300 flex items-center gap-6 ${
                      selectedEmotionIndex === i 
                        ? 'opacity-100 translate-x-4' 
                        : 'opacity-10 translate-x-0'
                    }`}
                    style={{ 
                      color: selectedEmotionIndex === i ? e.color : 'white',
                      textShadow: selectedEmotionIndex === i ? `0 0 30px ${e.color}66` : 'none'
                    }}
                  >
                    {e.name}
                    {selectedEmotionIndex === i && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="w-4 h-4 rounded-full shadow-lg"
                        style={{ 
                          backgroundColor: e.color,
                          boxShadow: `0 0 20px ${e.color}`
                        }}
                      />
                    )}
                  </motion.div>
                ))}
              </motion.div>

              <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
                <h2 className="text-white text-2xl font-bold">¿Cómo te sientes hoy?</h2>
              </div>
            </motion.div>
          ) : showSummary && !showBalance ? (
            <motion.div
              key="monthly-summary"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="min-h-screen w-full flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex justify-center mb-8">
                <div className="bg-[#D4F01D] px-6 py-2 rounded-full">
                  <span className="text-[#004a99] font-bold text-xl">Noviembre</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.02
                    }
                  }
                }}
                className="grid grid-cols-7 gap-y-6 gap-x-2 mb-8"
              >
                {/* Empty spaces for start of month alignment if needed */}
                <div className="col-span-5"></div> 
                {Array.from({ length: 30 }).map((_, i) => {
                  const day = i + 1;
                  // Mock some emotion colors for the calendar
                  const mockColors = [
                    '#70e0ff', '#00f2ff', '#70e0ff', '#a0c4ff', '#4a6fa5', '#00f2ff', 
                    '#4a6fa5', '#0a2a45', '#a0c4ff', '#70e0ff', '#a0c4ff', '#70e0ff',
                    '#a0c4ff', '#70e0ff', '#70e0ff', '#a0c4ff', '#70e0ff', '#00f2ff',
                    '#70e0ff', '#a0c4ff', '#a0c4ff', '#70e0ff', '#70e0ff', '#00f2ff',
                    '#70e0ff', '#00f2ff', '#70e0ff', '#00f2ff', '#70e0ff', '#a0c4ff'
                  ];
                  return (
                    <motion.div 
                      key={day} 
                      variants={{
                        hidden: { scale: 0, opacity: 0 },
                        visible: { scale: 1, opacity: 1 }
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div 
                        className="w-10 h-10 rounded-full shadow-inner"
                        style={{ 
                          background: day === 11 ? emotions[selectedEmotionIndex].color : mockColors[i],
                          boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5)'
                        }}
                      />
                      <span className="text-[#D4F01D] font-bold text-sm">{day}</span>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="flex-1 flex flex-col">
                <label className="text-white font-bold mb-4">¿Algo que añadir sobre hoy?</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full flex-1 bg-[#005cb8] rounded-3xl p-6 text-white outline-none resize-none focus:ring-2 focus:ring-[#D4F01D] transition-all"
                />
              </div>

              <div className="mt-8">
                <button
                  onClick={handleSaveEmotion}
                  className="w-full bg-[#D4F01D] text-[#004a99] font-bold py-4 rounded-2xl text-xl hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Guardar Emoción
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="balance-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full w-full flex flex-col pt-4 bg-[#004a99] overflow-hidden"
            >
              {/* Top Tabs Navigation */}
              <div className="px-6 mb-6">
                <div className="bg-white/5 p-1 rounded-[20px] flex gap-1">
                  <button 
                    onClick={() => setActiveTab('Balance')}
                    className={`flex-1 py-3 rounded-[16px] font-bold text-xs transition-all ${activeTab === 'Balance' ? 'bg-[#D4F01D] text-[#004a99] shadow-lg' : 'text-white/60 hover:text-white'}`}
                  >
                    Balance
                  </button>
                  <button 
                    onClick={() => setActiveTab('Intensidad')}
                    className={`flex-1 py-3 rounded-[16px] font-bold text-xs transition-all ${activeTab === 'Intensidad' ? 'bg-[#D4F01D] text-[#004a99] shadow-lg' : 'text-white/60 hover:text-white'}`}
                  >
                    Intensidad
                  </button>
                  <button 
                    onClick={() => setActiveTab('Resumen')}
                    className={`flex-1 py-3 rounded-[16px] font-bold text-xs transition-all ${activeTab === 'Resumen' ? 'bg-[#D4F01D] text-[#004a99] shadow-lg' : 'text-white/60 hover:text-white'}`}
                  >
                    Resumen
                  </button>
                </div>
              </div>

              {activeTab === 'Balance' ? (
                <div className="flex-1 flex flex-col justify-between pb-24">
                  {/* Period Toggle */}
                  <div className="flex justify-center mb-4 px-6">
                    <div className="bg-[#D4F01D]/20 p-1 rounded-full flex w-48">
                      <button 
                        onClick={() => setBalancePeriod('Semana')}
                        className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${balancePeriod === 'Semana' ? 'bg-white text-[#004a99]' : 'text-white'}`}
                      >
                        Semana
                      </button>
                      <button 
                        onClick={() => setBalancePeriod('Mes')}
                        className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${balancePeriod === 'Mes' ? 'bg-[#D4F01D] text-[#004a99]' : 'text-white'}`}
                      >
                        Mes
                      </button>
                    </div>
                  </div>

                  {/* Chart Container */}
                  <div className="px-10 mb-4 flex-1 flex items-center justify-center">
                    <div className="bg-[#005cb8] rounded-[40px] p-4 w-full aspect-square flex items-center justify-center relative shadow-xl border border-white/5 max-h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          {/* Outer Ring: Specific Emotions */}
                          <Pie
                            data={balanceData[balancePeriod].outer}
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="95%"
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, name, value, color }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              
                              // Determine if text should be flipped to stay upright
                              const isFlipped = midAngle > 90 && midAngle < 270;
                              const rotation = isFlipped ? midAngle + 180 : midAngle;
                              
                              // Contrast color: white for dark backgrounds, black for light ones
                              const textColor = ['#0a2a45', '#2a4a75', '#4a6fa5'].includes(color.toLowerCase()) ? '#fff' : '#000';
                              
                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill={textColor}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  className="text-[8px] font-black tracking-tighter"
                                  transform={`rotate(${-rotation}, ${x}, ${y})`}
                                >
                                  {value > 5 ? `${name} ${value}%` : `${value}%`}
                                </text>
                              );
                            }}
                            labelLine={false}
                          >
                            {balanceData[balancePeriod].outer.map((entry, index) => (
                              <Cell key={`cell-outer-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          {/* Inner Ring: Positivas vs Negativas */}
                          <Pie
                            data={balanceData[balancePeriod].inner}
                            cx="50%"
                            cy="50%"
                            innerRadius="40%"
                            outerRadius="68%"
                            paddingAngle={4}
                            dataKey="value"
                            stroke="#000"
                            strokeWidth={2}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, name, value, color }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              
                              const isFlipped = midAngle > 90 && midAngle < 270;
                              const rotation = isFlipped ? midAngle + 180 : midAngle;
                              const textColor = ['#0a2a45', '#2a4a75', '#4a6fa5'].includes(color.toLowerCase()) ? '#fff' : '#000';

                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill={textColor}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  className="text-[9px] font-black tracking-tight"
                                  transform={`rotate(${-rotation}, ${x}, ${y})`}
                                >
                                  {`${name} ${value}%`}
                                </text>
                              );
                            }}
                            labelLine={false}
                          >
                            {balanceData[balancePeriod].inner.map((entry, index) => (
                              <Cell key={`cell-inner-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="px-6 space-y-3">
                    <div className="bg-[#005cb8] p-4 rounded-3xl flex items-center justify-between border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[#D4F01D] font-bold text-base">Emociones positivas</span>
                        <span className="text-white/40 text-xs font-bold">{balanceData[balancePeriod].stats.pos} registradas</span>
                      </div>
                      <span className="text-[#D4F01D] text-xl font-black">{balanceData[balancePeriod].stats.posPct}%</span>
                    </div>
                    <div className="bg-[#005cb8] p-4 rounded-3xl flex items-center justify-between border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[#D4F01D] font-bold text-base">Emociones negativas</span>
                        <span className="text-white/40 text-xs font-bold">{balanceData[balancePeriod].stats.neg} registradas</span>
                      </div>
                      <span className="text-[#D4F01D] text-xl font-black">{balanceData[balancePeriod].stats.negPct}%</span>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'Intensidad' ? (
                <div className="px-6 pb-24 overflow-y-auto flex-1">
                  {/* Month Header */}
                  <div className="flex items-center justify-between mb-8">
                    <button className="text-[#D4F01D] p-2">
                      <ChevronLeft size={24} />
                    </button>
                    <div className="bg-[#D4F01D] px-8 py-2 rounded-full">
                      <span className="text-[#004a99] font-black text-lg">Noviembre</span>
                    </div>
                    <button className="text-[#D4F01D]/20 p-2">
                      <ChevronLeft size={24} className="rotate-180" />
                    </button>
                  </div>

                  {/* Intensity Grid */}
                  <div className="space-y-2">
                    {Array.from({ length: 30 }).map((_, i) => {
                      // Mock intensity data for each day
                      const dayEmotions = [
                        { color: '#0a2a45', width: '15%' },
                        { color: '#4a6fa5', width: '20%' },
                        { color: '#a0c4ff', width: '25%' },
                        { color: '#70e0ff', width: '20%' },
                        { color: '#00f2ff', width: '10%' },
                        { color: '#00f2ff', width: '10%' },
                      ].slice(0, Math.floor(Math.random() * 4) + 3);

                      return (
                        <div key={i} className="flex items-center gap-4">
                          <span className="text-[#D4F01D] font-black text-sm w-4">{i + 1}</span>
                          <div className="flex-1 h-10 bg-white/5 rounded-sm border border-[#D4F01D] overflow-hidden flex">
                            {dayEmotions.map((emo, j) => (
                              <div 
                                key={j} 
                                style={{ backgroundColor: emo.color, width: emo.width }}
                                className="h-full border-r border-white/10"
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-6 flex flex-col items-center justify-center h-64">
                  <span className="text-white/40 font-bold">Próximamente: Resumen Detallado</span>
                </div>
              )}

              {/* Bottom Nav */}
              <div className="fixed bottom-8 left-6 right-6 bg-[#005cb8] h-20 rounded-[32px] flex items-center justify-between px-8 shadow-2xl border border-white/10 z-30">
                <button onClick={resetFlow} className="w-12 h-12 bg-[#D4F01D] rounded-full flex items-center justify-center text-[#004a99] shadow-lg active:scale-95 transition-transform">
                  <Plus size={24} />
                </button>
                <button className="text-[#D4F01D] flex flex-col items-center gap-1">
                  <BarChart2 size={24} />
                  <span className="text-[10px] font-bold">Análisis</span>
                </button>
                <button className="text-[#D4F01D]/40 flex flex-col items-center gap-1">
                  <Sparkles size={24} />
                  <span className="text-[10px] font-bold">IA</span>
                </button>
                <button className="text-[#D4F01D]/40 flex flex-col items-center gap-1">
                  <User size={24} />
                  <span className="text-[10px] font-bold">Perfil</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back button */}
        {!showBalance && (
          <button 
            onClick={() => {
              if (showSummary) setShowSummary(false);
              else setIsRegistering(false);
            }}
            className="absolute top-6 left-6 text-[#D4F01D] p-2 hover:bg-white/10 rounded-full z-20"
          >
            <ChevronLeft size={32} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#004a99] text-white font-sans selection:bg-[#D4F01D] selection:text-[#004a99]">
      <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 relative">
        
        {/* Header with Back Button */}
        <div className="h-12 flex items-center mb-4">
          {step > 1 && (
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
              id="back-button"
            >
              <ChevronLeft size={32} className="text-[#D4F01D]" />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-y-auto pr-2"
            >
              <Logo />
              <h1 className="text-2xl font-bold text-center mb-2">Bienvenid@ a EXPRESS!</h1>
              <p className="text-sm text-center text-white/80 mb-8">Tu espacio personal para comprender tus emociones</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-[#D4F01D]"><CircleCheck size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm">Registra tus emociones diarias</h3>
                    <p className="text-xs text-white/60">Identifica y rastrea como te sientes cada día</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-[#D4F01D]"><CircleCheck size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm">Visualiza patrones emocionales</h3>
                    <p className="text-xs text-white/60">Compréndete por tu bienestar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-[#D4F01D]"><CircleCheck size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm">Escribe tus reflexiones</h3>
                    <p className="text-xs text-white/60">Visita tus emociones pasadas y escribe!</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3">¿Cómo te llamas?</label>
                  <input
                    type="text"
                    placeholder="Escribe tu nombre..."
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    className="w-full bg-[#005cb8] border-none rounded-2xl py-4 px-6 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#D4F01D] outline-none transition-all"
                    id="name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">¿Cuál es tu género?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Masculino', 'Femenino', 'Neutro'] as Gender[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setUserData({ ...userData, gender: g })}
                        className={`py-3 rounded-2xl text-sm font-medium transition-all ${
                          userData.gender === g
                            ? 'bg-[#005cb8] ring-2 ring-[#D4F01D]'
                            : 'bg-[#005cb8] hover:bg-[#0066cc]'
                        }`}
                        id={`gender-${g?.toLowerCase()}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <Pagination current={1} />
                <button
                  onClick={handleNext}
                  disabled={!userData.name || !userData.gender}
                  className="w-full bg-[#D4F01D] text-[#004a99] font-bold py-4 rounded-2xl text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  id="continue-button-1"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-y-auto pr-2"
            >
              <Logo />
              <h2 className="text-lg font-semibold text-center mb-8">Elige tu foto de perfil</h2>

              <div className="flex-1 flex items-center justify-center">
                <div 
                  onClick={triggerFileInput}
                  className="w-64 h-64 bg-[#005cb8] rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#0066cc] transition-all relative overflow-hidden group"
                  id="profile-pic-trigger"
                >
                  {userData.profilePic ? (
                    <>
                      <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={48} className="text-[#D4F01D]" />
                      </div>
                      <div className="absolute top-4 right-4 bg-[#D4F01D] p-2 rounded-full text-[#004a99]">
                        <Check size={24} />
                      </div>
                    </>
                  ) : (
                    <Camera size={80} className="text-[#D4F01D]" />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {userData.profilePic && (
                <button 
                  onClick={triggerFileInput}
                  className="text-white/60 text-xs underline mt-4 text-center hover:text-white"
                >
                  ¿Volver a tomar foto?
                </button>
              )}

              <div className="mt-auto pt-8">
                <Pagination current={2} />
                <button
                  onClick={handleNext}
                  className="w-full bg-[#D4F01D] text-[#004a99] font-bold py-4 rounded-2xl text-lg hover:brightness-110 active:scale-[0.98] transition-all"
                  id="continue-button-2"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-y-auto pr-2"
            >
              <div className="flex justify-center mb-12">
                <div className="w-32 h-32 rounded-full border-4 border-[#D4F01D] overflow-hidden bg-[#005cb8]">
                  {userData.profilePic ? (
                    <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera size={40} className="text-[#D4F01D]/40" />
                    </div>
                  )}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-2">¡Todo listo, {userData.name}!</h1>
              <p className="text-sm text-center text-white/80 mb-12">Así es como funciona el registro de emociones</p>

              <div className="space-y-8 flex-1">
                <div className="flex items-start gap-6">
                  <span className="text-lg font-bold text-white/40 mt-1">1</span>
                  <div>
                    <h3 className="font-bold text-base">¿Cómo ha ido el día?</h3>
                    <p className="text-sm text-white/60">¡Registra tus emociones de una forma rápida y eficaz!</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <span className="text-lg font-bold text-white/40 mt-1">2</span>
                  <div>
                    <h3 className="font-bold text-base">¿Por qué te sientes así?</h3>
                    <p className="text-sm text-white/60">¡Visualiza tus cambios de ánimo y compréndete mejor!</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <span className="text-lg font-bold text-white/40 mt-1">3</span>
                  <div>
                    <h3 className="font-bold text-base">Reflexiona</h3>
                    <p className="text-sm text-white/60">Habla con nuestro asistente y pregúntale lo que se te pase por la cabeza</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl mb-8">
                <Info size={18} className="text-[#D4F01D] shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-white/60">
                  <span className="font-bold text-white/80">Privacidad total:</span> todos tus datos se guardan localmente y nadie nunca obtendrá acceso a tu información personal.
                </p>
              </div>

              <div className="mt-auto">
                <Pagination current={3} />
                <button
                  className="w-full bg-[#D4F01D] text-[#004a99] font-bold py-4 rounded-2xl text-lg hover:brightness-110 active:scale-[0.98] transition-all"
                  id="final-button"
                  onClick={() => setIsRegistering(true)}
                >
                  Ir al Registro
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
