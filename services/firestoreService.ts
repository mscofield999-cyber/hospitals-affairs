import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Collection names
const COLLECTIONS = {
  DEPARTMENTS: 'departments',
  SETTINGS: 'settings',
  MEETINGS: 'meetings'
};

// Department interface
interface Department {
  id?: string;
  name: string;
  description: string;
  tasks: string[];
  kpis: string[];
  challenges: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Settings interface
interface AppSettings {
  id?: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'ar' | 'en';
  fontSize: number;
  notifications: boolean;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Firestore service class
export class FirestoreService {
  
  // Departments
  static async getDepartments(): Promise<Department[]> {
    try {
      const q = query(collection(db, COLLECTIONS.DEPARTMENTS), orderBy('name'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Department[];
    } catch (error) {
      console.error('Error getting departments:', error);
      throw error;
    }
  }

  static async addDepartment(department: Omit<Department, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.DEPARTMENTS), {
        ...department,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding department:', error);
      throw error;
    }
  }

  static async updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.DEPARTMENTS, id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  static async deleteDepartment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.DEPARTMENTS, id));
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  static subscribeToDepartments(callback: (departments: Department[]) => void): () => void {
    const q = query(collection(db, COLLECTIONS.DEPARTMENTS), orderBy('name'));
    
    return onSnapshot(q, (querySnapshot) => {
      const departments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Department[];
      callback(departments);
    });
  }

  // Settings
  static async getSettings(userId: string = 'default'): Promise<AppSettings | null> {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AppSettings;
      }
      return null;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  static async saveSettings(settings: Omit<AppSettings, 'id'>, userId: string = 'default'): Promise<void> {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
      await updateDoc(settingsRef, {
        ...settings,
        userId,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await this.createSettings(settings, userId);
      } else {
        console.error('Error saving settings:', error);
        throw error;
      }
    }
  }

  private static async createSettings(settings: Omit<AppSettings, 'id'>, userId: string = 'default'): Promise<void> {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
      await updateDoc(settingsRef, {
        ...settings,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error creating settings:', error);
      throw error;
    }
  }

  static subscribeToSettings(userId: string = 'default', callback: (settings: AppSettings | null) => void): () => void {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
    
    return onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as AppSettings);
      } else {
        callback(null);
      }
    });
  }

  // Meetings
  static async saveMeeting(meetingData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.MEETINGS), {
        ...meetingData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving meeting:', error);
      throw error;
    }
  }

  static async getMeetings(): Promise<any[]> {
    try {
      const q = query(collection(db, COLLECTIONS.MEETINGS), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting meetings:', error);
      throw error;
    }
  }

  // Utility methods
  static async migrateFromIndexedDB(localData: any): Promise<void> {
    try {
      // Migrate departments
      if (localData.departments && localData.departments.length > 0) {
        for (const dept of localData.departments) {
          const { id, ...departmentData } = dept;
          await this.addDepartment(departmentData);
        }
      }

      // Migrate settings
      if (localData.settings) {
        await this.saveSettings(localData.settings);
      }

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  // Check Firestore connection
  static async checkConnection(): Promise<boolean> {
    try {
      await getDocs(collection(db, COLLECTIONS.SETTINGS));
      return true;
    } catch (error) {
      console.warn('Firestore connection check failed:', error);
      return false;
    }
  }
}