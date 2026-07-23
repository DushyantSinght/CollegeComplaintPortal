import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  role = 'student';
  studentId = '';
  department = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error = '';
    this.loading = true;
    this.auth
      .register({
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role,
        studentId: this.studentId,
        department: this.department
      })
      .subscribe({
        next: (user) => {
          this.loading = false;
          this.router.navigate([user.role === 'admin' ? '/admin' : '/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Registration failed';
        }
      });
  }
}
