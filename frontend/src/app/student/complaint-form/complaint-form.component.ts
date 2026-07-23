import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../core/services/complaint.service';

@Component({
  selector: 'app-complaint-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complaint-form.component.html'
})
export class ComplaintFormComponent {
  title = '';
  description = '';
  category = 'hostel';
  priority = 'medium';
  error = '';
  success = '';
  loading = false;

  @Output() created = new EventEmitter<void>();

  constructor(private complaintService: ComplaintService) {}

  onSubmit(): void {
    this.error = '';
    this.success = '';
    this.loading = true;

    this.complaintService
      .createComplaint({
        title: this.title,
        description: this.description,
        category: this.category,
        priority: this.priority
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = 'Complaint submitted successfully';
          this.title = '';
          this.description = '';
          this.category = 'hostel';
          this.priority = 'medium';
          this.created.emit();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to submit complaint';
        }
      });
  }
}
