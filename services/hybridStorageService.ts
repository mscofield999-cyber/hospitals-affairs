import { FirestoreService } from './firestoreService';
import { db } from './db';

interface HybridStorageService {
  // Departments
  getDepartments(): Promise<any[]>;
  addDepartment(department: any): Promise<string>;
  updateDepartment(id: string, updates: any): Promise<void>;
  deleteDepartment(id: string): Promise<void>;
  subscribeToDepartments(callback: (departments: any[]) => void): () => void;

  // Settings
  getSettings(): Promise<any>;
  saveSettings(settings: any): Promise<void>;
  subscribeToSettings(callback: (settings: any) => void): () => void;

  // Meetings
  saveMeeting(meetingData: any): Promise<string>;
  getMeetings(): Promise<any[]>;

  // Migration
  migrateFromLocal(): Promise<void>;
  isOnline(): Promise<boolean>;
}

class HybridStorageServiceImpl implements HybridStorageService {
  private useFirestore: boolean = true;
  private firestoreAvailable: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.firestoreAvailable = await FirestoreService.checkConnection();
      this.useFirestore = this.firestoreAvailable;
      
      if (this.firestoreAvailable) {
        console.log('Using Firestore for cloud storage');
        // Auto-migrate local data to Firestore
        await this.migrateFromLocal();
      } else {
        console.log('Firestore unavailable, using local IndexedDB');
      }
    } catch (error) {
      console.warn('Hybrid storage initialization failed:', error);
      this.useFirestore = false;
    }
  }

  async isOnline(): Promise<boolean> {
    return this.firestoreAvailable && this.useFirestore;
  }

  // Departments
  async getDepartments(): Promise<any[]> {
    try {
      if (this.useFirestore) {
        return await FirestoreService.getDepartments();
      } else {
        return await db.departments.toArray();
      }
    } catch (error) {
      console.warn('Failed to get departments from Firestore, falling back to local:', error);
      this.useFirestore = false;
      return await db.departments.toArray();
    }
  }

  async addDepartment(department: any): Promise<string> {
    try {
      if (this.useFirestore) {
        const id = await FirestoreService.addDepartment(department);
        // Also save locally for offline access
        await db.departments.put({ ...department, id });
        return id;
      } else {
        return await db.departments.put(department);
      }
    } catch (error) {
      console.warn('Failed to add department to Firestore, falling back to local:', error);
      this.useFirestore = false;
      return await db.departments.put(department);
    }
  }

  async updateDepartment(id: string, updates: any): Promise<void> {
    try {
      if (this.useFirestore) {
        await FirestoreService.updateDepartment(id, updates);
        // Also update locally
        const localDept = await db.departments.get(id);
        if (localDept) {
          await db.departments.put({ ...localDept, ...updates });
        }
      } else {
        const dept = await db.departments.get(id);
        if (dept) {
          await db.departments.put({ ...dept, ...updates });
        }
      }
    } catch (error) {
      console.warn('Failed to update department in Firestore, falling back to local:', error);
      this.useFirestore = false;
      const dept = await db.departments.get(id);
      if (dept) {
        await db.departments.put({ ...dept, ...updates });
      }
    }
  }

  async deleteDepartment(id: string): Promise<void> {
    try {
      if (this.useFirestore) {
        await FirestoreService.deleteDepartment(id);
      }
      // Always delete from local
      await db.departments.delete(id);
    } catch (error) {
      console.warn('Failed to delete department from Firestore, deleting locally only:', error);
      this.useFirestore = false;
      await db.departments.delete(id);
    }
  }

  subscribeToDepartments(callback: (departments: any[]) => void): () => void {
    if (this.useFirestore) {
      return FirestoreService.subscribeToDepartments(callback);
    } else {
      // Local subscription simulation
      let unsubscribe: () => void = () => {};
      
      const checkForChanges = async () => {
        const departments = await db.departments.toArray();
        callback(departments);
      };
      
      // Poll for changes every 5 seconds
      const interval = setInterval(checkForChanges, 5000);
      checkForChanges();
      
      return () => clearInterval(interval);
    }
  }

  // Settings
  async getSettings(): Promise<any> {
    try {
      if (this.useFirestore) {
        return await FirestoreService.getSettings();
      } else {
        const settings = await db.settings.toArray();
        return settings.length > 0 ? settings[0] : null;
      }
    } catch (error) {
      console.warn('Failed to get settings from Firestore, falling back to local:', error);
      this.useFirestore = false;
      const settings = await db.settings.toArray();
      return settings.length > 0 ? settings[0] : null;
    }
  }

  async saveSettings(settings: any): Promise<void> {
    try {
      if (this.useFirestore) {
        await FirestoreService.saveSettings(settings);
        // Also save locally
        await db.settings.clear();
        await db.settings.put(settings);
      } else {
        await db.settings.clear();
        await db.settings.put(settings);
      }
    } catch (error) {
      console.warn('Failed to save settings to Firestore, falling back to local:', error);
      this.useFirestore = false;
      await db.settings.clear();
      await db.settings.put(settings);
    }
  }

  subscribeToSettings(callback: (settings: any) => void): () => void {
    if (this.useFirestore) {
      return FirestoreService.subscribeToSettings('default', callback);
    } else {
      // Local subscription simulation
      let unsubscribe: () => void = () => {};
      
      const checkForChanges = async () => {
        const settings = await db.settings.toArray();
        callback(settings.length > 0 ? settings[0] : null);
      };
      
      // Poll for changes every 5 seconds
      const interval = setInterval(checkForChanges, 5000);
      checkForChanges();
      
      return () => clearInterval(interval);
    }
  }

  // Meetings
  async saveMeeting(meetingData: any): Promise<string> {
    try {
      if (this.useFirestore) {
        return await FirestoreService.saveMeeting(meetingData);
      } else {
        return await db.meetings.put(meetingData);
      }
    } catch (error) {
      console.warn('Failed to save meeting to Firestore, falling back to local:', error);
      this.useFirestore = false;
      return await db.meetings.put(meetingData);
    }
  }

  async getMeetings(): Promise<any[]> {
    try {
      if (this.useFirestore) {
        return await FirestoreService.getMeetings();
      } else {
        return await db.meetings.toArray();
      }
    } catch (error) {
      console.warn('Failed to get meetings from Firestore, falling back to local:', error);
      this.useFirestore = false;
      return await db.meetings.toArray();
    }
  }

  // Migration
  async migrateFromLocal(): Promise<void> {
    try {
      if (!this.firestoreAvailable) return;

      // Get all local data
      const localDepartments = await db.departments.toArray();
      const localSettings = await db.settings.toArray();
      const localMeetings = await db.meetings.toArray();

      // Check if Firestore already has data
      const firestoreDepartments = await FirestoreService.getDepartments();
      
      // Only migrate if Firestore is empty and local has data
      if (firestoreDepartments.length === 0 && localDepartments.length > 0) {
        console.log('Migrating local data to Firestore...');
        
        // Migrate departments
        for (const dept of localDepartments) {
          const { id, ...departmentData } = dept;
          await FirestoreService.addDepartment(departmentData);
        }

        // Migrate settings
        if (localSettings.length > 0) {
          await FirestoreService.saveSettings(localSettings[0]);
        }

        console.log('Migration completed successfully');
      }
    } catch (error) {
      console.warn('Migration failed:', error);
    }
  }
}

// Export singleton instance
export const hybridStorageService = new HybridStorageServiceImpl();