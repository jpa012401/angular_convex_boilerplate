import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { AuthLayoutComponent } from './auth-layout.component';
import { parseConvexError } from '../../shared/utils';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected error = signal<string | null>(null);
  protected isSubmitting = signal(false);

  protected form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    try {
      const { name, email, password } = this.form.getRawValue();
      await this.auth.register(email, password, name);
      this.router.navigate(['/todos']);
    } catch (err) {
      this.error.set(parseConvexError(err, 'Registration failed'));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
