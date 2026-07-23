import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  name = '';
  email = '';
  studentId = '';
  department = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  profileError = '';
  profileSuccess = '';
  profileLoading = false;

  passwordError = '';
  passwordSuccess = '';
  passwordLoading = false;

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user) {
      this.name = user.name;
      this.email = user.email;
      this.studentId = user.studentId || '';
      this.department = user.department || '';
    }
  }

  get initials(): string {
    const name = this.auth.currentUser?.name;
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  }

  get memberSince(): string {
    const created = this.auth.currentUser?.createdAt;
    if (!created) return '—';
    return new Date(created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  saveProfile(): void {
    this.profileError = '';
    this.profileSuccess = '';
    this.profileLoading = true;

    this.auth
      .updateProfile({
        name: this.name,
        email: this.email,
        studentId: this.studentId,
        department: this.department
      })
      .subscribe({
        next: () => {
          this.profileLoading = false;
          this.profileSuccess = 'Profile updated successfully';
        },
        error: (err) => {
          this.profileLoading = false;
          this.profileError = err.error?.message || 'Failed to update profile';
        }
      });
  }

  savePassword(): void {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'New password and confirmation do not match';
      return;
    }

    this.passwordLoading = true;
    this.auth
      .changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword })
      .subscribe({
        next: () => {
          this.passwordLoading = false;
          this.passwordSuccess = 'Password updated successfully';
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        },
        error: (err) => {
          this.passwordLoading = false;
          this.passwordError = err.error?.message || 'Failed to update password';
        }
      });
  }
}
