import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintFormComponent } from '../complaint-form/complaint-form.component';
import { ComplaintListComponent } from '../complaint-list/complaint-list.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ComplaintService } from '../../core/services/complaint.service';
import { ComplaintStats } from '../../core/models/models';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, ComplaintFormComponent, ComplaintListComponent, StatCardComponent],
  templateUrl: './student-dashboard.component.html'
})
export class StudentDashboardComponent implements OnInit {
  @ViewChild(ComplaintListComponent) complaintList!: ComplaintListComponent;

  stats: ComplaintStats | null = null;

  constructor(private complaintService: ComplaintService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.complaintService.getStats().subscribe({
      next: (data) => (this.stats = data),
      error: () => {
        /* stats are a nice-to-have; fail silently if unavailable */
      }
    });
  }

  onComplaintCreated(): void {
    this.complaintList.loadComplaints();
    this.loadStats();
  }
}
