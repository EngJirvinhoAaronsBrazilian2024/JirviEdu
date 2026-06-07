export interface Admin {
  id: string;
  email: string;
  createdAt: number;
}

export interface Student {
  id: string;
  regNumber: string;
  fullName: string;
  email: string;
  course: string;
  status: 'active' | 'inactive';
  photoUrl?: string;
  password?: string;
  createdAt: number;
}

export interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: number;
}

export interface Enrollment {
  id: string; // studentId
  studentId: string;
  enrolledAt: number;
}

export interface Lecture {
  id: string;
  title: string;
  meetLink: string;
  date: string;
  time: string;
  createdAt: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  startTime?: number;
  deadline: number;
  marks: number;
  fileUrl: string;
  createdAt: number;
}

export interface Submission {
  id: string; // studentId
  fileUrl: string;
  submittedAt: number;
  grade: number;
  feedback: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  moduleId: string;
  createdAt: number;
}
