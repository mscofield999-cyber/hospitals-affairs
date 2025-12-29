
import { db } from './db';
import { checkGeminiConnection } from './geminiService';
import { analytics, auth } from './firebase';
import { FirestoreService } from './firestoreService';

export interface DiagnosticResult {
  id: string;
  name: string;
  status: 'ok' | 'warning' | 'error' | 'loading';
  message: string;
}

export const runSystemDiagnostics = async (): Promise<DiagnosticResult[]> => {
  const results: DiagnosticResult[] = [];

  // 1. Browser Connectivity
  results.push({
    id: 'network',
    name: 'الاتصال بالإنترنت',
    status: navigator.onLine ? 'ok' : 'error',
    message: navigator.onLine ? 'متصل' : 'لا يوجد اتصال بالشبكة'
  });

  // 2. Database Health (Dexie)
  try {
    const count = await db.meetings.count();
    results.push({
      id: 'db',
      name: 'قاعدة البيانات المحلية (IndexedDB)',
      status: 'ok',
      message: `تعمل بشكل جيد (${count} محاضر مسجلة)`
    });
  } catch (e: any) {
    results.push({
      id: 'db',
      name: 'قاعدة البيانات المحلية',
      status: 'error',
      message: `فشل الاتصال: ${e.message}`
    });
  }

  // 3. Audio / Microphone Permissions
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Clean up immediately
    results.push({
      id: 'mic',
      name: 'صلاحيات الميكروفون',
      status: 'ok',
      message: 'تم منح الصلاحية'
    });
  } catch (e: any) {
    results.push({
      id: 'mic',
      name: 'صلاحيات الميكروفون',
      status: 'warning',
      message: 'لم يتم منح الصلاحية أو الجهاز غير متوفر. لن يعمل المساعد الصوتي.'
    });
  }

  // 4. Gemini AI Connection
  const geminiStatus = await checkGeminiConnection();
  results.push({
    id: 'ai',
    name: 'اتصال الذكاء الاصطناعي (Gemini)',
    status: geminiStatus ? 'ok' : 'error',
    message: geminiStatus ? 'متصل وجاهز' : 'فشل الاتصال. تحقق من مفتاح API أو الشبكة.'
  });

  // 5. Firebase Analytics
  results.push({
    id: 'firebase',
    name: 'تحليلات Firebase',
    status: analytics ? 'ok' : 'warning',
    message: analytics ? 'تم التهيئة بنجاح' : 'لم يتم التفعيل أو حدث خطأ في التهيئة'
  });

  // 6. Firebase Auth
  results.push({
    id: 'firebaseAuth',
    name: 'مصادقة Firebase',
    status: auth.currentUser ? 'ok' : 'warning',
    message: auth.currentUser ? 'مفعل (مستخدم مجهول)' : 'غير مفعل بعد'
  });

  // 7. Firestore Cloud Storage
  try {
    const dashboardDepartments = await FirestoreService.getDashboardDepartments();
    results.push({
      id: 'firestore',
      name: 'تخزين السحابة (Firestore)',
      status: 'ok',
      message: `متصل (${dashboardDepartments.length} إدارات)`
    });
  } catch (e: any) {
    results.push({
      id: 'firestore',
      name: 'تخزين السحابة (Firestore)',
      status: 'error',
      message: e?.code ? `${e.code}: ${e.message}` : `فشل الاتصال: ${e?.message ?? 'غير معروف'}`
    });
  }

  return results;
};
