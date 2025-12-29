
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { enhanceText, generateMeetingMinutes } from '../services/geminiService';
import { Meeting, MeetingStatus, AppSettings, MeetingDepartment, MeetingLocation } from '../types';
import { 
  LayoutDashboard, FileText, CheckCircle, Clock, 
  Settings as SettingsIcon, Plus, Trash2, 
  Printer, Search, User, Sparkles, PenTool,
  LogOut, Shield, Download, Upload, Activity,
  X, FileDown, FileJson, MapPin, Wand2, Calendar, 
  ChevronRight, AlignRight, Hash, UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

// --- Dictionary (Kept same) ---
const DICTIONARY = {
  ar: {
    dashboard: 'لوحة التحكم',
    editor: 'محرر المحاضر',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    secretary: 'سكرتير اللجنة',
    chairman: 'رئيس اللجنة',
    newMeeting: 'إنشاء محضر جديد',
    approved: 'معتمد',
    pending: 'قيد المراجعة',
    draft: 'مسودة',
    search: 'بحث...',
    title: 'العنوان',
    date: 'التاريخ',
    status: 'الحالة',
    actions: 'الإجراءات',
    saveDraft: 'حفظ كمسودة',
    submitApproval: 'إرسال للاعتماد',
    approve: 'اعتماد نهائي',
    attendees: 'الحضور',
    agenda: 'جدول الأعمال',
    decisions: 'القرارات والتوصيات',
    signature: 'التوقيع والاعتماد',
    filter_active: 'تصفية حسب:',
    clear_filter: 'عرض الكل'
  },
  en: {
    dashboard: 'Dashboard',
    editor: 'Meeting Editor',
    login: 'Login',
    logout: 'Logout',
    secretary: 'Secretary',
    chairman: 'Chairman',
    newMeeting: 'New Meeting',
    approved: 'Approved',
    pending: 'Pending',
    draft: 'Draft',
    search: 'Search...',
    title: 'Title',
    date: 'Date',
    status: 'Status',
    actions: 'Actions',
    saveDraft: 'Save Draft',
    submitApproval: 'Submit for Approval',
    approve: 'Final Approve',
    attendees: 'Attendees',
    agenda: 'Agenda',
    decisions: 'Decisions & Actions',
    signature: 'Signatures',
    filter_active: 'Filtered by:',
    clear_filter: 'Show All'
  }
};

// --- Helper Components (SignatureModal, AIEnhanceButton) ---

const SignatureModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (dataUrl: string) => void;
  title: string;
}> = ({ isOpen, onClose, onSave, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isOpen) {
        const timer = setTimeout(() => {
            const canvas = canvasRef.current;
            const container = canvas?.parentElement;
            if (canvas && container) {
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const handleClear = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
  };

  const handleSave = () => {
      if (canvasRef.current) {
          onSave(canvasRef.current.toDataURL());
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 print:hidden">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="p-6 bg-gray-50 flex-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-64 relative overflow-hidden cursor-crosshair">
                    <canvas 
                        ref={canvasRef}
                        className="w-full h-full touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none select-none bg-gray-100 px-2 py-1 rounded">
                        منطقة التوقيع
                    </div>
                </div>
            </div>

            <div className="p-4 border-t bg-white flex justify-between items-center gap-4">
                <button onClick={handleClear} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    مسح
                </button>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 font-medium transition-colors">
                        إلغاء
                    </button>
                    <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] font-bold shadow-lg transition-all active:scale-95">
                        اعتماد التوقيع
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

const AIEnhanceButton: React.FC<{ 
  text: string; 
  onEnhanced: (text: string) => void;
  context?: string;
  className?: string;
  lang?: 'ar' | 'en';
}> = ({ text, onEnhanced, context = "general", className, lang = 'ar' }) => {
  const [loading, setLoading] = useState(false);

  const handleEnhance = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const enhanced = await enhanceText(text, context, lang as 'ar' | 'en');
      onEnhanced(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleEnhance} 
      disabled={loading || !text}
      className={`p-1.5 text-[var(--color-primary)] bg-white/80 backdrop-blur-sm border border-[var(--color-primary)]/20 shadow-sm hover:bg-[var(--color-primary)]/10 rounded-lg transition-all disabled:opacity-50 ${className}`}
      title="تصحيح إملائي وتحسين الصياغة (AI)"
    >
      <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );
};

interface MahdarPlatformProps {
  createMeetingTrigger?: number;
  appSettings?: AppSettings;
}

const MahdarPlatform: React.FC<MahdarPlatformProps> = ({ createMeetingTrigger, appSettings }) => {
  // Global State
  const [role, setRole] = useState<'SECRETARY' | 'CHAIRMAN' | null>(null);
  const [view, setView] = useState<'DASHBOARD' | 'EDITOR' | 'VIEW'>('DASHBOARD');
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  
  // Data State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [departments, setDepartments] = useState<MeetingDepartment[]>([]);
  const [locations, setLocations] = useState<MeetingLocation[]>([]);
  const [stats, setStats] = useState({ draft: 0, pending: 0, approved: 0 });
  
  // Filter & Search State
  const [filterStatus, setFilterStatus] = useState<'ALL' | MeetingStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [settings, setSettings] = useState<AppSettings>(appSettings || {
    theme: 'default',
    font: 'Tajawal',
    language: 'ar',
    orgName: 'شئون المستشفيات'
  });

  const t = DICTIONARY[settings.language as 'ar' | 'en'];

  // Handle External Create Trigger
  useEffect(() => {
    if (createMeetingTrigger && createMeetingTrigger > 0) {
      if (!role) {
        setRole('SECRETARY');
      }
      setTimeout(() => {
          createNewMeeting();
      }, 0);
    }
  }, [createMeetingTrigger]);

  useEffect(() => {
    if (appSettings) setSettings(appSettings);
  }, [appSettings]);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      const allMeetings = await db.meetings.toArray();
      setMeetings(allMeetings.sort((a, b) => b.updatedAt - a.updatedAt));
      setStats({
        draft: allMeetings.filter(m => m.status === 'DRAFT').length,
        pending: allMeetings.filter(m => m.status === 'PENDING_APPROVAL').length,
        approved: allMeetings.filter(m => m.status === 'APPROVED').length,
      });

      setDepartments(await db.departments.toArray());
      setLocations(await db.locations.toArray());
    };
    loadData();
  }, [view, role]); 

  // Handlers
  const handleLogin = (selectedRole: 'SECRETARY' | 'CHAIRMAN') => {
    setRole(selectedRole);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentMeeting(null);
  };

  const createNewMeeting = () => {
    const newMeeting: Meeting = {
      refNumber: `MTG-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      location: locations.length > 0 ? locations[0].name : '',
      department: departments.length > 0 ? departments[0].name : '',
      status: 'DRAFT',
      attendees: [],
      agenda: [],
      decisions: [],
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setCurrentMeeting(newMeeting);
    setView('EDITOR');
  };

  const handleEdit = (m: Meeting) => {
    setCurrentMeeting(m);
    setView('EDITOR');
  };

  const handleView = (m: Meeting) => {
    setCurrentMeeting(m);
    setView('VIEW');
  };

  const handleDelete = async (id?: string) => {
    if (id && confirm('هل أنت متأكد من حذف هذا المحضر؟')) {
      await db.meetings.delete(id);
      const all = await db.meetings.toArray();
      setMeetings(all);
      if (view === 'VIEW') setView('DASHBOARD');
    }
  };

  const filteredMeetings = meetings.filter(m => {
    const matchesFilter = filterStatus === 'ALL' || m.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
                          m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.refNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // --- Views ---

  const LoginView = () => (
    <div className="h-full flex items-center justify-center">
      <div className="bg-[var(--color-card)] p-10 rounded-[2rem] shadow-xl max-w-md w-full text-center border border-gray-100/10">
        <div className="bg-[var(--color-primary)] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[var(--color-primary)]/30">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-[var(--color-text)] mb-2">منصة محضر</h2>
        <p className="text-[var(--color-text-sec)] mb-10">نظام إدارة وتوثيق الاجتماعات المؤسسي</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => handleLogin('SECRETARY')}
            className="w-full p-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
          >
            <PenTool className="w-5 h-5" />
            دخول: {t.secretary}
          </button>
          <button 
            onClick={() => handleLogin('CHAIRMAN')}
            className="w-full p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-slate-700 font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
          >
            <CheckCircle className="w-5 h-5" />
            دخول: {t.chairman}
          </button>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ label, count, icon: Icon, colorClass, bgClass, active, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`relative p-6 rounded-3xl cursor-pointer transition-all duration-300 border ${
            active 
            ? `ring-2 ring-offset-2 bg-[var(--color-card)] shadow-lg` 
            : 'bg-[var(--color-card)] border-transparent hover:border-[var(--color-primary)]/20 hover:shadow-md'
        } ${active ? 'border-[var(--color-primary)]' : ''}`}
        style={{ borderColor: active ? 'var(--color-primary)' : '' }}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[var(--color-text-sec)] text-sm font-medium mb-2">{label}</p>
                <h3 className={`text-4xl font-extrabold tracking-tight ${colorClass}`}>{count}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${bgClass}`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
        </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            label={t.approved} 
            count={stats.approved} 
            icon={CheckCircle} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-100" 
            active={filterStatus === 'APPROVED'}
            onClick={() => setFilterStatus(filterStatus === 'APPROVED' ? 'ALL' : 'APPROVED')}
        />
        <StatCard 
            label={t.pending} 
            count={stats.pending} 
            icon={Clock} 
            colorClass="text-amber-500" 
            bgClass="bg-amber-100" 
            active={filterStatus === 'PENDING_APPROVAL'}
            onClick={() => setFilterStatus(filterStatus === 'PENDING_APPROVAL' ? 'ALL' : 'PENDING_APPROVAL')}
        />
        <StatCard 
            label={t.draft} 
            count={stats.draft} 
            icon={FileText} 
            colorClass="text-slate-500" 
            bgClass="bg-slate-100" 
            active={filterStatus === 'DRAFT'}
            onClick={() => setFilterStatus(filterStatus === 'DRAFT' ? 'ALL' : 'DRAFT')}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table Section */}
        <div className="lg:col-span-2 bg-[var(--color-card)] rounded-[2rem] p-6 shadow-sm border border-gray-100/10">
             <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-[var(--color-text)] text-lg">سجل المحاضر</h3>
                  <div className="relative">
                      <Search className="w-4 h-4 absolute right-3 top-3 text-[var(--color-text-sec)]" />
                      <input 
                        type="text" 
                        placeholder={t.search} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-4 pr-10 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] w-48 transition-all focus:w-64" 
                      />
                  </div>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-[var(--color-text-sec)] text-xs uppercase tracking-wider text-right border-b border-gray-100">
                            <th className="pb-3 pr-2 font-semibold">المحضر</th>
                            <th className="pb-3 font-semibold">التاريخ</th>
                            <th className="pb-3 font-semibold">الحالة</th>
                            <th className="pb-3 pl-2 font-semibold text-left">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredMeetings.map(m => (
                            <tr key={m.id} className="group hover:bg-slate-50/80 transition-colors">
                                <td className="py-4 pr-2">
                                    <div className="font-bold text-[var(--color-text)]">{m.title || 'بدون عنوان'}</div>
                                    <div className="text-[10px] text-[var(--color-text-sec)] font-mono mt-1">{m.refNumber}</div>
                                </td>
                                <td className="py-4 text-sm text-[var(--color-text-sec)]">{m.date}</td>
                                <td className="py-4">
                                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                        m.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' :
                                        m.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            m.status === 'APPROVED' ? 'bg-emerald-500' :
                                            m.status === 'PENDING_APPROVAL' ? 'bg-amber-500' :
                                            'bg-slate-400'
                                        }`}></span>
                                        {m.status === 'APPROVED' ? t.approved : m.status === 'PENDING_APPROVAL' ? t.pending : t.draft}
                                    </span>
                                </td>
                                <td className="py-4 pl-2 text-left">
                                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleView(m)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] shadow-sm transition-colors">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        {role === 'SECRETARY' && m.status === 'DRAFT' && (
                                            <button onClick={() => handleEdit(m)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-600 shadow-sm transition-colors">
                                                <PenTool className="w-4 h-4" />
                                            </button>
                                        )}
                                     </div>
                                </td>
                            </tr>
                        ))}
                        {filteredMeetings.length === 0 && (
                            <tr><td colSpan={4} className="py-8 text-center text-[var(--color-text-sec)] italic">لا توجد بيانات</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>

        {/* Side Panel (Charts/Actions) */}
        <div className="space-y-6">
            <div className="bg-[var(--color-card)] rounded-[2rem] p-6 shadow-sm border border-gray-100/10">
                <h3 className="font-bold text-[var(--color-text)] mb-6">نظرة عامة</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: t.approved, value: stats.approved, color: '#059669' },
                        { name: t.pending, value: stats.pending, color: '#d97706' },
                        { name: t.draft, value: stats.draft, color: '#94a3b8' },
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                            {[{ color: '#059669' }, { color: '#d97706' }, { color: '#94a3b8' }].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {role === 'SECRETARY' && (
                <div className="bg-[var(--color-sidebar)] rounded-[2rem] p-6 text-white shadow-xl shadow-[var(--color-primary)]/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold text-xl mb-2">اجتماع جديد؟</h3>
                        <p className="text-white/70 text-sm mb-6">ابدأ بتوثيق محضر جديد باستخدام الذكاء الاصطناعي.</p>
                        <button 
                            onClick={createNewMeeting} 
                            className="w-full py-3 bg-white text-[var(--color-sidebar)] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            {t.newMeeting}
                        </button>
                    </div>
                    <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-[var(--color-primary)]/40 rounded-full blur-xl"></div>
                </div>
            )}
        </div>

      </div>
    </div>
  );

  const EditorView = () => {
    if (!currentMeeting) return null;
    const [formData, setFormData] = useState<Meeting>(currentMeeting);
    const [activeSection, setActiveSection] = useState('info');
    
    // Unified Signature State
    const [activeSignature, setActiveSignature] = useState<{
        field: 'secretary' | 'chairman' | 'attendee',
        attendeeId?: string
    } | null>(null);

    const [isAIImportOpen, setIsAIImportOpen] = useState(false);
    const [rawNotes, setRawNotes] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const updateField = (field: keyof Meeting, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDeptChange = async (deptName: string) => {
        const dept = departments.find(d => d.name === deptName);
        let newAttendees = [...formData.attendees];
        if (dept && dept.defaultAttendees.length > 0) {
            if (confirm('هل تريد استيراد قائمة الحضور الافتراضية لهذا القسم؟')) {
                 newAttendees = [...dept.defaultAttendees.map(a => ({...a, id: Date.now().toString() + Math.random()}))];
            }
        }
        setFormData(prev => ({ ...prev, department: deptName, attendees: newAttendees }));
    };

    const handleSignatureSave = (dataUrl: string) => {
        if (activeSignature?.field === 'secretary') {
            updateField('secretarySignature', dataUrl);
        } else if (activeSignature?.field === 'attendee' && activeSignature.attendeeId) {
            const newAtts = formData.attendees.map(a => 
                a.id === activeSignature.attendeeId ? { ...a, signature: dataUrl } : a
            );
            updateField('attendees', newAtts);
        }
        setActiveSignature(null);
    };

    const handleSaveDraft = async () => {
       if (formData.id) {
           await db.meetings.update(formData.id, { ...formData, updatedAt: Date.now() });
       } else {
           await db.meetings.add({ ...formData, updatedAt: Date.now() });
       }
       setView('DASHBOARD');
    };

    const handleSubmitForApproval = async () => {
       if (!formData.secretarySignature) {
           alert("يجب توقيع المحضر قبل إرساله للاعتماد.");
           return;
       }
       const updated = { ...formData, status: 'PENDING_APPROVAL' as MeetingStatus, updatedAt: Date.now() };
       if (formData.id) {
           await db.meetings.update(formData.id, updated);
       } else {
           await db.meetings.add(updated);
       }
       setView('DASHBOARD');
    };

    // (AI Handler kept same)
    const handleAIImport = async () => {
      if (!rawNotes.trim()) return;
      setIsImporting(true);
      try {
        const jsonStr = await generateMeetingMinutes(rawNotes);
        const data = JSON.parse(jsonStr);
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          date: data.date || prev.date,
          attendees: data.attendees ? data.attendees.map((a: any) => ({...a, id: Date.now() + Math.random().toString()})) : prev.attendees,
          decisions: data.decisions ? data.decisions.map((d: any) => ({...d, id: Date.now() + Math.random().toString()})) : prev.decisions,
          agenda: data.agenda ? data.agenda.map((a: any) => ({...a, id: Date.now() + Math.random().toString()})) : prev.agenda,
        }));
        setIsAIImportOpen(false);
        setRawNotes('');
      } catch (e) {
        console.error("AI Import Failed", e);
        alert('حدث خطأ أثناء المعالجة.');
      } finally {
        setIsImporting(false);
      }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-card)] rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100/10">
            {/* Top Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <LogOut className="w-5 h-5 rotate-180" />
                    </button>
                    <div className="h-8 w-px bg-slate-200"></div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 leading-none">{t.editor}</h2>
                        <span className="text-xs text-slate-400 font-mono tracking-wider">{formData.refNumber}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                      onClick={() => setIsAIImportOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-[var(--color-primary)] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all active:scale-95"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span className="hidden sm:inline">AI توليد</span>
                    </button>
                    <button onClick={handleSaveDraft} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-bold transition-all">
                        {t.saveDraft}
                    </button>
                    <button onClick={handleSubmitForApproval} className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 text-sm font-bold flex items-center gap-2 transition-all">
                        <CheckCircle className="w-4 h-4" />
                        {t.submitApproval}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Side Navigation */}
                <div className="w-64 bg-slate-50 border-l border-slate-200 flex flex-col pt-6 px-3 gap-1 overflow-y-auto hidden md:flex">
                    {[
                        { id: 'info', label: t.title, icon: FileText },
                        { id: 'attendees', label: t.attendees, icon: User },
                        { id: 'agenda', label: t.agenda, icon: Clock },
                        { id: 'decisions', label: t.decisions, icon: CheckCircle },
                        { id: 'sign', label: t.signature, icon: PenTool },
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full text-right px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${
                                activeSection === item.id 
                                ? 'bg-white text-[var(--color-primary)] shadow-sm ring-1 ring-slate-100' 
                                : 'text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-[var(--color-primary)]' : 'text-slate-400'}`} />
                            {item.label}
                            {activeSection === item.id && <ChevronRight className="w-4 h-4 mr-auto text-[var(--color-primary)]" />}
                        </button>
                    ))}
                </div>

                {/* Main Edit Area - "The Paper" */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/50">
                    <div className="max-w-3xl mx-auto bg-white rounded-[1.5rem] shadow-sm border border-slate-200 min-h-[800px] p-8 md:p-12 relative">
                        {/* Watermark-like background */}
                        <div className="absolute top-10 left-10 opacity-[0.03] pointer-events-none">
                            <Shield className="w-64 h-64" />
                        </div>

                        {activeSection === 'info' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="border-b pb-4 mb-4">
                                    <h2 className="text-2xl font-bold text-slate-800">بيانات الاجتماع الأساسية</h2>
                                    <p className="text-slate-500 text-sm mt-1">يرجى تعبئة التفاصيل بدقة لضمان صحة المحضر.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="relative group">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">عنوان الاجتماع</label>
                                        <input 
                                            type="text" 
                                            value={formData.title} 
                                            onChange={e => updateField('title', e.target.value)}
                                            className="w-full p-4 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all"
                                            placeholder="مثال: الاجتماع الدوري لمناقشة الميزانية..."
                                        />
                                        <div className="absolute left-3 top-9">
                                            <AIEnhanceButton 
                                                text={formData.title} 
                                                onEnhanced={t => updateField('title', t)} 
                                                context="meeting title"
                                                lang={settings.language === 'en' ? 'en' : 'ar'}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">التاريخ</label>
                                            <div className="relative">
                                                <input type="date" value={formData.date} onChange={e => updateField('date', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" />
                                                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">القاعة</label>
                                            <input 
                                                type="text" 
                                                list="locations-list"
                                                value={formData.location} 
                                                onChange={e => updateField('location', e.target.value)} 
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" 
                                                placeholder="اختر القاعة..."
                                            />
                                            <datalist id="locations-list">
                                                {locations.map(loc => <option key={loc.id} value={loc.name} />)}
                                            </datalist>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">وقت البدء</label>
                                            <input type="time" value={formData.startTime} onChange={e => updateField('startTime', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">وقت الانتهاء</label>
                                            <input type="time" value={formData.endTime} onChange={e => updateField('endTime', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">القسم المسؤول</label>
                                        <select 
                                            value={formData.department} 
                                            onChange={e => handleDeptChange(e.target.value)} 
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                                        >
                                            <option value="">اختر القسم...</option>
                                            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'attendees' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <h2 className="text-2xl font-bold text-slate-800">قائمة الحضور</h2>
                                    <button 
                                        onClick={() => updateField('attendees', [...formData.attendees, { id: Date.now().toString(), name: '', title: '', type: 'INTERNAL', isPresent: true }])}
                                        className="text-sm bg-indigo-50 text-[var(--color-primary)] px-4 py-2 rounded-lg hover:bg-indigo-100 font-bold flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> إضافة مشارك
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.attendees.map((att, idx) => (
                                        <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[var(--color-primary)] font-bold text-xs">
                                                {idx + 1}
                                            </div>
                                            <input 
                                                type="text" placeholder="الاسم" 
                                                value={att.name} 
                                                onChange={e => {
                                                    const newAtts = [...formData.attendees];
                                                    newAtts[idx].name = e.target.value;
                                                    updateField('attendees', newAtts);
                                                }}
                                                className="flex-1 p-2 bg-transparent border-b border-transparent focus:border-indigo-300 focus:outline-none text-sm font-medium"
                                            />
                                            <input 
                                                type="text" placeholder="المسمى" 
                                                value={att.title} 
                                                onChange={e => {
                                                    const newAtts = [...formData.attendees];
                                                    newAtts[idx].title = e.target.value;
                                                    updateField('attendees', newAtts);
                                                }}
                                                className="flex-1 p-2 bg-transparent border-b border-transparent focus:border-indigo-300 focus:outline-none text-sm"
                                            />
                                            
                                            {/* Signature Trigger */}
                                            {att.signature ? (
                                                <div className="relative group/sig">
                                                    <img src={att.signature} alt="Signed" className="h-8 w-16 object-contain border rounded bg-white" />
                                                    <button 
                                                        onClick={() => {
                                                             const newAtts = [...formData.attendees];
                                                             newAtts[idx].signature = undefined;
                                                             updateField('attendees', newAtts);
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover/sig:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setActiveSignature({ field: 'attendee', attendeeId: att.id })}
                                                    className="p-2 text-slate-300 hover:text-[var(--color-primary)] hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="إضافة توقيع"
                                                >
                                                    <PenTool className="w-4 h-4" />
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => {
                                                    const newAtts = formData.attendees.filter((_, i) => i !== idx);
                                                    updateField('attendees', newAtts);
                                                }}
                                                className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}

                        {activeSection === 'agenda' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <h2 className="text-2xl font-bold text-slate-800">جدول الأعمال</h2>
                                    <button 
                                        onClick={() => updateField('agenda', [...formData.agenda, { id: Date.now().toString(), title: '', presenter: '', duration: '' }])}
                                        className="text-sm bg-indigo-50 text-[var(--color-primary)] px-4 py-2 rounded-lg hover:bg-indigo-100 font-bold flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> بند جديد
                                    </button>
                                </div>
                                
                                {/* Datalist for Presenters based on Attendees */}
                                <datalist id="attendees-list">
                                    {formData.attendees.map(att => (
                                        <option key={att.id} value={att.name}>{att.title}</option>
                                    ))}
                                </datalist>

                                <div className="space-y-4">
                                     {formData.agenda.map((item, idx) => (
                                        <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 relative group hover:shadow-md transition-shadow">
                                            <div className="flex gap-2 relative">
                                                <span className="text-slate-300 font-bold text-xl select-none">#{idx + 1}</span>
                                                <input 
                                                    type="text" 
                                                    placeholder="عنوان الموضوع للنقاش" 
                                                    value={item.title} 
                                                    onChange={e => {
                                                        const newAgenda = [...formData.agenda];
                                                        newAgenda[idx].title = e.target.value;
                                                        updateField('agenda', newAgenda);
                                                    }}
                                                    className="w-full p-2 bg-transparent border-b border-slate-200 focus:border-[var(--color-primary)] text-lg font-bold text-slate-800 focus:outline-none placeholder-slate-300"
                                                />
                                                <div className="absolute left-10 top-2">
                                                    <AIEnhanceButton 
                                                        text={item.title} 
                                                        onEnhanced={t => {
                                                            const newAgenda = [...formData.agenda];
                                                            newAgenda[idx].title = t;
                                                            updateField('agenda', newAgenda);
                                                        }}
                                                        context="agenda item title"
                                                        lang={settings.language === 'en' ? 'en' : 'ar'}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-4 pl-8">
                                                <div className="flex items-center gap-2 flex-1 bg-white p-2 rounded-lg border border-slate-100">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="text" placeholder="المتحدث" 
                                                        list="attendees-list"
                                                        value={item.presenter} 
                                                        onChange={e => {
                                                            const newAgenda = [...formData.agenda];
                                                            newAgenda[idx].presenter = e.target.value;
                                                            updateField('agenda', newAgenda);
                                                        }}
                                                        className="w-full text-sm bg-transparent focus:outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 w-32 bg-white p-2 rounded-lg border border-slate-100">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="text" placeholder="المدة" 
                                                        value={item.duration} 
                                                        onChange={e => {
                                                            const newAgenda = [...formData.agenda];
                                                            newAgenda[idx].duration = e.target.value;
                                                            updateField('agenda', newAgenda);
                                                        }}
                                                        className="w-full text-sm bg-transparent focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const newAgenda = formData.agenda.filter((_, i) => i !== idx);
                                                    updateField('agenda', newAgenda);
                                                }}
                                                className="absolute top-4 left-4 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                     ))}
                                </div>
                            </div>
                        )}

                        {activeSection === 'decisions' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <h2 className="text-2xl font-bold text-slate-800">القرارات والتوصيات</h2>
                                    <button 
                                        onClick={() => updateField('decisions', [...formData.decisions, { id: Date.now().toString(), text: '', type: 'DECISION', assignee: '', dueDate: '' }])}
                                        className="text-sm bg-indigo-50 text-[var(--color-primary)] px-4 py-2 rounded-lg hover:bg-indigo-100 font-bold flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> إضافة
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {formData.decisions.map((dec, idx) => (
                                        <div key={idx} className={`p-5 rounded-2xl border transition-all ${dec.type === 'DECISION' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                            <div className="flex gap-3 mb-3">
                                                <select 
                                                    value={dec.type}
                                                    onChange={e => {
                                                        const newDecs = [...formData.decisions];
                                                        newDecs[idx].type = e.target.value as any;
                                                        updateField('decisions', newDecs);
                                                    }}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border-none focus:ring-0 ${dec.type === 'DECISION' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                                                >
                                                    <option value="DECISION">قرار</option>
                                                    <option value="ACTION">توصية</option>
                                                </select>
                                                
                                                <div className="flex-1 flex gap-2">
                                                    <input 
                                                        type="text" placeholder="المسؤول عن التنفيذ" 
                                                        value={dec.assignee || ''} 
                                                        onChange={e => {
                                                            const newDecs = [...formData.decisions];
                                                            newDecs[idx].assignee = e.target.value;
                                                            updateField('decisions', newDecs);
                                                        }}
                                                        className="flex-1 bg-white border border-slate-200 rounded-lg text-xs px-2 py-1"
                                                    />
                                                    <input 
                                                        type="date" 
                                                        value={dec.dueDate || ''} 
                                                        onChange={e => {
                                                            const newDecs = [...formData.decisions];
                                                            newDecs[idx].dueDate = e.target.value;
                                                            updateField('decisions', newDecs);
                                                        }}
                                                        className="bg-white border border-slate-200 rounded-lg text-xs px-2 py-1 w-32"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newDecs = formData.decisions.filter((_, i) => i !== idx);
                                                        updateField('decisions', newDecs);
                                                    }}
                                                    className="text-slate-400 hover:text-red-500"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <textarea 
                                                    placeholder="نص القرار..." 
                                                    value={dec.text} 
                                                    onChange={e => {
                                                        const newDecs = [...formData.decisions];
                                                        newDecs[idx].text = e.target.value;
                                                        updateField('decisions', newDecs);
                                                    }}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm leading-relaxed h-24 resize-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                                />
                                                <div className="absolute left-2 bottom-2">
                                                    <AIEnhanceButton 
                                                        text={dec.text} 
                                                        onEnhanced={t => {
                                                            const newDecs = [...formData.decisions];
                                                            newDecs[idx].text = t;
                                                            updateField('decisions', newDecs);
                                                        }}
                                                        context="meeting decision"
                                                        lang={settings.language === 'en' ? 'en' : 'ar'}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}

                        {activeSection === 'sign' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <h2 className="text-2xl font-bold text-slate-800 border-b pb-4 mb-8">التوقيع والاعتماد</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">سكرتير اللجنة</p>
                                        {formData.secretarySignature ? (
                                            <div className="relative group">
                                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-3">
                                                     <img src={formData.secretarySignature} className="mx-auto h-24 object-contain" alt="Signature" />
                                                </div>
                                                <button 
                                                    onClick={() => updateField('secretarySignature', undefined)}
                                                    className="text-xs text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                                                >
                                                    حذف التوقيع
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setActiveSignature({ field: 'secretary' })}
                                                className="w-full h-40 border-2 border-dashed border-indigo-200 rounded-xl flex flex-col items-center justify-center text-[var(--color-primary)] hover:bg-indigo-50 hover:border-[var(--color-primary)] transition-all gap-2 bg-white"
                                            >
                                                <PenTool className="w-8 h-8" />
                                                <span className="font-bold">اضغط للتوقيع</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center opacity-60">
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">رئيس اللجنة (الاعتماد)</p>
                                        <div className="w-full h-40 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm italic bg-white">
                                            يتم التوقيع بعد الإرسال
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                </div>
            </div>
            
            <SignatureModal 
                isOpen={!!activeSignature}
                onClose={() => setActiveSignature(null)}
                onSave={handleSignatureSave}
                title={activeSignature?.field === 'attendee' ? "توقيع الحضور" : "توقيع سكرتير اللجنة"}
            />
            
            {/* AI Import Modal (Visual Refresh) */}
            {isAIImportOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border border-white/20">
                        <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-[var(--color-primary)]" />
                                الذكاء الاصطناعي
                            </h3>
                            <button onClick={() => setIsAIImportOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <div className="p-8">
                            <p className="text-slate-600 mb-4 leading-relaxed">
                                يمكنك توليد محضر كامل بمجرد لصق ملاحظاتك الخام أو مسودة سريعة أدناه. سيقوم النظام باستخراج العناوين، والتواريخ، والقرارات تلقائياً.
                            </p>
                            <textarea 
                                className="w-full h-48 p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-[var(--color-primary)] text-sm leading-relaxed transition-all resize-none shadow-inner"
                                placeholder="مثال: اجتمع الفريق اليوم لمناقشة الخطة السنوية..."
                                value={rawNotes}
                                onChange={(e) => setRawNotes(e.target.value)}
                            />
                        </div>
                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                             <button onClick={() => setIsAIImportOpen(false)} className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-200 font-bold transition-colors">إلغاء</button>
                             <button 
                                onClick={handleAIImport}
                                disabled={isImporting || !rawNotes.trim()}
                                className="px-8 py-3 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 flex items-center gap-2 font-bold shadow-lg transition-all active:scale-95"
                             >
                                {isImporting ? <span className="animate-spin">⏳</span> : <Wand2 className="w-5 h-5" />}
                                بدء التوليد
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const ViewerAndApprovalView = () => {
    if (!currentMeeting) return null;
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    const handleApprove = async (signatureData: string) => {
        const updated = { 
            ...currentMeeting, 
            status: 'APPROVED' as MeetingStatus, 
            updatedAt: Date.now(),
            chairmanSignature: signatureData
        };
        if (updated.id) {
            await db.meetings.update(updated.id, updated);
            setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
            setCurrentMeeting(updated);
            alert('تم اعتماد المحضر بنجاح');
            setView('DASHBOARD');
        }
    };

    const handleExportPDF = () => {
        const element = document.getElementById('meeting-report-content');
        if (element && (window as any).html2pdf) {
            const safeRef = currentMeeting.refNumber.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const opt = {
              margin: [10, 10],
              filename: `meeting_${safeRef}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            (window as any).html2pdf().set(opt).from(element).save();
        } else {
            alert('PDF generation library not loaded or content not found.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-card)] rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100/10">
             <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center print:hidden z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <LogOut className="w-5 h-5 rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{t.approved}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${currentMeeting.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            <span className="text-xs text-slate-500">{currentMeeting.status === 'APPROVED' ? t.approved : t.draft}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                     <button onClick={handleExportPDF} className="px-4 py-2.5 text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-xl flex items-center gap-2 transition-colors font-bold text-sm" title="تصدير PDF">
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">تصدير PDF</span>
                    </button>
                    <button onClick={() => window.print()} className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2 transition-colors" title="طباعة">
                        <Printer className="w-5 h-5" />
                    </button>
                    <div className="w-px h-8 bg-slate-200 mx-2"></div>
                    {role === 'CHAIRMAN' && currentMeeting.status === 'PENDING_APPROVAL' && (
                        <button onClick={() => setIsApproveModalOpen(true)} className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-bold shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all active:scale-95">
                            <CheckCircle className="w-4 h-4" />
                            {t.approve}
                        </button>
                    )}
                    <button onClick={() => handleDelete(currentMeeting.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 print:p-0 bg-slate-100/50">
                <div id="meeting-report-content" className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[15mm] min-h-[297mm] print:shadow-none print:w-full print:max-w-none print:h-auto print-layout relative rounded-sm">
                    {/* (Report Content Structure Kept Same - Just classes cleaned up slightly if needed, but standard print CSS handles most) */}
                    <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">{settings.orgName}</h1>
                            <p className="text-sm">{currentMeeting.department}</p>
                        </div>
                        {settings.orgLogo && (
                             <img src={settings.orgLogo} alt="Logo" className="h-16 object-contain" />
                        )}
                        <div className="text-left text-sm">
                            <p><strong>الرقم المرجعي:</strong> {currentMeeting.refNumber}</p>
                            <p><strong>التاريخ:</strong> {currentMeeting.date}</p>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold underline underline-offset-4">{currentMeeting.title}</h2>
                    </div>

                    <table className="w-full mb-8 border border-black text-sm">
                        <tbody>
                            <tr>
                                <td className="p-2 border border-black bg-gray-50 font-bold w-1/4">الوقت</td>
                                <td className="p-2 border border-black">{currentMeeting.startTime} - {currentMeeting.endTime}</td>
                                <td className="p-2 border border-black bg-gray-50 font-bold w-1/4">الموقع</td>
                                <td className="p-2 border border-black">{currentMeeting.location}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="mb-6">
                        <h3 className="font-bold border-b border-gray-300 mb-2 pb-1">1. {t.attendees}</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                             {currentMeeting.attendees.map((att, i) => (
                                 <div key={i} className="flex justify-between items-end border-b border-gray-100 pb-1">
                                     <div>
                                        <div className="font-bold">{att.name}</div>
                                        <div className="text-xs text-gray-500">{att.title}</div>
                                     </div>
                                     {att.signature && (
                                         <img src={att.signature} alt="Sign" className="h-8 max-w-[80px] object-contain" />
                                     )}
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-bold border-b border-gray-300 mb-2 pb-1">2. {t.agenda}</h3>
                         <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border p-2 text-right">م</th>
                                    <th className="border p-2 text-right">الموضوع</th>
                                    <th className="border p-2 text-right">المتحدث</th>
                                    <th className="border p-2 text-center">المدة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentMeeting.agenda.map((item, i) => (
                                    <tr key={i}>
                                        <td className="border p-2">{i+1}</td>
                                        <td className="border p-2">{item.title}</td>
                                        <td className="border p-2">{item.presenter}</td>
                                        <td className="border p-2 text-center">{item.duration}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-12">
                        <h3 className="font-bold border-b border-gray-300 mb-2 pb-1">3. {t.decisions}</h3>
                        <ul className="space-y-3 text-sm">
                            {currentMeeting.decisions.map((dec, i) => (
                                <li key={i} className="flex flex-col gap-1 border-b border-dashed border-gray-200 pb-2 last:border-0">
                                    <div className="flex items-start gap-2">
                                        <span className={`mt-1 font-bold px-2 py-0.5 rounded text-[10px] border ${dec.type === 'DECISION' ? 'bg-gray-100 border-gray-400' : 'bg-white border-black'}`}>
                                            {dec.type === 'DECISION' ? 'قرار' : 'توصية'}
                                        </span>
                                        <p className="flex-1 leading-relaxed text-justify">{dec.text}</p>
                                    </div>
                                    {(dec.assignee || dec.dueDate) && (
                                        <div className="flex gap-4 text-xs text-gray-500 mr-12">
                                            {dec.assignee && <span><strong>المسؤول:</strong> {dec.assignee}</span>}
                                            {dec.dueDate && <span><strong>تاريخ الاستحقاق:</strong> {dec.dueDate}</span>}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mt-auto pt-12 break-inside-avoid">
                        <div className="text-center">
                            <p className="font-bold mb-4">معد المحضر</p>
                            {currentMeeting.secretarySignature && (
                                <img src={currentMeeting.secretarySignature} className="h-20 mx-auto object-contain" alt="Signature" />
                            )}
                            <p className="mt-2 text-sm text-gray-500">سكرتير اللجنة</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold mb-4">يعتمد، رئيس اللجنة</p>
                            {currentMeeting.chairmanSignature ? (
                                <img src={currentMeeting.chairmanSignature} className="h-20 mx-auto object-contain" alt="Signature" />
                            ) : (
                                <div className="h-20 flex items-center justify-center text-gray-300 text-xs italic border border-dashed border-gray-200 rounded">
                                    بانتظار الاعتماد
                                </div>
                            )}
                            <p className="mt-2 text-sm text-gray-500">مدير الإدارة</p>
                        </div>
                    </div>
                </div>
            </div>

            <SignatureModal 
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                onSave={handleApprove}
                title="اعتماد وتوقيع رئيس اللجنة"
            />
        </div>
    );
  };

  if (!role) {
    return (
        <div className="h-full flex items-center justify-center p-4">
            <LoginView />
        </div>
    );
  }

  return (
    <div className="h-full">
        {view === 'DASHBOARD' && <DashboardView />}
        {view === 'EDITOR' && <EditorView />}
        {view === 'VIEW' && <ViewerAndApprovalView />}
    </div>
  );
};

export default MahdarPlatform;
