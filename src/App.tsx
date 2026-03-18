/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  User,
  LogOut,
  Brain,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { auth, signInWithGoogle, saveUser, saveEmotion, getEmotions } from './firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

type Gender = 'Masculino' | 'Femenino' | 'Neutro' | null;

interface UserData {
  name: string;
  gender: Gender;
  profilePic: string | null;
  birthPlace: string;
  bio: string;
  objective: string;
}

export default function App() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    name: 'Victor Bru Zorrilla',
    gender: 'Masculino',
    profilePic: null,
    birthPlace: 'Málaga',
    bio: 'Soy Víctor, tengo 21 años y soy de Málaga. Me considero una persona curiosa, con ganas de aprender y de llevar mis ideas a proyectos reales.',
    objective: 'Entender como me siento diariamente.',
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
  const [activeTab, setActiveTab] = useState<'Balance' | 'Intensidad' | 'Asistente' | 'Usuario' | 'Resumen'>('Balance');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [summaryPeriod, setSummaryPeriod] = useState<'Semana' | 'Mes'>('Mes');
  const [dailyLogs, setDailyLogs] = useState<Record<number, { emotion: string, note: string, reflection: string }>>({
    1: { 
      emotion: 'Regular', 
      note: 'Hoy ha sido un día como otro, en clase he sentido mucha presión por falta de tiempo y se me ha quemado el pastel de zanahoria que estaba haciendo, al menos Juan me ha recomendado un temazo nuevo y lo tengo on repeat todo el día.', 
      reflection: 'Tengo que hacer las tareas con mayor margen de tiempo para no acabar a prisas. Quizas debería dividirla en secciones para que me resulte más sencillo.' 
    },
    2: {
      emotion: 'Feliz',
      note: '¡Hoy ha sido un día increíble! He terminado el proyecto de programación y me ha salido todo a la primera. Luego he ido a dar un paseo por la playa.',
      reflection: 'Me siento muy productivo cuando me organizo bien desde la mañana.'
    },
    6: {
      emotion: 'Genial',
      note: 'He quedado con mis amigos y nos hemos reído muchísimo. Hacía tiempo que no me sentía tan conectado.',
      reflection: 'Debo priorizar estos momentos sociales, me recargan las pilas.'
    }
  });
  const [isInvertedTheme, setIsInvertedTheme] = useState(false);
  const [balancePeriod, setBalancePeriod] = useState<'Semana' | 'Mes'>('Semana');
  const [note, setNote] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: 'Hola Victor, como te sientes hoy? 🥰' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const emotions = [
    { name: 'GENIAL', x: 75, y: 15, color: '#00f2ff' },
    { name: 'FELIZ', x: 25, y: 25, color: '#70e0ff' },
    { name: 'BIEN', x: 75, y: 40, color: '#a0c4ff' },
    { name: 'REGULAR', x: 20, y: 55, color: '#4a6fa5' },
    { name: 'TRISTE', x: 75, y: 70, color: '#2a4a75' },
    { name: 'FATAL', x: 25, y: 82, color: '#0a2a45' },
  ];

  const [selectedEmotionIndex, setSelectedEmotionIndex] = useState(0);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [emotionsList, setEmotionsList] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        saveUser(u);
        setUserData(prev => ({
          ...prev,
          name: u.displayName || prev.name,
          profilePic: u.photoURL || prev.profilePic
        }));
        setStep(3); // Skip to final step if already logged in
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = getEmotions(user.uid, (data) => {
        setEmotionsList(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setStep(1);
      resetFlow();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const generateAiSummary = async () => {
    if (!user || emotionsList.length === 0) return;
    setIsGeneratingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const recentEmotions = emotionsList.slice(0, 10).map(e => `${e.emotion} (${e.category}) - Nota: ${e.note}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analiza estas emociones recientes de un usuario y proporciona un resumen empático, breve (máximo 3 párrafos) y accionable en español. Usa un tono cercano y motivador.\n\nEmociones:\n${recentEmotions}`,
      });
      setAiSummary(response.text || 'No se pudo generar el resumen en este momento.');
    } catch (error) {
      console.error('AI Error:', error);
      setAiSummary('Error al conectar con la IA. Inténtalo de nuevo más tarde.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Asistente' && !aiSummary && emotionsList.length > 0) {
      generateAiSummary();
    }
  }, [activeTab, emotionsList]);

  const processedBalanceData = useMemo(() => {
    const now = new Date();
    const filtered = emotionsList.filter(e => {
      const timestamp = e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp);
      const diff = now.getTime() - timestamp.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return balancePeriod === 'Semana' ? days <= 7 : days <= 30;
    });

    if (filtered.length === 0) return { outer: [], inner: [], stats: { pos: 0, neg: 0, posPct: 0, negPct: 0 } };

    const counts: Record<string, number> = {};
    let pos = 0;
    let neg = 0;

    filtered.forEach(e => {
      counts[e.emotion] = (counts[e.emotion] || 0) + 1;
      if (e.category === 'POSITIVA') pos++;
      else neg++;
    });

    const outer = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: emotions.find(emo => emo.name === name)?.color || '#ccc'
    }));

    const inner = [
      { name: 'POSITIVAS', value: pos, color: '#00f2ff' },
      { name: 'NEGATIVAS', value: neg, color: '#0a2a45' }
    ];

    return {
      outer,
      inner,
      stats: {
        pos,
        neg,
        posPct: Math.round((pos / filtered.length) * 100),
        negPct: Math.round((neg / filtered.length) * 100)
      }
    };
  }, [emotionsList, balancePeriod]);

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

  const handleSaveEmotion = async () => {
    try {
      const emotion = emotions[selectedEmotionIndex];
      const today = new Date().getDate();
      
      // Update local logs for the summary
      setDailyLogs(prev => ({
        ...prev,
        [today]: {
          emotion: emotion.name,
          note: note,
          reflection: ''
        }
      }));

      if (user) {
        const category = ['GENIAL', 'FELIZ', 'BIEN'].includes(emotion.name) ? 'POSITIVA' : 'NEGATIVA';
        await saveEmotion(user.uid, emotion.name, 5, note, category as any);
      }
    } catch (error) {
      console.error('Error al guardar emoción:', error);
    } finally {
      setShowBalance(true);
      setShowSummary(false);
      setActiveTab('Balance');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "Eres un Asistente Emocional empático y cercano. Tu objetivo es escuchar al usuario (Victor), validar sus emociones y ofrecer consejos suaves y motivadores. Mantén las respuestas breves y usa emojis ocasionalmente. Eres un amigo que siempre está ahí para escuchar.",
        },
      });

      // Send history + new message
      const history = chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await chat.sendMessage({
        message: userMessage
      });

      setChatMessages(prev => [...prev, { role: 'assistant', text: response.text || 'Lo siento, no pude procesar eso.' }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Hubo un error al conectar con mi cerebro emocional. ¿Podemos intentarlo de nuevo?' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startRegistration = () => {
    setIsRegistering(true);
    setShowSummary(false);
    setShowBalance(false);
    setNote('');
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
        <path d="M50 5C25.147 5 5 25.147 5 50C5 74.853 25.147 95 50 95C74.853 95 95 74.853 95 50C95 25.147 74.853 5 50 5ZM50 85C30.67 85 15 69.33 15 50C15 30.67 30.67 15 50 15C69.33 15 85 30.67 85 50C85 69.33 69.33 85 50 85Z" fill="var(--accent)" fillOpacity="0.2"/>
        <g clipPath="url(#clip0)">
          {Array.from({ length: 18 }).map((_, i) => (
            <path
              key={i}
              d={`M50 50C50 50 60 20 80 30C100 40 70 60 50 50Z`}
              fill="var(--accent)"
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
        className={`h-screen ${isInvertedTheme ? 'theme-inverted' : ''} bg-primary relative touch-none overflow-hidden`}
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
              <div className="flex items-center justify-center gap-4 mb-4 relative">
                <button 
                  onClick={() => setShowSummary(false)}
                  className="absolute left-0 text-accent"
                >
                  <ChevronLeft size={32} strokeWidth={3} />
                </button>
                <div className="bg-accent px-8 py-2 rounded-full shadow-lg">
                  <span className="text-primary font-black text-xl">Noviembre</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.01
                    }
                  }
                }}
                className="grid grid-cols-7 gap-y-3 gap-x-1 mb-6"
              >
                {/* Empty spaces for start of month alignment if needed */}
                <div className="col-span-5"></div> 
                {Array.from({ length: 30 }).map((_, i) => {
                  const day = i + 1;
                  const log = dailyLogs[day];
                  
                  // Use same logic as Resumen tab for consistency
                  let intensity = log 
                    ? (['GENIAL', 'FELIZ'].includes(log.emotion) ? 5 : 1) 
                    : [2, 5, 1, 0, 0, 5, 0, 4, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 0, 0, 1, 1, 5, 5, 5, 1, 5, 1, 0][i % 29];

                  const getSphereStyle = (val: number) => {
                    if (val === 5) return { background: 'radial-gradient(circle at 30% 30%, #22d3ee, #0891b2)', boxShadow: '0 0 15px rgba(34,211,238,0.8)' };
                    if (val === 4) return { background: 'radial-gradient(circle at 30% 30%, #1e3a8a, #0f172a)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' };
                    if (val === 2) return { background: 'radial-gradient(circle at 30% 30%, #93c5fd, #2563eb)', opacity: 0.6 };
                    if (val === 1) return { background: 'radial-gradient(circle at 30% 30%, #a5f3fc, #0891b2)', opacity: 0.8, boxShadow: '0 0 10px rgba(165,243,252,0.5)' };
                    return { background: 'radial-gradient(circle at 30% 30%, #94a3b8, #475569)', opacity: 0.4 };
                  };

                  return (
                    <motion.div 
                      key={day} 
                      variants={{
                        hidden: { scale: 0, opacity: 0 },
                        visible: { scale: 1, opacity: 1 }
                      }}
                      className="flex flex-col items-center gap-0.5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDay(day);
                        setActiveTab('Resumen');
                        setShowSummary(false);
                        setShowBalance(true);
                      }}
                    >
                      <div 
                        className="w-8 h-8 rounded-full shadow-inner"
                        style={getSphereStyle(intensity)}
                      />
                      <span className="text-accent font-bold text-[10px]">{day}</span>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="flex flex-col mb-6">
                <label className="text-text-main font-bold mb-2 text-sm">¿Algo que añadir sobre hoy?</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-24 bg-primary-light rounded-2xl p-4 text-text-main outline-none resize-none focus:ring-2 focus:ring-accent transition-all text-sm"
                />
              </div>

              <div className="mt-auto pb-4">
                <button
                  onClick={handleSaveEmotion}
                  className="w-full bg-accent text-primary font-bold py-4 rounded-2xl text-xl hover:brightness-110 active:scale-[0.98] transition-all"
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
              className="h-full w-full flex flex-col pt-4 bg-primary overflow-hidden"
            >
              {/* Top Tabs Navigation */}
              {['Balance', 'Intensidad', 'Resumen'].includes(activeTab) && (
                <div className="px-6 mb-6">
                  <div className="bg-white/5 p-1 rounded-[20px] flex gap-1">
                    <button 
                      onClick={() => setActiveTab('Balance')}
                      className={`flex-1 py-3 rounded-[16px] font-bold text-xs transition-all ${activeTab === 'Balance' ? 'bg-accent text-primary shadow-lg' : 'text-text-main/60 hover:text-text-main'}`}
                    >
                      Balance
                    </button>
                    <button 
                      onClick={() => setActiveTab('Intensidad')}
                      className={`flex-1 py-3 rounded-[16px] font-bold text-xs transition-all ${activeTab === 'Intensidad' ? 'bg-accent text-primary shadow-lg' : 'text-text-main/60 hover:text-text-main'}`}
                    >
                      Intensidad
                    </button>
                    <button 
                      onClick={() => setActiveTab('Resumen')}
                      className={`flex-1 py-3 rounded-[16px] font-bold text-xs transition-all ${activeTab === 'Resumen' ? 'bg-accent text-primary shadow-lg' : 'text-text-main/60 hover:text-text-main'}`}
                    >
                      Resumen
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'Balance' ? (
                <div className="flex-1 flex flex-col overflow-hidden px-6 pb-20">
                  <div className="overflow-y-auto flex-1 pb-4">
                    {/* Period Toggle */}
                    <div className="flex justify-center mb-4 mt-2">
                      <div className="bg-accent/20 p-1 rounded-full flex w-40">
                        <button 
                          onClick={() => setBalancePeriod('Semana')}
                          className={`flex-1 py-1 rounded-full text-[10px] font-bold transition-all ${balancePeriod === 'Semana' ? 'bg-white text-primary' : 'text-text-main'}`}
                        >
                          Semana
                        </button>
                        <button 
                          onClick={() => setBalancePeriod('Mes')}
                          className={`flex-1 py-1 rounded-full text-[10px] font-bold transition-all ${balancePeriod === 'Mes' ? 'bg-accent text-primary' : 'text-text-main'}`}
                        >
                          Mes
                        </button>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="mb-4 flex items-center justify-center">
                      <div className="bg-primary-light rounded-[40px] p-4 w-full aspect-square flex items-center justify-center relative shadow-xl border border-white/5 max-w-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              {/* Outer Ring: Specific Emotions */}
                              <Pie
                                data={processedBalanceData?.outer || []}
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="95%"
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                                label={false}
                                labelLine={false}
                              >
                                {(processedBalanceData?.outer || []).map((entry, index) => (
                                  <Cell key={`cell-outer-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              {/* Inner Ring: Positivas vs Negativas */}
                              <Pie
                                data={processedBalanceData?.inner || []}
                                cx="50%"
                                cy="50%"
                                innerRadius="40%"
                                outerRadius="68%"
                                paddingAngle={4}
                                dataKey="value"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="text-primary"
                                label={false}
                                labelLine={false}
                              >
                                {(processedBalanceData?.inner || []).map((entry, index) => (
                                  <Cell key={`cell-inner-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="space-y-2 mb-4">
                      <div className="bg-primary-light p-3 rounded-2xl flex items-center justify-between border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-accent font-bold text-sm">Emociones positivas</span>
                          <span className="text-text-main/40 text-[10px] font-bold">{processedBalanceData?.stats.pos || 0} registradas</span>
                        </div>
                        <span className="text-accent text-lg font-black">{processedBalanceData?.stats.posPct || 0}%</span>
                      </div>
                      <div className="bg-primary-light p-3 rounded-2xl flex items-center justify-between border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-accent font-bold text-sm">Emociones negativas</span>
                          <span className="text-text-main/40 text-[10px] font-bold">{processedBalanceData?.stats.neg || 0} registradas</span>
                        </div>
                        <span className="text-accent text-lg font-black">{processedBalanceData?.stats.negPct || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'Intensidad' ? (
                <div className="px-6 pb-20 overflow-hidden flex-1 flex flex-col">
                  <div className="overflow-y-auto flex-1 mt-2">
                    {/* Month Header */}
                    <div className="flex items-center justify-between mb-6">
                      <button className="text-accent p-2">
                        <ChevronLeft size={20} />
                      </button>
                      <div className="bg-accent px-6 py-1.5 rounded-full">
                        <span className="text-primary font-black text-base">Noviembre</span>
                      </div>
                      <button className="text-accent/20 p-2">
                        <ChevronLeft size={20} className="rotate-180" />
                      </button>
                    </div>

                    {/* Intensity Grid */}
                    <div className="space-y-1.5 pb-4">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const dayEmotions = [
                          { color: '#0a2a45', width: '15%' },
                          { color: '#4a6fa5', width: '20%' },
                          { color: '#a0c4ff', width: '25%' },
                          { color: '#70e0ff', width: '20%' },
                          { color: '#00f2ff', width: '10%' },
                          { color: '#00f2ff', width: '10%' },
                        ].slice(0, Math.floor(Math.random() * 4) + 3);

                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-accent font-black text-[10px] w-3">{i + 1}</span>
                            <div className="flex-1 h-8 bg-white/5 rounded-sm border border-accent overflow-hidden flex">
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
                </div>
              ) : activeTab === 'Resumen' ? (
                <div className="flex-1 flex flex-col overflow-hidden px-6 pb-20">
                  {selectedDay === null ? (
                    <div className="overflow-y-auto flex-1 pb-4">
                      {/* Month Header */}
                      <div className="flex justify-center mb-8 mt-2">
                        <div className="bg-accent text-primary px-8 py-2 rounded-full font-black text-xl shadow-lg">
                          Noviembre
                        </div>
                      </div>

                      {/* Spheres Grid */}
                      <div className="grid grid-cols-7 gap-y-6 gap-x-2 mb-8">
                        {Array.from({ length: 30 }).map((_, i) => {
                          const day = i + 1;
                          const log = dailyLogs[day];
                          
                          // If there's a real log, use its emotion to determine style
                          // Otherwise use the mock pattern for visual variety
                          let intensity = log 
                            ? (['GENIAL', 'FELIZ'].includes(log.emotion) ? 5 : 1) 
                            : [2, 5, 1, 0, 0, 5, 0, 4, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 0, 0, 1, 1, 5, 5, 5, 1, 5, 1, 0][i % 29];
                          
                          const getSphereStyle = (val: number) => {
                            if (val === 5) return { background: 'radial-gradient(circle at 30% 30%, #22d3ee, #0891b2)', boxShadow: '0 0 15px rgba(34,211,238,0.8)' };
                            if (val === 4) return { background: 'radial-gradient(circle at 30% 30%, #1e3a8a, #0f172a)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' };
                            if (val === 2) return { background: 'radial-gradient(circle at 30% 30%, #93c5fd, #2563eb)', opacity: 0.6 };
                            if (val === 1) return { background: 'radial-gradient(circle at 30% 30%, #a5f3fc, #0891b2)', opacity: 0.8, boxShadow: '0 0 10px rgba(165,243,252,0.5)' };
                            return { background: 'radial-gradient(circle at 30% 30%, #94a3b8, #475569)', opacity: 0.4 };
                          };

                          return (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <button 
                                onClick={() => setSelectedDay(day)}
                                style={getSphereStyle(intensity)}
                                className="w-10 h-10 rounded-full transition-transform active:scale-95"
                              />
                              <span className="text-accent font-black text-[10px]">{day}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Period Toggle */}
                      <div className="flex justify-center mb-8">
                        <div className="bg-white p-0.5 rounded-full flex w-48 shadow-lg">
                          <button 
                            onClick={() => setSummaryPeriod('Semana')}
                            className={`flex-1 py-2 rounded-full text-xs font-black transition-all ${summaryPeriod === 'Semana' ? 'bg-accent text-primary' : 'text-primary/40'}`}
                          >
                            Semana
                          </button>
                          <button 
                            onClick={() => setSummaryPeriod('Mes')}
                            className={`flex-1 py-2 rounded-full text-xs font-black transition-all ${summaryPeriod === 'Mes' ? 'bg-white text-primary' : 'text-primary/40'}`}
                          >
                            Mes
                          </button>
                        </div>
                      </div>

                      {/* Stats Summary */}
                      <div className="bg-primary-light/40 rounded-3xl p-6 border border-white/5">
                        <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                          {[
                            { label: 'GENIAL', val: '7,72%', color: 'bg-cyan-300' },
                            { label: 'FELIZ', val: '13,15%', color: 'bg-cyan-100' },
                            { label: 'BIEN', val: '19,8%', color: 'bg-blue-200' },
                            { label: 'REGULAR', val: '11,17%', color: 'bg-slate-300' },
                            { label: 'TRISTE', val: '32,39%', color: 'bg-cyan-500' },
                            { label: 'FATAL', val: '17,87%', color: 'bg-blue-900' },
                          ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <span className="text-[10px] font-black text-text-main tracking-wider">{stat.label}</span>
                              <div className={`${stat.color} px-4 py-1 rounded-full text-[10px] font-black text-primary min-w-[70px] text-center shadow-sm`}>
                                {stat.val}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-y-auto flex-1 pb-4">
                      {/* Day Detail Header */}
                      <div className="flex items-center gap-4 mb-8 mt-2">
                        <button onClick={() => setSelectedDay(null)} className="text-accent">
                          <ChevronLeft size={32} strokeWidth={3} />
                        </button>
                        <div className="bg-accent text-primary px-8 py-2 rounded-full font-black text-xl shadow-lg">
                          {selectedDay} de Noviembre
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-black text-text-main mb-4">
                            Emoción: {dailyLogs[selectedDay]?.emotion || 'Sin registro'}
                          </h2>
                          <div className="bg-primary-light rounded-3xl p-6 border border-white/5 text-text-main text-sm leading-relaxed shadow-xl">
                            {dailyLogs[selectedDay]?.note || 'No hay notas registradas para este día.'}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button 
                            onClick={() => setActiveTab('Asistente')}
                            className="bg-primary border border-accent text-accent px-6 py-2 rounded-full text-xs font-black shadow-lg hover:bg-accent hover:text-primary transition-all"
                          >
                            Hábla con el Asistente Emocional
                          </button>
                        </div>

                        <div>
                          <h2 className="text-2xl font-black text-text-main mb-4">¿Algúna reflexión?</h2>
                          <textarea 
                            value={dailyLogs[selectedDay]?.reflection || ''}
                            onChange={(e) => setDailyLogs({
                              ...dailyLogs,
                              [selectedDay]: {
                                ...(dailyLogs[selectedDay] || { emotion: 'Desconocida', note: '' }),
                                reflection: e.target.value
                              }
                            })}
                            placeholder="Escribe aquí tus inquietudes o reflexiones sobre el día..."
                            className="w-full bg-primary-light rounded-3xl p-6 border border-white/5 text-text-main text-sm leading-relaxed shadow-xl min-h-[200px] outline-none focus:border-accent transition-colors resize-none placeholder:text-text-main/30"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === 'Asistente' ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                  {/* Chat Header */}
                  <div className="px-6 py-4 flex items-center gap-4 border-b border-white/5 bg-primary z-10">
                    <button onClick={() => setActiveTab('Balance')} className="text-text-main">
                      <ChevronLeft size={24} />
                    </button>
                    <div className="relative">
                      <img 
                        src={userData.profilePic || 'https://picsum.photos/seed/user/200'} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-primary rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-text-main">Asistente Emocional</h3>
                        <Sparkles size={14} className="text-accent" />
                      </div>
                      <p className="text-[10px] text-text-main/60">Estoy aquí para escucharte</p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-40">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                        {msg.role === 'assistant' && (
                          <img 
                            src={userData.profilePic || 'https://picsum.photos/seed/user/200'} 
                            alt="AI" 
                            className="w-6 h-6 rounded-full object-cover mb-1"
                          />
                        )}
                        <div className={`max-w-[80%] p-4 rounded-3xl text-sm ${
                          msg.role === 'user' 
                            ? 'bg-accent/20 text-text-main rounded-br-none' 
                            : 'bg-primary-light text-text-main rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start items-end gap-2">
                        <div className="bg-primary-light p-4 rounded-3xl rounded-bl-none">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-text-main/40 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-text-main/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-text-main/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input - Fixed at bottom of this container */}
                  <div className="absolute bottom-[104px] left-0 right-0 px-6 py-4 bg-primary/80 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white rounded-full px-6 py-3 flex items-center gap-3 shadow-lg">
                        <input 
                          type="text" 
                          placeholder="Escribe como te sientes..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 bg-transparent border-none outline-none text-primary text-sm placeholder:text-primary/40"
                        />
                        <button onClick={handleSendMessage} className="text-primary">
                          <Plus size={20} strokeWidth={3} />
                        </button>
                      </div>
                      <button className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-text-main shadow-lg shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-6 pb-24 overflow-y-auto flex-1">
                  <div className="flex flex-col items-center mb-8 mt-4">
                    <div className="relative mb-2">
                      <img 
                        src={userData.profilePic || 'https://picsum.photos/seed/user/200'} 
                        alt="Profile" 
                        className="w-28 h-28 rounded-full border-4 border-primary-light object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <button className="text-accent text-sm font-bold">Editar imagen</button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-text-main font-bold text-sm block mb-2">Nombre</label>
                      <input 
                        type="text" 
                        value={userData.name}
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="w-full bg-primary-light rounded-xl py-3 px-4 text-text-main text-sm outline-none border border-white/5"
                      />
                    </div>

                    <div>
                      <label className="text-text-main font-bold text-sm block mb-2">Lugar de nacimiento</label>
                      <input 
                        type="text" 
                        value={userData.birthPlace}
                        onChange={(e) => setUserData({...userData, birthPlace: e.target.value})}
                        className="w-full bg-primary-light rounded-xl py-3 px-4 text-text-main text-sm outline-none border border-white/5"
                      />
                    </div>

                    <div>
                      <label className="text-text-main font-bold text-sm block mb-2">Biografía</label>
                      <textarea 
                        value={userData.bio}
                        onChange={(e) => setUserData({...userData, bio: e.target.value})}
                        className="w-full bg-primary-light rounded-xl py-3 px-4 text-text-main text-sm outline-none border border-white/5 h-28 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-text-main font-bold text-sm block mb-2">Objetivo</label>
                      <input 
                        type="text" 
                        value={userData.objective}
                        onChange={(e) => setUserData({...userData, objective: e.target.value})}
                        className="w-full bg-primary-light rounded-xl py-3 px-4 text-text-main text-sm outline-none border border-white/5"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center mt-10 mb-10">
                    <div 
                      onClick={() => setIsInvertedTheme(!isInvertedTheme)}
                      className="w-16 h-8 bg-primary-light rounded-full relative p-1 cursor-pointer transition-colors"
                    >
                      <div className={`w-6 h-6 bg-accent rounded-full absolute transition-all duration-300 shadow-md ${isInvertedTheme ? 'left-1' : 'right-1'} top-1`} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Nav */}
        {!(isRegistering && !showBalance) && (
          <div className="fixed bottom-6 left-6 right-6 bg-primary-light h-20 rounded-[32px] flex items-center justify-between px-10 shadow-2xl border border-white/10 z-30">
            <button 
              onClick={startRegistration} 
              className={`${isRegistering && !showBalance ? 'text-accent' : 'text-accent/40'} active:scale-90 transition-transform`}
            >
              <Plus size={32} strokeWidth={3} />
            </button>
            <button 
              onClick={() => {
                setIsRegistering(true);
                setShowBalance(true);
                setActiveTab('Balance');
              }}
              className={`${isRegistering && showBalance && ['Balance', 'Intensidad', 'Resumen'].includes(activeTab) ? 'text-accent' : 'text-accent/40'} active:scale-90 transition-transform`}
            >
              <BarChart2 size={32} strokeWidth={3} />
            </button>
            <button 
              onClick={() => {
                setIsRegistering(true);
                setShowBalance(true);
                setActiveTab('Asistente');
              }}
              className={`${isRegistering && showBalance && activeTab === 'Asistente' ? 'text-accent' : 'text-accent/40'} active:scale-90 transition-transform`}
            >
              <Sparkles size={32} strokeWidth={3} />
            </button>
            <button 
              onClick={() => {
                setIsRegistering(true);
                setShowBalance(true);
                setActiveTab('Usuario');
              }}
              className={`${isRegistering && showBalance && activeTab === 'Usuario' ? 'text-accent' : 'text-accent/40'} active:scale-90 transition-transform`}
            >
              <User size={32} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Back button */}
        {!showBalance && (
          <button 
            onClick={() => {
              if (showSummary) setShowSummary(false);
              else setIsRegistering(false);
            }}
            className="absolute top-6 left-6 text-accent p-2 hover:bg-white/10 rounded-full z-20"
          >
            <ChevronLeft size={32} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isInvertedTheme ? 'theme-inverted' : ''} bg-primary text-text-main font-sans selection:bg-accent selection:text-primary`}>
      <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 relative">
        
        {/* Header with Back Button */}
        <div className="h-12 flex items-center mb-4">
          {step > 1 && (
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
              id="back-button"
            >
              <ChevronLeft size={32} className="text-accent" />
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
              <p className="text-sm text-center text-text-main/80 mb-8">Tu espacio personal para comprender tus emociones</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-accent"><CircleCheck size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm">Registra tus emociones diarias</h3>
                    <p className="text-xs text-text-main/60">Identifica y rastrea como te sientes cada día</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-accent"><CircleCheck size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm">Visualiza patrones emocionales</h3>
                    <p className="text-xs text-text-main/60">Compréndete por tu bienestar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-accent"><CircleCheck size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm">Escribe tus reflexiones</h3>
                    <p className="text-xs text-text-main/60">Visita tus emociones pasadas y escribe!</p>
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
                    className="w-full bg-primary-light border-none rounded-2xl py-4 px-6 text-text-main placeholder:text-text-main/40 focus:ring-2 focus:ring-accent outline-none transition-all"
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
                            ? 'bg-primary-light ring-2 ring-accent'
                            : 'bg-primary-light hover:bg-primary-light/80'
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
                {!user ? (
                  <button
                    onClick={handleLogin}
                    className="w-full bg-white text-primary font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-3 hover:bg-white/90 active:scale-[0.98] transition-all"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" referrerPolicy="no-referrer" />
                    Entrar con Google
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="w-full bg-accent text-primary font-bold py-4 rounded-2xl text-lg hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Continuar como {user.displayName?.split(' ')[0]}
                  </button>
                )}
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
              <h2 className="text-lg font-semibold text-center mb-8 text-text-main">Elige tu foto de perfil</h2>

              <div className="flex-1 flex items-center justify-center">
                <div 
                  onClick={triggerFileInput}
                  className="w-64 h-64 bg-primary-light rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary-light/80 transition-all relative overflow-hidden group"
                  id="profile-pic-trigger"
                >
                  {userData.profilePic ? (
                    <>
                      <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={48} className="text-accent" />
                      </div>
                      <div className="absolute top-4 right-4 bg-accent p-2 rounded-full text-primary">
                        <Check size={24} />
                      </div>
                    </>
                  ) : (
                    <Camera size={80} className="text-accent" />
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
                  className="text-text-main/60 text-xs underline mt-4 text-center hover:text-text-main"
                >
                  ¿Volver a tomar foto?
                </button>
              )}

              <div className="mt-auto pt-8">
                <Pagination current={2} />
                <button
                  onClick={handleNext}
                  className="w-full bg-accent text-primary font-bold py-4 rounded-2xl text-lg hover:brightness-110 active:scale-[0.98] transition-all"
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
                <div className="w-32 h-32 rounded-full border-4 border-accent overflow-hidden bg-primary-light">
                  {userData.profilePic ? (
                    <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera size={40} className="text-accent/40" />
                    </div>
                  )}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-2">¡Todo listo, {userData.name}!</h1>
              <p className="text-sm text-center text-text-main/80 mb-12">Así es como funciona el registro de emociones</p>

              <div className="space-y-8 flex-1">
                <div className="flex items-start gap-6">
                  <span className="text-lg font-bold text-text-main/40 mt-1">1</span>
                  <div>
                    <h3 className="font-bold text-base">¿Cómo ha ido el día?</h3>
                    <p className="text-sm text-text-main/60">¡Registra tus emociones de una forma rápida y eficaz!</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <span className="text-lg font-bold text-text-main/40 mt-1">2</span>
                  <div>
                    <h3 className="font-bold text-base">¿Por qué te sientes así?</h3>
                    <p className="text-sm text-text-main/60">¡Visualiza tus cambios de ánimo y compréndete mejor!</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <span className="text-lg font-bold text-text-main/40 mt-1">3</span>
                  <div>
                    <h3 className="font-bold text-base">Reflexiona</h3>
                    <p className="text-sm text-text-main/60">Habla con nuestro asistente y pregúntale lo que se te pase por la cabeza</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl mb-8">
                <Info size={18} className="text-accent shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-text-main/60">
                  <span className="font-bold text-text-main/80">Privacidad total:</span> todos tus datos se guardan localmente y nadie nunca obtendrá acceso a tu información personal.
                </p>
              </div>

              <div className="mt-auto">
                <Pagination current={3} />
                <button
                  className="w-full bg-accent text-primary font-bold py-4 rounded-2xl text-lg hover:brightness-110 active:scale-[0.98] transition-all"
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
