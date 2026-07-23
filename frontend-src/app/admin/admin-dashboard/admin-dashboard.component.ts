import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Complaint, ComplaintStats } from '../../core/models/models';
import { ComplaintService } from '../../core/services/complaint.service';
import { CommentThreadComponent } from '../../shared/components/comment-thread/comment-thread.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { BarChartComponent, ChartDatum } from '../../shared/components/bar-chart/bar-chart.component';
import { DonutChartComponent } from '../../shared/components/donut-chart/donut-chart.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CommentThreadComponent,
    StatCardComponent,
    BarChartComponent,
    DonutChartComponent
  ],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'complaints' | 'analytics' = 'complaints';

  complaints: Complaint[] = [];
  loading = false;
  error = '';
  statusFilter = '';
  priorityFilter = '';
  remarksDraft: { [id: string]: string } = {};
  expandedId: string | null = null;
  postingId: string | null = null;

  stats: ComplaintStats | null = null;
  statsLoading = false;
  statsError = '';

  constructor(private complaintService: ComplaintService) {}

  ngOnInit(): void {
    this.loadComplaints();
  }

  setTab(tab: 'complaints' | 'analytics'): void {
    this.activeTab = tab;
    if (tab === 'analytics' && !this.stats) {
      this.loadStats();
    }
  }

  loadComplaints(): void {
    this.loading = true;
    this.complaintService
      .getComplaints({ status: this.statusFilter, priority: this.priorityFilter })
      .subscribe({
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

  loadStats(): void {
    this.statsLoading = true;
    this.statsError = '';
    this.complaintService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.statsLoading = false;
      },
      error: (err) => {
        this.statsError = err.error?.message || 'Failed to load analytics';
        this.statsLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.loadComplaints();
  }

  updateStatus(complaint: Complaint, newStatus: string): void {
    const remarks = this.remarksDraft[complaint._id] ?? complaint.adminRemarks;
    this.complaintService.updateStatus(complaint._id, newStatus, remarks).subscribe({
      next: () => {
        this.loadComplaints();
        this.stats = null; // stats are now stale; refetch next time the tab is opened
      },
      error: (err) => (this.error = err.error?.message || 'Failed to update status')
    });
  }

  updatePriority(complaint: Complaint, priority: string): void {
    this.complaintService.updatePriority(complaint._id, priority).subscribe({
      next: (updated) => {
        const idx = this.complaints.findIndex((c) => c._id === updated._id);
        if (idx > -1) this.complaints[idx] = updated;
        this.stats = null;
      },
      error: (err) => (this.error = err.error?.message || 'Failed to update priority')
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

  studentName(c: Complaint): string {
    return typeof c.student === 'object' ? c.student.name : 'Unknown';
  }

  statusClass(status: string): string {
    return `status-badge status-${status}`;
  }

  priorityClass(priority: string): string {
    return `priority-badge priority-${priority}`;
  }

  statusChartData(s: ComplaintStats): ChartDatum[] {
    return [
      { label: 'Pending', value: s.byStatus.pending, color: '#f59e0b' },
      { label: 'In Progress', value: s.byStatus['in-progress'], color: '#3b82f6' },
      { label: 'Resolved', value: s.byStatus.resolved, color: '#22c55e' }
    ];
  }

  categoryChartData(s: ComplaintStats): ChartDatum[] {
    return [
      { label: 'Hostel', value: s.byCategory.hostel, color: '#6366f1' },
      { label: 'Academics', value: s.byCategory.academics, color: '#0ea5e9' },
      { label: 'Facilities', value: s.byCategory.facilities, color: '#14b8a6' },
      { label: 'Other', value: s.byCategory.other, color: '#94a3b8' }
    ];
  }

  priorityChartData(s: ComplaintStats): ChartDatum[] {
    return [
      { label: 'Low', value: s.byPriority.low, color: '#94a3b8' },
      { label: 'Medium', value: s.byPriority.medium, color: '#3b82f6' },
      { label: 'High', value: s.byPriority.high, color: '#f97316' },
      { label: 'Urgent', value: s.byPriority.urgent, color: '#dc2626' }
    ];
  }

  trendChartData(s: ComplaintStats): ChartDatum[] {
    return s.weeklyTrend.map((w) => ({ label: w.label, value: w.count }));
  }
}
