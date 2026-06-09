
import { collection, addDoc } from './db';
import { db } from './db';

export const logActivity = async (action: string, details: string, userId: string = 'Anonymous', userType: string = 'Unknown') => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      action,
      details,
      userId,
      userType,
      createdAt: Date.now()
    });
  } catch(e) {
    console.error('Failed to log activity:', e);
  }
};
