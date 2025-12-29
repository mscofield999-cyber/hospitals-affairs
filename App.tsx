
import React, { useState, useEffect } from 'react';
import { Department, AppSettings } from './types';
import DepartmentCard from './components/DepartmentCard';
import MeetingTools from './components/MeetingTools';
import SettingsPage from './components/SettingsPage';
import { db } from './services/db';
import { 
  LayoutDashboard, FileText, Menu, Settings, 
  PlusCircle, Activity, ChevronLeft, X, LogOut, Plus 
} from 'lucide-react';

const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: '1',
    name: 'الاحالة والمواعيد',
    description: 'إدارة وتنسيق تحويلات المرضى بين المستشفيات وجدولة المواعيد المركزية.',
    tasks: ['متابعة طلبات الإحالة', 'جدولة المواعيد الحرجة', 'تنسيق النقل الاسعافي'],
    color: 'border-blue-500',
    icon: 'referral',
    visits: [
        { id: 'v1', hospitalName: 'مستشفى الملك فهد', date: '2023-11-15', status: 'scheduled' },
        { id: 'v2', hospitalName: 'مستشفى الولادة', date: '2023-11-20', status: 'pending' }
    ],
    kpis: [
        { name: 'قبول الإحالات', target: 100, current: 85, unit: '%' },
        { name: 'رضا المرضى', target: 90, current: 78, unit: '%' }
    ]
  },
  {
    id: '2',
    name: 'المراكز المتخصصة',
    description: 'الإشراف على مراكز التميز الطبية (القلب، الأورام، السكري).',
    tasks: ['اعتماد المعايير المهنية', 'تطوير البروتوكولات العلاجية', 'مراقبة الجودة النوعية'],
    color: 'border-purple-500',
    icon: 'centers',
    visits: [
        { id: 'v3', hospitalName: 'مركز القلب', date: '2023-11-18', status: 'completed' }
    ],
    kpis: [
        { name: 'توفر الأخصائيين', target: 100, current: 92, unit: '%' },
        { name: 'تجهيزات المراكز', target: 100, current: 60, unit: '%' }
    ]
  },
  {
    id: '3',
    name: 'الوفيات (البيانات)',
    description: 'رصد وتحليل بيانات الوفيات والمراضة لرفع مستوى السلامة.',
    tasks: ['مراجعة ملفات الوفيات', 'إصدار التقارير الاحصائية', 'لجان المراضة والوفيات'],
    color: 'border-rose-500',
    icon: 'mortality',
    visits: [],
    kpis: [
        { name: 'اكتمال التقارير', target: 100, current: 98, unit: '%' },
        { name: 'زمن الإغلاق', target: 100, current: 80, unit: '%' }
    ]
  },
  {
    id: '4',
    name: 'الطاقة الاستيعابية',
    description: 'إدارة الأسرة وتوزيع الموارد لضمان الاستخدام الأمثل.',
    tasks: ['إدارة الأسرة الشاغرة', 'تخطيط خروج المرضى', 'إدارة الأزمات والكوارث'],
    color: 'border-emerald-500',
    icon: 'capacity',
    visits: [
        { id: 'v4', hospitalName: 'المستشفى العام', date: '2023-12-01', status: 'scheduled' }
    ],
    kpis: [
        { name: 'شغل الأسرة', target: 85, current: 90, unit: '%' },
        { name: 'دوران السرير', target: 80, current: 70, unit: '%' }
    ]
  },
  {
    id: '5',
    name: 'الإدارة المناوبة',
    description: 'ضمان استمرارية العمل الإداري والتشغيلي خارج أوقات الدوام.',
    tasks: ['حل المشاكل الطارئة', 'الإشراف على الكادر المناوب', 'رفع التقارير اليومية'],
    color: 'border-amber-500',
    icon: 'duty',
    visits: [
        { id: 'v5', hospitalName: 'جولة مسائية - المركزي', date: '2023-11-14', status: 'completed' }
    ],
    kpis: [
        { name: 'الاستجابة للبلاغات', target: 100, current: 95, unit: '%' },
        { name: 'الحضور', target: 100, current: 100, unit: '%' }
    ]
  },
  {
    id: '6',
    name: 'إدارة المشاريع',
    description: 'متابعة مشاريع التحسين والتطوير والإنشاءات.',
    tasks: ['تتبع الجدول الزمني', 'إدارة الميزانيات', 'تقييم المخاطر'],
    color: 'border-cyan-500',
    icon: 'projects',
    visits: [
         { id: 'v6', hospitalName: 'توسعة الطوارئ', date: '2023-11-30', status: 'scheduled' }
    ],
    kpis: [
        { name: 'إنجاز المشاريع', target: 100, current: 45, unit: '%' },
        { name: 'صرف الميزانية', target: 50, current: 48, unit: '%' }
    ]
  }
];

