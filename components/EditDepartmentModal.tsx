
import React, { useState, useEffect } from 'react';
import { Department, Visit, KPI } from '../types';
import { X, Plus, Save, Trash2, Calendar, Target, FileText, CheckSquare, Sparkles } from 'lucide-react';
import { generateDepartmentPlan } from '../services/geminiService';

interface EditDepartmentModalProps {
  isOpen: boolean;
  department: Department;
  onClose: () => void;
  onSave: (updatedDept: Department) => void;
  onDelete: (id: string) => void;
}

const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({ isOpen, department, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Department>(department);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for adding new items
  const [newTask, setNewTask] = useState('');
  const [newKpi, setNewKpi] = useState<Partial<KPI>>({ name: '', current: 0, target: 100, unit: '%' });
  const [newVisit, setNewVisit] = useState<Partial<Visit>>({
    hospitalName: '',
    date: '',
    status: 'scheduled'
  });

  useEffect(() => {
    setFormData(department);
  }, [department]);

  if (!isOpen) return null;

  // --- AI Handler ---
  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
        const plan = await generateDepartmentPlan(formData.name, formData.description);
        setFormData(prev => ({
            ...prev,
            description: plan.description || prev.description,
            tasks: plan.tasks && plan.tasks.length > 0 ? plan.tasks : prev.tasks,
            kpis: plan.kpis && plan.kpis.length > 0 ? plan.kpis : prev.kpis
        }));
    } catch (e) {
        console.error(e);
        alert('Could not generate plan. Please try again.');
    } finally {
        setIsGenerating(false);
    }
  };

  // --- Plan / Tasks Handlers ---
  const handleDescriptionChange = (desc: string) => {
    setFormData({ ...formData, description: desc });
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    setFormData({ ...formData, tasks: [...formData.tasks, newTask] });
    setNewTask('');
  };

  const handleDeleteTask = (index: number) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== index)
    });
  };

  // --- KPI Handlers ---
  const handleKpiChange = (index: number, field: keyof KPI, value: string | number) => {
    const newKpis = [...formData.kpis];
    // @ts-ignore
    newKpis[index] = { ...newKpis[index], [field]: value };
    setFormData({ ...formData, kpis: newKpis });
  };

  const handleDeleteKpi = (index: number) => {
    setFormData({
      ...formData,
      kpis: formData.kpis.filter((_, i) => i !== index)
    });
  };

  const handleAddKpi = () => {
    if (!newKpi.name) return;
    const kpiToAdd: KPI = {
      name: newKpi.name,
      current: Number(newKpi.current) || 0,
      target: Number(newKpi.target) || 0,
      unit: newKpi.unit || '%'
    };
    setFormData({ ...formData, kpis: [...formData.kpis, kpiToAdd] });
    setNewKpi({ name: '', current: 0, target: 100, unit: '%' });
  };

  // --- Visit Handlers ---
  const handleDeleteVisit = (visitId: string) => {
    setFormData({
      ...formData,
      visits: formData.visits.filter(v => v.id !== visitId)
    });
  };

  const handleAddVisit = () => {
    if (!newVisit.hospitalName || !newVisit.date) return;
    
    const visit: Visit = {
      id: Date.now().toString(),
      hospitalName: newVisit.hospitalName,
      date: newVisit.date,
      status: newVisit.status as 'scheduled' | 'pending' | 'completed',
      notes: ''
    };

    setFormData({
      ...formData,
      visits: [...formData.visits, visit]
    });

    setNewVisit({ hospitalName: '', date: '', status: 'scheduled' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${formData.color.replace('border-', 'bg-')} text-white`}>
          <div className="flex-1">
            <div className="flex items-center gap-3">
               <h2 className="text-xl font-bold">تحديث بيانات: {formData.name}</h2>
               <button 
                  onClick={handleAIGenerate} 
                  disabled={isGenerating}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-white/20 backdrop-blur-sm"
                  title="توليد الوصف، المهام، والمؤشرات باستخدام الذكاء الاصطناعي"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'جاري التحليل...' : 'اقتراح ذكي (AI)'}
               </button>
            </div>
            <p className="text-white/80 text-xs mt-1">تعديل الخطة الاستراتيجية ومؤشرات الأداء</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* SECTION 1: Department Plan (Description & Tasks) */}
          <section>
             <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 pb-2 border-b">
              <FileText className="w-5 h-5 text-indigo-600" />
              خطة الإدارة والمهام
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف العام / الرؤية</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] transition-all"
                  value={formData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="أدخل وصفاً موجزاً لمهام ومسؤوليات الإدارة..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">المهام الرئيسية (بنود الخطة)</label>
                <div className="space-y-2 mb-3">
                  {formData.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 group transition-colors hover:bg-white hover:border-gray-300 hover:shadow-sm">
                      <CheckSquare className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-sm text-gray-700 font-medium">{task}</span>
                      <button 
                        onClick={() => handleDeleteTask(idx)}
                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                        title="حذف المهمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.tasks.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-2">لا توجد مهام مسجلة</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="أضف مهمة استراتيجية جديدة..." 
                    className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <button 
                    onClick={handleAddTask}
                    disabled={!newTask.trim()}
                    className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: KPIs */}
          <section>
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
               <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <Target className="w-5 h-5 text-indigo-600" />
                مؤشرات الأداء والمستهدفات
              </h3>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 bg-gray-50 p-4 text-xs font-bold text-gray-500 border-b">
                <div className="col-span-5">اسم المؤشر</div>
                <div className="col-span-2 text-center">الإنجاز الحالي</div>
                <div className="col-span-2 text-center">المستهدف</div>
                <div className="col-span-2 text-center">الوحدة</div>
                <div className="col-span-1"></div>
              </div>

              {/* KPI List */}
              <div className="divide-y divide-gray-100">
                {formData.kpis.map((kpi, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-gray-50 transition-colors">
                    <div className="col-span-5">
                      <input 
                        type="text" 
                        value={kpi.name}
                        onChange={(e) => handleKpiChange(idx, 'name', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-800 placeholder-gray-400"
                        placeholder="اسم المؤشر"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="number" 
                        value={kpi.current}
                        onChange={(e) => handleKpiChange(idx, 'current', Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md py-1 px-2 text-center text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-indigo-600"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="number" 
                        value={kpi.target}
                        onChange={(e) => handleKpiChange(idx, 'target', Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md py-1 px-2 text-center text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        value={kpi.unit}
                        onChange={(e) => handleKpiChange(idx, 'unit', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md py-1 px-2 text-center text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                       <button 
                         onClick={() => handleDeleteKpi(idx)} 
                         className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-full transition-colors"
                         title="حذف المؤشر"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))}
                
                {formData.kpis.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    لا توجد مؤشرات حالياً. أضف مؤشراً جديداً أدناه.
                  </div>
                )}
              </div>
            </div>

            {/* Add New KPI Form */}
            <div className="mt-4 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
               <div className="text-xs font-semibold text-indigo-800 mb-3 flex items-center gap-1">
                 <Plus className="w-4 h-4" />
                 إضافة مؤشر جديد
               </div>
               <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 md:col-span-5">
                    <input 
                      type="text" 
                      placeholder="اسم المؤشر (مثلاً: نسبة الرضا)"
                      className="w-full p-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={newKpi.name}
                      onChange={(e) => setNewKpi({...newKpi, name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input 
                      type="number" 
                      placeholder="الحالي"
                      className="w-full p-2 border border-indigo-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-indigo-500"
                      value={newKpi.current}
                      onChange={(e) => setNewKpi({...newKpi, current: Number(e.target.value)})}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input 
                      type="number" 
                      placeholder="المستهدف"
                      className="w-full p-2 border border-indigo-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-indigo-500"
                      value={newKpi.target}
                      onChange={(e) => setNewKpi({...newKpi, target: Number(e.target.value)})}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                     <input 
                      type="text" 
                      placeholder="الوحدة (%)"
                      className="w-full p-2 border border-indigo-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-indigo-500"
                      value={newKpi.unit}
                      onChange={(e) => setNewKpi({...newKpi, unit: e.target.value})}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-1 flex justify-end">
                    <button 
                      onClick={handleAddKpi}
                      disabled={!newKpi.name}
                      className="w-full bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors flex items-center justify-center shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
               </div>
            </div>
          </section>

          {/* SECTION 3: Visits (Existing) */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 pb-2 border-b">
              <Calendar className="w-5 h-5 text-indigo-600" />
              جدول الزيارات
            </h3>
            
            {/* List */}
            <div className="space-y-3 mb-4">
              {formData.visits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm group/visit transition-all">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border text-gray-500">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 text-sm">{visit.hospitalName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{visit.date}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            visit.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            visit.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-blue-100 text-blue-700'
                            }`}>
                            {visit.status === 'completed' ? 'مكتمل' : visit.status === 'pending' ? 'معلق' : 'مجدول'}
                            </span>
                        </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteVisit(visit.id)}
                    className="text-red-400 opacity-0 group-hover/visit:opacity-100 transition-all p-2 hover:bg-red-50 rounded-full"
                    title="حذف الزيارة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.visits.length === 0 && <p className="text-gray-400 text-sm text-center py-4 border-2 border-dashed border-gray-100 rounded-lg">لا توجد زيارات مسجلة</p>}
            </div>

            {/* Add Form */}
            <div className="flex flex-col sm:flex-row gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input 
                type="text" 
                placeholder="اسم المستشفى"
                className="flex-[2] p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                value={newVisit.hospitalName}
                onChange={e => setNewVisit({...newVisit, hospitalName: e.target.value})}
              />
              <input 
                type="date" 
                className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                value={newVisit.date}
                onChange={e => setNewVisit({...newVisit, date: e.target.value})}
              />
              <select 
                className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                value={newVisit.status}
                onChange={e => setNewVisit({...newVisit, status: e.target.value as any})}
              >
                <option value="scheduled">مجدول</option>
                <option value="pending">معلق</option>
                <option value="completed">مكتمل</option>
              </select>
              <button 
                onClick={handleAddVisit}
                disabled={!newVisit.hospitalName || !newVisit.date}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="sm:hidden">إضافة زيارة</span>
              </button>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center gap-3">
          <button 
            onClick={() => {
                onDelete(department.id);
                onClose();
            }}
            className="px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 font-bold text-sm transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">حذف القسم</span>
          </button>

          <div className="flex gap-3">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg text-gray-700 hover:bg-gray-200 font-medium transition-colors"
            >
                إلغاء
            </button>
            <button 
                onClick={() => onSave(formData)}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
            >
                <Save className="w-4 h-4" />
                حفظ التغييرات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDepartmentModal;
