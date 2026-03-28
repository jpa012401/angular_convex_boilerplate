import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { AuthLayoutComponent } from './auth-layout.component';
import { parseConvexError } from '../../shared/utils';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected error = signal<string | null>(null);
  protected isSubmitting = signal(false);

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      this.router.navigate(['/todos']);
    } catch (err) {
      this.error.set(parseConvexError(err, 'Login failed'));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
