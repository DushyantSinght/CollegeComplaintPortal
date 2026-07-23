import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Complaint } from '../../core/models/models';
import { ComplaintService } from '../../core/services/complaint.service';
import { CommentThreadComponent } from '../../shared/components/comment-thread/comment-thread.component';

@Component({
  selector: 'app-complaint-list',
  standalone: true,
  imports: [CommonModule, CommentThreadComponent],
  templateUrl: './complaint-list.component.html'
})
export class ComplaintListComponent implements OnInit {
  complaints: Complaint[] = [];
  loading = false;
  error = '';
  expandedId: string | null = null;
  postingId: string | null = null;

  constructor(private complaintService: ComplaintService) {}

  ngOnInit(): void {
    this.loadComplaints();
  }

  loadComplaints(): void {
    this.loading = true;
    this.complaintService.getComplaints().subscribe({
      next: (data) => {
        this.complaints = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load complaints';
        this.loading = false;
      }
    });
  }

  deleteComplaint(id: string): void {
    if (!confirm('Delete this complaint?')) return;
    this.complaintService.deleteComplaint(id).subscribe({
      next: () => this.loadComplaints(),
      error: (err) => (this.error = err.error?.message || 'Failed to delete')
    });
  }

  toggleThread(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  onAddComment(complaint: Complaint, text: string): void {
    this.postingId = complaint._id;
    this.complaintService.addComment(complaint._id, text).subscribe({
      next: (updated) => {
        const idx = this.complaints.findIndex((c) => c._id === updated._id);
        if (idx > -1) this.complaints[idx] = updated;
        this.postingId = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to post comment';
        this.postingId = null;
      }
    });
  }

  statusClass(status: string): string {
    return `status-badge status-${status}`;
  }

  priorityClass(priority: string): string {
    return `priority-badge priority-${priority}`;
  }
}
