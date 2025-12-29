import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  getDocs, 
  getDoc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppSettings, Meeting, MeetingDepartment } from '../types';

// Collection names
const COLLECTIONS = {
  DEPARTMENTS: 'departments',
  SETTINGS: 'settings',
  MEETINGS: 'meetings'
};

// Firestore service class
export class FirestoreService {
  
  // Departments
  static async getDepartments(): Promise<(MeetingDepartment & { id: string })[]> {
    try {
      const q = query(collection(db, COLLECTIONS.DEPARTMENTS), orderBy('name'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (MeetingDepartment & { id: string })[];
    } catch (error) {
      console.error('Error getting departments:', error);
      throw error;
    }
  }

  static async addDepartment(department: Omit<MeetingDepartment, 'id'>): Promise<string> {
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

  static async updateDepartment(id: string, updates: Partial<MeetingDepartment>): Promise<void> {
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

  static subscribeToDepartments(callback: (departments: (MeetingDepartment & { id: string })[]) => void): () => void {
    const q = query(collection(db, COLLECTIONS.DEPARTMENTS), orderBy('name'));
    
    return onSnapshot(q, (querySnapshot) => {
      const departments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (MeetingDepartment & { id: string })[];
      callback(departments);
    });
  }

  // Settings
  static async getSettings(userId: string = 'default'): Promise<(AppSettings & { id: string }) | null> {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as (AppSettings & { id: string });
      }
      return null;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  static async saveSettings(settings: AppSettings, userId: string = 'default'): Promise<void> {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
      const existing = await getDoc(settingsRef);
      const createdAt = existing.exists() ? (existing.data() as any).createdAt ?? Timestamp.now() : Timestamp.now();

      await setDoc(
        settingsRef,
        {
          ...settings,
          userId,
          createdAt,
          updatedAt: Timestamp.now()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  static subscribeToSettings(userId: string = 'default', callback: (settings: (AppSettings & { id: string }) | null) => void): () => void {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
    
    return onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as (AppSettings & { id: string }));
      } else {
        callback(null);
      }
    });
  }

  // Meetings
  static async saveMeeting(meetingData: Meeting): Promise<string> {
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

  static async getMeetings(): Promise<(Meeting & { id: string })[]> {
    try {
      const q = query(collection(db, COLLECTIONS.MEETINGS), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Meeting & { id: string })[];
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
