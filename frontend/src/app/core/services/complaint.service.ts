import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Complaint, ComplaintStats } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private apiUrl = `${environment.apiUrl}/complaints`;

  constructor(private http: HttpClient) {}

  getComplaints(filters?: { status?: string; category?: string; priority?: string }): Observable<Complaint[]> {
    let params = '';
    if (filters) {
      const query = Object.entries(filters)
        .filter(([, v]) => !!v)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (query) params = `?${query}`;
    }
    return this.http.get<Complaint[]>(`${this.apiUrl}${params}`);
  }

  getComplaint(id: string): Observable<Complaint> {
    return this.http.get<Complaint>(`${this.apiUrl}/${id}`);
  }

  createComplaint(data: {
    title: string;
    description: string;
    category: string;
    priority?: string;
  }): Observable<Complaint> {
    return this.http.post<Complaint>(this.apiUrl, data);
  }

  updateStatus(id: string, status: string, adminRemarks?: string): Observable<Complaint> {
    return this.http.put<Complaint>(`${this.apiUrl}/${id}/status`, { status, adminRemarks });
  }

  updatePriority(id: string, priority: string): Observable<Complaint> {
    return this.http.put<Complaint>(`${this.apiUrl}/${id}/priority`, { priority });
  }

  addComment(id: string, text: string): Observable<Complaint> {
    return this.http.post<Complaint>(`${this.apiUrl}/${id}/comments`, { text });
  }

  getStats(): Observable<ComplaintStats> {
    return this.http.get<ComplaintStats>(`${this.apiUrl}/stats`);
  }

  deleteComplaint(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
