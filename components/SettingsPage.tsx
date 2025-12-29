
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { AppSettings, MeetingDepartment, Hospital, MeetingLocation, SubDepartment } from '../types';
import { runSystemDiagnostics, DiagnosticResult } from '../services/diagnosticsService';
import { 
  Building2, MapPin, Users, Settings as SettingsIcon, 
  Save, Plus, Trash2, Database, Layout, Type, Palette, 
  Upload, Download, CheckCircle, ChevronDown, 
  Edit2, X, Check, ShieldCheck, RefreshCcw, Activity, AlertTriangle, AlertCircle, PlayCircle,
  Monitor, Globe, Bell, Clock, Sliders
} from 'lucide-react';

interface SettingsPageProps {
  onSettingsChanged: () => void;
}

// --- Localization Dictionary ---
const TEXTS = {
  ar: {
    title: 'الإعدادات والتحكم',
    save_general: 'حفظ الإعدادات',
    save_success: 'تم حفظ الإعدادات بنجاح',
    tabs: {
      general: 'المظهر واللغة',
      structure: 'الهيكل والبيانات',
      locations: 'القاعات',
      data: 'البيانات والنسخ',
      diagnostics: 'فحص النظام'
    },
    org: {
      title: 'هوية المؤسسة',
      name: 'اسم الجهة / المؤسسة',
      logo: 'شعار المؤسسة'
    },
    appearance: {
      title: 'المظهر والعرض',
      theme: 'سمة الألوان',
      font: 'الخط المستخدم',
      display_mode: 'كثافة العرض',
      animations: 'تأثيرات الحركة',
      themes: {
        default: 'أزرق مؤسسي (الافتراضي)',
        dark: 'الوضع الليلي',
        forest: 'غابة خضراء',
        midnight: 'منتصف الليل',
        corporate: 'رمادي رسمي'
      },
      modes: {
        comfortable: 'مريح (افتراضي)',
        compact: 'مكثف (بيانات أكثر)'
      },
      anim_on: 'تفعيل التأثيرات',
      anim_off: 'إيقاف التأثيرات (أسرع)'
    },
    lang: {
      title: 'اللغة والوقت',
      language: 'لغة الواجهة',
      date_format: 'تنسيق التاريخ',
      formats: {
        gregorian: 'ميلادي (Gregorian)',
        hijri: 'هجري (Hijri)'
      }
    },
    system: {
      title: 'خيارات النظام',
      notifications: 'الإشعارات والتنبيهات',
      autosave: 'الحفظ التلقائي (بالدقائق)',
      enabled: 'مفعل',
      disabled: 'معطل'
    },
    actions: {
      add: 'إضافة',
      delete: 'حذف',
      edit: 'تعديل',
      cancel: 'إلغاء',
      confirm: 'تأكيد'
    }
  },
  en: {
    title: 'Settings & Control',
    save_general: 'Save Settings',
    save_success: 'Settings saved successfully',
    tabs: {
      general: 'Appearance & Lang',
      structure: 'Structure & Data',
      locations: 'Locations',
      data: 'Data & Backup',
      diagnostics: 'Diagnostics'
    },
    org: {
      title: 'Organization Identity',
      name: 'Organization Name',
      logo: 'Organization Logo'
    },
    appearance: {
      title: 'Appearance & Display',
      theme: 'Color Theme',
      font: 'Font Family',
      display_mode: 'Display Density',
      animations: 'Animations',
      themes: {
        default: 'Corporate Blue (Default)',
        dark: 'Dark Mode',
        forest: 'Forest Green',
        midnight: 'Midnight',
        corporate: 'Formal Grey'
      },
      modes: {
        comfortable: 'Comfortable',
        compact: 'Compact'
      },
      anim_on: 'Enable Animations',
      anim_off: 'Reduce Motion'
    },
    lang: {
      title: 'Language & Region',
      language: 'Interface Language',
      date_format: 'Date Format',
      formats: {
        gregorian: 'Gregorian',
        hijri: 'Hijri'
      }
    },
    system: {
      title: 'System Preferences',
      notifications: 'Notifications',
      autosave: 'Auto-save Interval (min)',
      enabled: 'Enabled',
      disabled: 'Disabled'
    },
    actions: {
      add: 'Add',
      delete: 'Delete',
      edit: 'Edit',
      cancel: 'Cancel',
      confirm: 'Confirm'
    }
  }
};

