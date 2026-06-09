
import { collection, addDoc } from './db';
import { db } from './db';

export const logActivity = async (action: string, details: string, userId: string = 'Anonymous', userType: string = 'Unknown') => {
  try {
    const payload = { action, details, userId, userType, timestamp: Date.now() };
    await addDoc(collection(db, 'announcements'), {
      title: 'ACTIVITY_LOG',
      content: JSON.stringify(payload),
      moduleId: 'system',
      createdAt: Date.now()
    });
  } catch(e) {
    console.error('Failed to log activity:', e);
  }
};