const App: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meeting' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [createMeetingTrigger, setCreateMeetingTrigger] = useState(0);
  
  // App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'default',
    font: 'Tajawal',
    language: 'ar',
    orgName: 'شئون المستشفيات'
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Load Settings from DB
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await db.settings.toArray();
        if (saved.length > 0) {
          setAppSettings(saved[0]);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    loadSettings();
  }, [refreshKey]);

  // Apply Global Theme and CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    
    // 1. Fonts & Direction
    root.style.setProperty('--font-primary', appSettings.font === 'Inter' ? "'Inter', sans-serif" : appSettings.font === 'Cairo' ? "'Cairo', sans-serif" : appSettings.font === 'IBM Plex Sans Arabic' ? "'IBM Plex Sans Arabic', sans-serif" : "'Tajawal', sans-serif");
    root.dir = appSettings.language === 'ar' ? 'rtl' : 'ltr';
    root.lang = appSettings.language;

    // 2. Color Themes Definitions
    const themes = {
      default: { 
        primary: '#4f46e5', primaryHover: '#4338ca', 
        sidebar: '#1e1b4b', bg: '#F3F5F9', card: '#ffffff', 
        text: '#1e293b', textSec: '#64748b' 
      },
      dark: { 
        primary: '#6366f1', primaryHover: '#818cf8', 
        sidebar: '#020617', bg: '#0f172a', card: '#1e293b', 
        text: '#f8fafc', textSec: '#94a3b8' 
      },
      forest: { 
        primary: '#059669', primaryHover: '#047857', 
        sidebar: '#064e3b', bg: '#ecfdf5', card: '#ffffff', 
        text: '#064e3b', textSec: '#047857' 
      },
      midnight: { 
        primary: '#3b82f6', primaryHover: '#2563eb', 
        sidebar: '#000000', bg: '#1e293b', card: '#111827', 
        text: '#e2e8f0', textSec: '#94a3b8' 
      },
      corporate: { 
        primary: '#475569', primaryHover: '#334155', 
        sidebar: '#0f172a', bg: '#f1f5f9', card: '#ffffff', 
        text: '#0f172a', textSec: '#475569' 
      }
    };

    const currentTheme = themes[appSettings.theme] || themes.default;
    
    // 3. Set Variables
    root.style.setProperty('--color-primary', currentTheme.primary);
    root.style.setProperty('--color-primary-hover', currentTheme.primaryHover);
    root.style.setProperty('--color-sidebar', currentTheme.sidebar);
    root.style.setProperty('--color-bg', currentTheme.bg);
    root.style.setProperty('--color-card', currentTheme.card);
    root.style.setProperty('--color-text', currentTheme.text);
    root.style.setProperty('--color-text-sec', currentTheme.textSec);

  }, [appSettings]);

  const handleUpdateDepartment = (updatedDept: Department) => {
    setDepartments(prevDepts => 
      prevDepts.map(d => d.id === updatedDept.id ? updatedDept : d)
    );
  };

  const handleDeleteDepartment = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم وجميع بياناته (المهام، الزيارات، المؤشرات)؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      setDepartments(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleAddDepartment = () => {
    const newDept: Department = {
        id: Date.now().toString(),
        name: 'إدارة جديدة',
        description: 'يرجى تحرير القسم لإضافة الوصف والمهام...',
        tasks: [],
        visits: [],
        kpis: [],
        color: 'border-slate-500',
        icon: 'briefcase'
    };
    setDepartments(prev => [...prev, newDept]);
  };

  const triggerNewMeeting = () => {
    setActiveTab('meeting');
    setCreateMeetingTrigger(prev => prev + 1);
    setIsSidebarOpen(false);
  };

  const handleSettingsChanged = () => {
    setRefreshKey(prev => prev + 1);
  };

  const NavItem = ({ id, label, icon: Icon }: any) => (
    <button 
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative
        ${activeTab === id 
          ? 'bg-white/10 text-white shadow-inner font-bold' 
          : 'text-[var(--color-text-sec)] md:text-indigo-200 hover:bg-white/5 hover:text-white'
        }
      `}
    >
       <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === id ? 'text-white' : 'text-[var(--color-text-sec)] md:text-indigo-300'}`} />
       <span className="text-sm tracking-wide">{label}</span>
       {activeTab === id && (
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-primary)] rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>
       )}
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)] transition-colors duration-300">
      
      {/* --- Sidebar --- */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-[var(--color-sidebar)] text-white transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] md:relative md:translate-x-0 print:hidden shadow-2xl flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Background Gradients (Subtle) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-[-10%] right-[-20%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
             <div className="absolute bottom-[10%] left-[-10%] w-48 h-48 bg-black/20 rounded-full blur-3xl"></div>
        </div>

        {/* Branding */}
        <div className="relative h-28 flex items-center px-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/10">
                 {appSettings.orgLogo ? (
                    <img src={appSettings.orgLogo} alt="Logo" className="w-8 h-8 object-contain" />
                 ) : (
                    <Activity className="w-6 h-6 text-white" />
                 )}
               </div>
               <div>
                 <h1 className="text-lg font-bold leading-tight tracking-tight text-white line-clamp-2">{appSettings.orgName || 'شئون المستشفيات'}</h1>
                 <p className="text-[11px] text-indigo-200 uppercase tracking-wider mt-0.5 opacity-70">لوحة القيادة المركزية</p>
               </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden mr-auto p-2 text-white/70 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto relative z-10">
            <div className="px-4 mb-2 text-xs font-bold text-indigo-200/50 uppercase tracking-wider">القائمة الرئيسية</div>
            <NavItem id="dashboard" label="لوحة الإدارات" icon={LayoutDashboard} />
            <NavItem id="meeting" label="توثيق المحاضر" icon={FileText} />
            
            <div className="mt-8 px-4 mb-2 text-xs font-bold text-indigo-200/50 uppercase tracking-wider">النظام</div>
            <NavItem id="settings" label="إعدادات النظام" icon={Settings} />
        </nav>

        {/* Bottom Card */}
        <div className="p-6 relative z-10">
             <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                <button 
                    onClick={triggerNewMeeting}
                    className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 group"
                >
                    <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    محضر اجتماع جديد
                </button>
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-white/10">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 border border-white/10">
                        S
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-sm font-bold truncate text-white">سكرتارية القسم</p>
                       <p className="text-[10px] text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                          متصل
                       </p>
                    </div>
                </div>
             </div>
        </div>
      </aside>

      {/* --- Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Mobile Header */}
        <header className="h-16 bg-[var(--color-card)]/80 backdrop-blur-sm border-b border-slate-100 flex items-center justify-between px-4 md:hidden sticky top-0 z-40">
          <span className="font-bold text-[var(--color-text)]">{appSettings.orgName}</span>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[var(--color-text-sec)] bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Main Scrollable View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto min-h-full flex flex-col">
                
                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden animate-in fade-in slide-in-from-top-2">
                   <div>
                       <div className="flex items-center gap-2 text-sm text-[var(--color-text-sec)] mb-1">
                          <span>الرئيسية</span>
                          <ChevronLeft className="w-3 h-3" />
                          <span className="text-[var(--color-primary)] font-medium">
                            {activeTab === 'dashboard' ? 'لوحة المتابعة' : activeTab === 'meeting' ? 'نظام المحاضر' : 'الإعدادات'}
                          </span>
                       </div>
                       <h2 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
                         {activeTab === 'dashboard' ? 'متابعة أداء الإدارات' : 
                          activeTab === 'meeting' ? 'سجلات الاجتماعات' : 'إعدادات النظام'}
                       </h2>
                   </div>
                   <div className="hidden md:block text-[var(--color-text-sec)] text-sm font-medium bg-[var(--color-card)] px-4 py-2 rounded-full shadow-sm border border-slate-200/50">
                      {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                   </div>
                </div>

                {/* Content Views */}
                <div className="flex-1">
                    {activeTab === 'dashboard' && (
                      <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-end mb-6">
                            <button 
                                onClick={handleAddDepartment}
                                className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-[var(--color-primary-hover)] transition-all shadow-md active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                إضافة إدارة جديدة
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {departments.map(dept => (
                            <DepartmentCard 
                                key={dept.id} 
                                dept={dept} 
                                onUpdate={handleUpdateDepartment}
                                onDelete={handleDeleteDepartment}
                            />
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'meeting' && (
                      <div className="h-[800px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <MeetingTools createMeetingTrigger={createMeetingTrigger} appSettings={appSettings} />
                      </div>
                    )}

                    {activeTab === 'settings' && (
                      <div className="h-[800px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SettingsPage onSettingsChanged={handleSettingsChanged} />
                      </div>
                    )}
                </div>
            </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
