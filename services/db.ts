
import Dexie, { Table } from 'dexie';
import { Meeting, AppSettings, MeetingDepartment, Hospital, MeetingLocation, SubDepartment } from '../types';

class MahdarDatabase extends Dexie {
  meetings!: Table<Meeting>;
  settings!: Table<AppSettings>;
  departments!: Table<MeetingDepartment>;
  hospitals!: Table<Hospital>;
  locations!: Table<MeetingLocation>;
  subDepartments!: Table<SubDepartment>;

  constructor() {
    super('MahdarDB');
    (this as any).version(3).stores({
      meetings: '++id, refNumber, title, date, status, department',
      settings: '++id',
      departments: '++id, name',
      hospitals: '++id, name, city',
      locations: '++id, name',
      subDepartments: '++id, name, parentDeptId, managerName'
    });
  }
}

export const db = new MahdarDatabase();

// Initialize default settings and data if not exists
(db as any).on('populate', () => {
  db.settings.add({
    theme: 'default',
    font: 'Tajawal',
    language: 'ar',
    orgName: 'شئون المستشفيات - تقديم الرعاية',
    orgLogo: '',
    displayMode: 'comfortable',
    enableAnimations: true,
    dateFormat: 'gregorian',
    notificationsEnabled: true,
    autoSaveInterval: 5
  });

  // Seed some initial departments
  db.departments.bulkAdd([
    { name: 'الإدارة العامة', defaultAttendees: [] },
    { name: 'شئون المستشفيات', defaultAttendees: [] },
    { name: 'الخدمات الطبية', defaultAttendees: [] }
  ]);

  // Seed Locations
  db.locations.bulkAdd([
    { name: 'القاعة الرئيسية', capacity: 20 },
    { name: 'قاعة التدريب', capacity: 50 },
    { name: 'مكتب المدير العام', capacity: 5 }
  ]);
  
  // Seed Hospitals
  db.hospitals.bulkAdd([
    { name: 'مستشفى الملك فهد', city: 'الرياض' },
    { name: 'مستشفى الولادة والأطفال', city: 'جدة' }
  ]);
});
