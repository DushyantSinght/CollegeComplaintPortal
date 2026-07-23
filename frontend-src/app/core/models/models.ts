export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  studentId?: string;
  department?: string;
  createdAt?: string;
  token?: string;
}

export interface Comment {
  _id?: string;
  author: string;
  authorName: string;
  authorRole: 'student' | 'admin';
  text: string;
  createdAt: string;
}

export interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: 'hostel' | 'academics' | 'facilities' | 'other';
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  student: User | string;
  adminRemarks?: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface StatBucket {
  label: string;
  count: number;
}

export interface ComplaintStats {
  total: number;
  byStatus: { pending: number; 'in-progress': number; resolved: number };
  byCategory: { hostel: number; academics: number; facilities: number; other: number };
  byPriority: { low: number; medium: number; high: number; urgent: number };
  resolutionRate: number;
  avgResolutionDays: number | null;
  weeklyTrend: StatBucket[];
}