const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsChanged }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'structure' | 'locations' | 'data' | 'diagnostics'>('general');
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'default',
    font: 'Tajawal',
    language: 'ar',
    orgName: '',
    displayMode: 'comfortable',
    enableAnimations: true,
    dateFormat: 'gregorian',
    notificationsEnabled: true,
    autoSaveInterval: 5
  });

  const t = TEXTS[settings.language] || TEXTS['ar'];
  const isRTL = settings.language === 'ar';

  // Data States
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<MeetingDepartment[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [locations, setLocations] = useState<MeetingLocation[]>([]);

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  // Form States
  const [newHospital, setNewHospital] = useState({ name: '', city: '' });
  const [newLocation, setNewLocation] = useState({ name: '', capacity: 0 });
  const [newDept, setNewDept] = useState('');
  const [newSubDept, setNewSubDept] = useState({ name: '', managerName: '', parentDeptId: 0 });
  
  // Edit States
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubManager, setEditSubManager] = useState('');
  
  // UI State
  const [expandedDept, setExpandedDept] = useState<number | null>(null);
  const [hasLocalDefault, setHasLocalDefault] = useState(false);

  useEffect(() => {
    loadAllData();
    checkLocalDefault();
  }, []);

  const checkLocalDefault = () => {
      setHasLocalDefault(!!localStorage.getItem('mahdar_defaults'));
  };

  const loadAllData = async () => {
    try {
      const s = await db.settings.toArray();
      if (s.length) {
          // Merge with defaults to ensure new fields exist
          setSettings({
            displayMode: 'comfortable',
            enableAnimations: true,
            dateFormat: 'gregorian',
            notificationsEnabled: true,
            autoSaveInterval: 5,
            ...s[0]
          });
      }
      
      setHospitals(await db.hospitals.toArray());
      setDepartments(await db.departments.toArray());
      setSubDepartments(await db.subDepartments.toArray());
      setLocations(await db.locations.toArray());
    } catch (e) {
      console.error("Error loading data:", e);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnostics([]); // Clear previous
    try {
        const results = await runSystemDiagnostics();
        setDiagnostics(results);
    } catch (e) {
        console.error("Diagnostics failed", e);
    } finally {
        setIsRunningDiagnostics(false);
    }
  };

  const handleSaveGeneral = async () => {
    try {
      const currentSettings = { ...settings };
      
      // Verify ID integrity
      if (currentSettings.id) {
        const exists = await db.settings.get(currentSettings.id);
        if (exists) {
           await db.settings.update(currentSettings.id, currentSettings);
        } else {
           const { id, ...rest } = currentSettings;
           await db.settings.add(rest as AppSettings);
        }
      } else {
        await db.settings.add(currentSettings);
      }

      if (onSettingsChanged) onSettingsChanged(); 
      alert(t.save_success);
      
    } catch (error) {
        console.error("Failed to save settings:", error);
        alert('Error saving settings');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, orgLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Handlers: Hospitals ---
  const addHospital = async () => {
    if (!newHospital.name) return;
    await db.hospitals.add(newHospital);
    setNewHospital({ name: '', city: '' });
    loadAllData();
  };
  const deleteHospital = async (id: number) => {
    if (window.confirm('Delete Hospital?')) {
        await db.hospitals.delete(id);
        loadAllData();
    }
  };

  // --- Handlers: Locations ---
  const addLocation = async () => {
    if (!newLocation.name) return;
    await db.locations.add(newLocation);
    setNewLocation({ name: '', capacity: 0 });
    loadAllData();
  };
  const deleteLocation = async (id: number) => {
    if (window.confirm('Delete Location?')) {
        await db.locations.delete(id);
        loadAllData();
    }
  };

  // --- Handlers: Departments & Sub ---
  const addDepartment = async () => {
    if (!newDept) return;
    await db.departments.add({ name: newDept, defaultAttendees: [] });
    setNewDept('');
    loadAllData();
  };
  
  const startEditDept = (dept: MeetingDepartment) => {
    setEditingDeptId(dept.id!);
    setEditDeptName(dept.name);
  };
  
  const saveEditDept = async () => {
    if (editingDeptId && editDeptName.trim()) {
        await db.departments.update(editingDeptId, { name: editDeptName });
        setEditingDeptId(null);
        loadAllData();
    }
  };

  const deleteDepartment = async (id: number) => {
    if (!id) return;
    if (window.confirm('Delete Department and sub-departments?')) {
      try {
          await (db as any).transaction('rw', db.departments, db.subDepartments, async () => {
              await db.departments.delete(id);
              await db.subDepartments.where('parentDeptId').equals(id).delete();
          });
          loadAllData();
      } catch (error) {
          console.error("Failed to delete department:", error);
      }
    }
  };

  const addSubDept = async (parentId: number) => {
    if (!newSubDept.name) return;
    await db.subDepartments.add({ ...newSubDept, parentDeptId: parentId });
    setNewSubDept({ name: '', managerName: '', parentDeptId: 0 });
    loadAllData();
  };
  
  const startEditSub = (sub: SubDepartment) => {
    setEditingSubId(sub.id!);
    setEditSubName(sub.name);
    setEditSubManager(sub.managerName);
  };
  
  const saveEditSub = async () => {
    if (editingSubId && editSubName.trim()) {
        await db.subDepartments.update(editingSubId, { name: editSubName, managerName: editSubManager });
        setEditingSubId(null);
        loadAllData();
    }
  };

  const deleteSubDept = async (id: number) => {
    if (!id) return;
    if (window.confirm('Delete Sub-Department?')) {
        await db.subDepartments.delete(id);
        loadAllData();
    }
  };

  // --- Backup/Restore ---
  const getFullData = async () => {
    return {
        settings: await db.settings.toArray(),
        meetings: await db.meetings.toArray(),
        departments: await db.departments.toArray(),
        subDepartments: await db.subDepartments.toArray(),
        hospitals: await db.hospitals.toArray(),
        locations: await db.locations.toArray(),
    };
  };

  const handleBackup = async () => {
    const data = await getFullData();
    const json = JSON.stringify(data, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mahdar_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const restoreData = async (data: any) => {
     await (db as any).transaction('rw', db.meetings, db.settings, db.departments, db.subDepartments, db.hospitals, db.locations, async () => {
        await Promise.all([
            db.meetings.clear(),
            db.settings.clear(),
            db.departments.clear(),
            db.subDepartments.clear(),
            db.hospitals.clear(),
            db.locations.clear()
        ]);
        
        if(data.settings) await db.settings.bulkAdd(data.settings);
        if(data.meetings) await db.meetings.bulkAdd(data.meetings);
        if(data.departments) await db.departments.bulkAdd(data.departments);
        if(data.subDepartments) await db.subDepartments.bulkAdd(data.subDepartments);
        if(data.hospitals) await db.hospitals.bulkAdd(data.hospitals);
        if(data.locations) await db.locations.bulkAdd(data.locations);
    });
    if (onSettingsChanged) onSettingsChanged();
    loadAllData();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (confirm('Restore from backup? Current data will be replaced.')) {
                    await restoreData(data);
                    alert('Data restored successfully!');
                }
            } catch (err) {
                alert('Invalid file');
            }
        };
        reader.readAsText(file);
    }
  };

  // --- Local Defaults ---
  const handleSetAsDefault = async () => {
      if (confirm('Set current state as browser default restore point?')) {
        const data = await getFullData();
        localStorage.setItem('mahdar_defaults', JSON.stringify(data));
        setHasLocalDefault(true);
        alert('Default restore point saved.');
      }
  };

  const handleRestoreDefault = async () => {
      const json = localStorage.getItem('mahdar_defaults');
      if (!json) return;
      if (confirm('Restore default state? Current data will be lost.')) {
          try {
              const data = JSON.parse(json);
              await restoreData(data);
              alert('Defaults restored.');
          } catch (e) {
              console.error(e);
          }
      }
  };

  return (
    <div className={`flex flex-col h-full p-6 overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-[var(--color-text)]">
            <SettingsIcon className="w-8 h-8 text-[var(--color-primary)]" />
            {t.title}
        </h1>
        <button onClick={handleSaveGeneral} className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-[var(--color-primary-hover)] shadow-md transition-all active:scale-95">
            <Save className="w-5 h-5" />
            {t.save_general}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-1">
        {[
            { id: 'general', label: t.tabs.general, icon: Layout },
            { id: 'structure', label: t.tabs.structure, icon: Building2 },
            { id: 'locations', label: t.tabs.locations, icon: MapPin },
            { id: 'data', label: t.tabs.data, icon: Database },
            { id: 'diagnostics', label: t.tabs.diagnostics, icon: Activity },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 rounded-t-xl flex items-center gap-2 font-medium transition-colors border-t border-x border-transparent ${
                    activeTab === tab.id 
                    ? 'bg-[var(--color-card)] text-[var(--color-primary)] border-gray-200 border-b-[var(--color-card)] translate-y-[1px] shadow-sm' 
                    : 'text-[var(--color-text-sec)] hover:bg-black/5'
                }`}
            >
                <tab.icon className="w-4 h-4" />
                {tab.label}
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        
        {/* TAB: GENERAL (Expanded Options) */}
        {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                
                {/* Identity */}
                <div className="bg-[var(--color-card)] p-6 rounded-2xl shadow-sm border border-gray-100/10 space-y-4">
                    <h3 className="font-bold border-b border-gray-100 pb-3 flex items-center gap-2 text-[var(--color-text)]">
                        <Building2 className="w-5 h-5 text-[var(--color-text-sec)]" /> {t.org.title}
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1">{t.org.name}</label>
                        <input 
                            type="text" 
                            value={settings.orgName} 
                            onChange={e => setSettings({...settings, orgName: e.target.value})}
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] bg-transparent text-[var(--color-text)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-2">{t.org.logo}</label>
                        <div className="flex items-center gap-4 border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50">
                            {settings.orgLogo ? (
                                <img src={settings.orgLogo} className="h-16 w-16 object-contain bg-white rounded-lg shadow-sm" />
                            ) : (
                                <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">NA</div>
                            )}
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-hover)]" />
                        </div>
                    </div>
                </div>

                {/* Appearance & Display */}
                <div className="bg-[var(--color-card)] p-6 rounded-2xl shadow-sm border border-gray-100/10 space-y-4">
                    <h3 className="font-bold border-b border-gray-100 pb-3 flex items-center gap-2 text-[var(--color-text)]">
                        <Palette className="w-5 h-5 text-[var(--color-text-sec)]" /> {t.appearance.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1">{t.appearance.theme}</label>
                            <select 
                                value={settings.theme} 
                                onChange={e => setSettings({...settings, theme: e.target.value as any})}
                                className="w-full p-3 border rounded-xl bg-[var(--color-card)] text-[var(--color-text)]"
                            >
                                <option value="default">{t.appearance.themes.default}</option>
                                <option value="dark">{t.appearance.themes.dark}</option>
                                <option value="forest">{t.appearance.themes.forest}</option>
                                <option value="midnight">{t.appearance.themes.midnight}</option>
                                <option value="corporate">{t.appearance.themes.corporate}</option>
                            </select>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1">{t.appearance.font}</label>
                            <select 
                                value={settings.font} 
                                onChange={e => setSettings({...settings, font: e.target.value as any})}
                                className="w-full p-3 border rounded-xl bg-[var(--color-card)] text-[var(--color-text)]"
                            >
                                <option value="Tajawal">Tajawal (Arabic)</option>
                                <option value="Cairo">Cairo (Arabic)</option>
                                <option value="IBM Plex Sans Arabic">IBM Plex (Arabic)</option>
                                <option value="Inter">Inter (English)</option>
                            </select>
                        </div>
                        
                        {/* New Display Options */}
                         <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1"><Monitor className="w-4 h-4 inline mx-1" /> {t.appearance.display_mode}</label>
                            <select 
                                value={settings.displayMode} 
                                onChange={e => setSettings({...settings, displayMode: e.target.value as any})}
                                className="w-full p-3 border rounded-xl bg-[var(--color-card)] text-[var(--color-text)]"
                            >
                                <option value="comfortable">{t.appearance.modes.comfortable}</option>
                                <option value="compact">{t.appearance.modes.compact}</option>
                            </select>
                        </div>
                         <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1"><Sliders className="w-4 h-4 inline mx-1" /> {t.appearance.animations}</label>
                            <select 
                                value={settings.enableAnimations ? 'true' : 'false'} 
                                onChange={e => setSettings({...settings, enableAnimations: e.target.value === 'true'})}
                                className="w-full p-3 border rounded-xl bg-[var(--color-card)] text-[var(--color-text)]"
                            >
                                <option value="true">{t.appearance.anim_on}</option>
                                <option value="false">{t.appearance.anim_off}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Language & Regional */}
                 <div className="bg-[var(--color-card)] p-6 rounded-2xl shadow-sm border border-gray-100/10 space-y-4">
                    <h3 className="font-bold border-b border-gray-100 pb-3 flex items-center gap-2 text-[var(--color-text)]">
                        <Globe className="w-5 h-5 text-[var(--color-text-sec)]" /> {t.lang.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1">{t.lang.language}</label>
                            <select 
                                value={settings.language} 
                                onChange={e => setSettings({...settings, language: e.target.value as any})}
                                className="w-full p-3 border rounded-xl bg-[var(--color-card)] font-bold text-[var(--color-text)]"
                            >
                                <option value="ar">العربية (Arabic)</option>
                                <option value="en">English (US)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1">{t.lang.date_format}</label>
                            <select 
                                value={settings.dateFormat} 
                                onChange={e => setSettings({...settings, dateFormat: e.target.value as any})}
                                className="w-full p-3 border rounded-xl bg-[var(--color-card)] text-[var(--color-text)]"
                            >
                                <option value="gregorian">{t.lang.formats.gregorian}</option>
                                <option value="hijri">{t.lang.formats.hijri}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* System Preferences */}
                <div className="bg-[var(--color-card)] p-6 rounded-2xl shadow-sm border border-gray-100/10 space-y-4">
                    <h3 className="font-bold border-b border-gray-100 pb-3 flex items-center gap-2 text-[var(--color-text)]">
                        <SettingsIcon className="w-5 h-5 text-[var(--color-text-sec)]" /> {t.system.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1 flex items-center gap-2">
                                <Bell className="w-4 h-4" /> {t.system.notifications}
                            </label>
                            <select 
                                value={settings.notificationsEnabled ? 'true' : 'false'} 
                                onChange={e => setSettings({...settings, notificationsEnabled: e.target.value === 'true'})}
                                className="w-full p-3 border rounded-xl bg-[var(--color-card)] text-[var(--color-text)]"
                            >
                                <option value="true">{t.system.enabled}</option>
                                <option value="false">{t.system.disabled}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> {t.system.autosave}
                            </label>
                            <input 
                                type="number"
                                min="1"
                                max="60"
                                value={settings.autoSaveInterval} 
                                onChange={e => setSettings({...settings, autoSaveInterval: Number(e.target.value)})}
                                className="w-full p-3 border rounded-xl bg-[var(--color-card)] text-[var(--color-text)]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB: STRUCTURE BUILDER */}
        {activeTab === 'structure' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                 
                 {/* 1. Hospitals */}
                 <div className="bg-[var(--color-card)] p-6 rounded-2xl shadow-sm border border-gray-100/10">
                    <h3 className="font-bold text-lg border-b border-gray-100 pb-3 mb-4 flex items-center justify-between text-[var(--color-text)]">
                         <span className="flex items-center gap-2"><Building2 className="w-5 h-5 text-[var(--color-primary)]" /> Hospitals</span>
                         <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{hospitals.length}</span>
                    </h3>
                    
                    <div className="flex gap-3 mb-4">
                        <input 
                            type="text" placeholder="Hospital Name" 
                            value={newHospital.name} onChange={e => setNewHospital({...newHospital, name: e.target.value})}
                            className="flex-[2] p-2.5 border rounded-lg text-sm bg-transparent text-[var(--color-text)]"
                        />
                        <input 
                            type="text" placeholder="City" 
                            value={newHospital.city} onChange={e => setNewHospital({...newHospital, city: e.target.value})}
                            className="flex-1 p-2.5 border rounded-lg text-sm bg-transparent text-[var(--color-text)]"
                        />
                        <button onClick={addHospital} disabled={!newHospital.name} className="bg-[var(--color-primary)] text-white px-4 rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"><Plus /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {hospitals.map(h => (
                            <div key={h.id} className="p-3 border rounded-xl flex justify-between items-center bg-gray-50 hover:bg-white transition-colors">
                                <div>
                                    <div className="font-bold text-slate-800">{h.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {h.city}</div>
                                </div>
                                <button type="button" onClick={() => deleteHospital(h.id!)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* 2. Departments & Hierarchy */}
                 <div className="bg-[var(--color-card)] p-6 rounded-2xl shadow-sm border border-gray-100/10">
                    <h3 className="font-bold text-lg border-b border-gray-100 pb-3 mb-4 flex items-center justify-between text-[var(--color-text)]">
                         <span className="flex items-center gap-2"><Users className="w-5 h-5 text-[var(--color-primary)]" /> Departments Hierarchy</span>
                    </h3>

                    {/* Add Main Dept */}
                    <div className="flex gap-3 mb-6 bg-gray-50/50 p-4 rounded-xl">
                        <input 
                            type="text" placeholder="Main Department Name" 
                            value={newDept} onChange={e => setNewDept(e.target.value)}
                            className="flex-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] bg-white text-[var(--color-text)]"
                        />
                        <button onClick={addDepartment} disabled={!newDept} className="bg-[var(--color-primary)] text-white px-6 rounded-lg hover:bg-[var(--color-primary-hover)] font-bold disabled:opacity-50"><Plus /></button>
                    </div>

                    <div className="space-y-4">
                        {departments.map(dept => (
                            <div key={dept.id} className="border rounded-2xl overflow-hidden transition-all duration-300">
                                {/* Header */}
                                <div 
                                    className={`p-4 flex justify-between items-center ${expandedDept === dept.id ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
                                >
                                    {/* Collapsible Trigger Area */}
                                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id!)}>
                                        <div className={`transition-transform duration-200 ${expandedDept === dept.id ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        </div>
                                        
                                        {/* Edit Mode for Dept */}
                                        {editingDeptId === dept.id ? (
                                            <div className="flex items-center gap-2 flex-1 animate-in fade-in" onClick={e => e.stopPropagation()}>
                                                <input 
                                                    value={editDeptName}
                                                    onChange={e => setEditDeptName(e.target.value)}
                                                    className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                                                    autoFocus
                                                    onClick={e => e.stopPropagation()}
                                                />
                                                <button type="button" onClick={saveEditDept} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check className="w-4 h-4" /></button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setEditingDeptId(null); }} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex justify-between items-center text-[var(--color-text)]">
                                                <span className="font-bold">{dept.name}</span>
                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-auto ml-4">
                                                    {subDepartments.filter(s => s.parentDeptId === dept.id).length} sub-units
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    {editingDeptId !== dept.id && (
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); startEditDept(dept); }} className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteDepartment(dept.id!); }} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Body (Sub Depts) */}
                                {expandedDept === dept.id && (
                                    <div className="bg-gray-50 p-4 border-t">
                                        <div className="pl-4 border-r-2 border-[var(--color-primary)]/30 mr-2 space-y-3">
                                            <h4 className="text-xs font-bold text-[var(--color-primary)] mb-2">Sub-Departments & Managers:</h4>
                                            
                                            {/* List */}
                                            {subDepartments.filter(s => s.parentDeptId === dept.id).map(sub => (
                                                <div key={sub.id} className="bg-white p-3 rounded-lg border shadow-sm">
                                                    {editingSubId === sub.id ? (
                                                        <div className="flex items-center gap-2 animate-in fade-in">
                                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                                <input 
                                                                    placeholder="Unit Name"
                                                                    value={editSubName}
                                                                    onChange={e => setEditSubName(e.target.value)}
                                                                    className="p-2 border rounded-md text-sm"
                                                                />
                                                                <input 
                                                                    placeholder="Manager"
                                                                    value={editSubManager}
                                                                    onChange={e => setEditSubManager(e.target.value)}
                                                                    className="p-2 border rounded-md text-sm"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <button type="button" onClick={saveEditSub} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check className="w-3 h-3" /></button>
                                                                <button type="button" onClick={() => setEditingSubId(null)} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"><X className="w-3 h-3" /></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium text-sm text-slate-800">{sub.name}</div>
                                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <UserIconMini /> Manager: {sub.managerName || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button type="button" onClick={() => startEditSub(sub)} className="text-blue-400 hover:bg-blue-50 p-1.5 rounded transition-colors"><Edit2 className="w-3 h-3" /></button>
                                                                <button type="button" onClick={() => deleteSubDept(sub.id!)} className="text-red-400 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add Form */}
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                                                <input 
                                                    type="text" placeholder="Unit Name" 
                                                    className="flex-1 p-2 border rounded-md text-xs"
                                                    value={newSubDept.parentDeptId === dept.id ? newSubDept.name : ''}
                                                    onChange={e => setNewSubDept({ ...newSubDept, name: e.target.value, parentDeptId: dept.id! })}
                                                />
                                                <input 
                                                    type="text" placeholder="Manager Name" 
                                                    className="flex-1 p-2 border rounded-md text-xs"
                                                    value={newSubDept.parentDeptId === dept.id ? newSubDept.managerName : ''}
                                                    onChange={e => setNewSubDept({ ...newSubDept, managerName: e.target.value, parentDeptId: dept.id! })}
                                                />
                                                <button 
                                                    onClick={() => addSubDept(dept.id!)}
                                                    className="bg-[var(--color-primary)] text-white px-3 py-1 rounded-md text-xs hover:bg-[var(--color-primary-hover)]"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                 </div>

             </div>
        )}

        {/* TAB: LOCATIONS */}
        {activeTab === 'locations' && (
             <div className="bg-[var(--color-card)] p-6 rounded-2xl shadow-sm border border-gray-100/10 animate-in fade-in slide-in-from-bottom-2">
                <h3 className="font-bold text-lg border-b border-gray-100 pb-3 mb-4 flex items-center gap-2 text-[var(--color-text)]">
                     <MapPin className="w-5 h-5 text-[var(--color-primary)]" /> Locations Management
                </h3>
                
                <div className="flex gap-3 mb-6 bg-gray-50/50 p-4 rounded-xl">
                    <input 
                        type="text" placeholder="Room / Location Name" 
                        value={newLocation.name} onChange={e => setNewLocation({...newLocation, name: e.target.value})}
                        className="flex-[2] p-2.5 border rounded-lg text-sm bg-white text-[var(--color-text)]"
                    />
                    <input 
                        type="number" placeholder="Capacity" 
                        value={newLocation.capacity || ''} onChange={e => setNewLocation({...newLocation, capacity: Number(e.target.value)})}
                        className="flex-1 p-2.5 border rounded-lg text-sm bg-white text-[var(--color-text)]"
                    />
                    <button onClick={addLocation} disabled={!newLocation.name} className="bg-[var(--color-primary)] text-white px-4 rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"><Plus /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map(loc => (
                        <div key={loc.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-indigo-50 p-2 rounded-lg text-[var(--color-primary)]"><MapPin className="w-5 h-5" /></div>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-mono">Cap: {loc.capacity}</span>
                            </div>
                            <h4 className="font-bold text-lg mb-1 text-slate-800">{loc.name}</h4>
                            
                            <button 
                                type="button"
                                onClick={() => deleteLocation(loc.id!)}
                                className="absolute top-2 left-2 text-red-400 hover:bg-red-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
             </div>
        )}

        {/* TAB: DATA */}
        {activeTab === 'data' && (
             <div className="bg-[var(--color-card)] p-6 rounded-2xl shadow-sm border border-gray-100/10 animate-in fade-in slide-in-from-bottom-2 space-y-6">
                 <h3 className="font-bold text-lg border-b border-gray-100 pb-3 flex items-center gap-2 text-[var(--color-text)]">
                     <Database className="w-5 h-5 text-[var(--color-primary)]" /> Database & Backups
                </h3>
                
                {/* File Backup */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                        onClick={handleBackup}
                        className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 border-dashed rounded-2xl hover:bg-gray-50 hover:border-[var(--color-primary)] transition-all group"
                    >
                        <div className="bg-indigo-50 p-4 rounded-full text-[var(--color-primary)] mb-4 group-hover:scale-110 transition-transform"><Download className="w-8 h-8" /></div>
                        <h4 className="font-bold mb-2 text-[var(--color-text)]">Export Full Backup</h4>
                        <p className="text-sm text-[var(--color-text-sec)] text-center">Download JSON file.</p>
                    </button>

                    <div className="relative">
                        <input type="file" accept=".json" onChange={handleRestore} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 border-dashed rounded-2xl hover:bg-gray-50 hover:border-green-300 transition-all h-full group">
                             <div className="bg-green-50 p-4 rounded-full text-green-600 mb-4 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8" /></div>
                            <h4 className="font-bold mb-2 text-[var(--color-text)]">Import Backup</h4>
                            <p className="text-sm text-[var(--color-text-sec)] text-center">Restore data from file.</p>
                        </div>
                    </div>
                </div>

                {/* Local Defaults Section */}
                <div className="border-t pt-6 mt-6">
                    <h4 className="font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
                         <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
                         Restore Points
                    </h4>
                    <div className="bg-indigo-50/20 rounded-xl p-5 border border-indigo-100/50">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                             <div className="text-sm text-[var(--color-text-sec)]">
                                 <p className="font-bold mb-1 text-[var(--color-text)]">Set Current State as Default:</p>
                                 <p>Save all current settings/data as a browser-local restore point.</p>
                             </div>
                             <div className="flex gap-3">
                                <button 
                                    onClick={handleSetAsDefault}
                                    className="px-4 py-2 bg-white border border-indigo-200 text-[var(--color-primary)] rounded-lg hover:bg-indigo-50 font-medium text-sm flex items-center gap-2"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Save Point
                                </button>
                                <button 
                                    onClick={handleRestoreDefault}
                                    disabled={!hasLocalDefault}
                                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:hover:bg-[var(--color-primary)] font-medium text-sm flex items-center gap-2"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                    Restore Point
                                </button>
                             </div>
                        </div>
                        {hasLocalDefault && (
                             <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
                                 <CheckCircle className="w-3 h-3" /> Restore point available.
                             </div>
                        )}
                    </div>
                </div>
             </div>
        )}

        {/* TAB: DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
             <div className="bg-[var(--color-card)] p-6 rounded-2xl shadow-sm border border-gray-100/10 animate-in fade-in slide-in-from-bottom-2 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2 text-[var(--color-text)]">
                            <Activity className="w-5 h-5 text-[var(--color-primary)]" /> System Diagnostics
                        </h3>
                        <p className="text-sm text-[var(--color-text-sec)] mt-1">Check connectivity, database, and AI services.</p>
                    </div>
                    <button 
                        onClick={handleRunDiagnostics}
                        disabled={isRunningDiagnostics}
                        className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-[var(--color-primary-hover)] shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isRunningDiagnostics ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : <PlayCircle className="w-5 h-5" />}
                        Start Scan
                    </button>
                </div>

                <div className="space-y-3">
                    {diagnostics.length > 0 ? diagnostics.map(d => (
                        <div key={d.id} className={`p-4 rounded-xl border flex items-center gap-4 ${
                            d.status === 'ok' ? 'bg-green-50 border-green-200' :
                            d.status === 'warning' ? 'bg-amber-50 border-amber-200' :
                            'bg-red-50 border-red-200'
                        }`}>
                            <div className={`p-2 rounded-full ${
                                d.status === 'ok' ? 'bg-green-100 text-green-600' :
                                d.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                                'bg-red-100 text-red-600'
                            }`}>
                                {d.status === 'ok' ? <CheckCircle className="w-5 h-5" /> : 
                                 d.status === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
                                 <AlertCircle className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{d.name}</h4>
                                <p className={`text-sm ${
                                    d.status === 'ok' ? 'text-green-700' :
                                    d.status === 'warning' ? 'text-amber-700' :
                                    'text-red-700'
                                }`}>{d.message}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Click "Start Scan" to check system health.</p>
                        </div>
                    )}
                </div>
             </div>
        )}

      </div>
    </div>
  );
};

// Mini Icon helper
const UserIconMini = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default SettingsPage;
