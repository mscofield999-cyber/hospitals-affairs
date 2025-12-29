
import React, { useState } from 'react';
import { Department } from '../types';
import { 
  Briefcase, Calendar, CheckCircle2, MoreHorizontal,
  Ambulance, HeartPulse, BarChart3, BedDouble, ShieldCheck, HardHat, Clock
} from 'lucide-react';
import EditDepartmentModal from './EditDepartmentModal';

interface DepartmentCardProps {
  dept: Department;
  onUpdate: (updatedDept: Department) => void;
  onDelete: (id: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  referral: <Ambulance className="w-6 h-6" />,
  centers: <HeartPulse className="w-6 h-6" />,
  mortality: <BarChart3 className="w-6 h-6" />,
  capacity: <BedDouble className="w-6 h-6" />,
  duty: <ShieldCheck className="w-6 h-6" />,
  projects: <HardHat className="w-6 h-6" />,
};

const DepartmentCard: React.FC<DepartmentCardProps> = ({ dept, onUpdate, onDelete }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Helper to extract color utility (safe mapping)
  const baseColor = dept.color.replace('border-', '');
  const colorMap: any = {
    'blue-500': 'text-blue-600 bg-blue-50 border-blue-200',
    'purple-500': 'text-purple-600 bg-purple-50 border-purple-200',
    'rose-500': 'text-rose-600 bg-rose-50 border-rose-200',
    'red-500': 'text-red-600 bg-red-50 border-red-200',
    'emerald-500': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'green-500': 'text-green-600 bg-green-50 border-green-200',
    'amber-500': 'text-amber-600 bg-amber-50 border-amber-200',
    'orange-500': 'text-orange-600 bg-orange-50 border-orange-200',
    'cyan-500': 'text-cyan-600 bg-cyan-50 border-cyan-200',
  };
  const theme = colorMap[baseColor] || 'text-gray-600 bg-gray-50 border-gray-200';

  return (
    <>
      <div className="group relative bg-[var(--color-card)] rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-[var(--color-primary)]/20 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden h-full">
        
        {/* Top Decorative Line */}
        <div className={`h-1.5 w-full bg-gradient-to-r from-transparent via-${baseColor} to-transparent opacity-70`}></div>

        {/* Card Header */}
        <div className="p-7 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme} shadow-sm ring-1 ring-inset ring-black/5`}>
              {iconMap[dept.icon] || <Briefcase className="w-6 h-6" />}
            </div>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 text-slate-400 hover:text-[var(--color-primary)] hover:bg-indigo-50 rounded-xl transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-[var(--color-text)] mb-2 leading-tight">{dept.name}</h3>
          <p className="text-sm text-[var(--color-text-sec)] leading-relaxed line-clamp-2 h-10">
            {dept.description}
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 px-7 flex flex-col gap-6">
          
          {/* KPI Mini-Widgets */}
          <div className="grid grid-cols-2 gap-3">
             {dept.kpis.slice(0, 2).map((kpi, idx) => {
                 const pct = kpi.target > 0 ? Math.min((kpi.current / kpi.target) * 100, 100) : 0;
                 return (
                    <div key={idx} className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between h-20">
                        <span className="text-[10px] font-bold text-[var(--color-text-sec)] uppercase truncate">{kpi.name}</span>
                        <div className="flex items-end justify-between">
                            <span className="text-lg font-bold text-[var(--color-text)]">{kpi.current}<span className="text-[10px] text-[var(--color-text-sec)] font-normal ml-0.5">{kpi.unit}</span></span>
                            <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center relative">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 text-[var(--color-primary)]">
                                    <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                    <path className="text-current" strokeDasharray={`${pct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                 );
             })}
          </div>

          {/* Tasks List (Compact) */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold text-[var(--color-text-sec)] uppercase tracking-widest flex items-center gap-2">
               أبرز المهام
               <div className="h-px bg-slate-100 flex-1"></div>
            </h4>
            <ul className="space-y-2">
              {dept.tasks.slice(0, 3).map((task, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-[var(--color-text-sec)] group/item">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 text-slate-300 group-hover/item:text-${baseColor.split('-')[0]}-500 transition-colors`} />
                  <span className="group-hover/item:text-[var(--color-text)] transition-colors line-clamp-1">{task}</span>
                </li>
              ))}
              {dept.tasks.length === 0 && <span className="text-xs text-slate-400 italic">لا توجد مهام</span>}
            </ul>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Footer / Visits */}
          <div className="pb-6 pt-2">
             {dept.visits.length > 0 ? (
                 <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 bg-[var(--color-card)] rounded-lg flex items-center justify-center shadow-sm text-[var(--color-primary)] border border-slate-100 flex-shrink-0">
                        <div className="text-center leading-none">
                            <span className="block text-[8px] font-bold uppercase text-slate-400">
                                {new Date(dept.visits[0].date).toLocaleString('en-US', {month: 'short'})}
                            </span>
                            <span className="block text-sm font-bold">
                                {new Date(dept.visits[0].date).getDate()}
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-xs font-bold text-[var(--color-text)] truncate" title={dept.visits[0].hospitalName}>
                            {dept.visits[0].hospitalName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {dept.visits[0].status === 'scheduled' && <Calendar className="w-3 h-3 text-blue-500" />}
                            {dept.visits[0].status === 'pending' && <Clock className="w-3 h-3 text-amber-500" />}
                            {dept.visits[0].status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                            
                            <span className={`text-[10px] font-medium truncate ${
                                dept.visits[0].status === 'scheduled' ? 'text-blue-600' :
                                dept.visits[0].status === 'pending' ? 'text-amber-600' :
                                'text-emerald-600'
                            }`}>
                                {dept.visits[0].status === 'completed' ? 'تمت الزيارة' : 
                                 dept.visits[0].status === 'pending' ? 'قيد الانتظار' : 'زيارة مجدولة'}
                            </span>
                        </div>
                    </div>
                 </div>
             ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                    <span className="text-xs text-slate-400">لا توجد زيارات مجدولة</span>
                </div>
             )}
          </div>

        </div>
      </div>

      <EditDepartmentModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        department={dept}
        onSave={(updated) => {
          onUpdate(updated);
          setIsEditModalOpen(false);
        }}
        onDelete={onDelete}
      />
    </>
  );
};

export default DepartmentCard;
