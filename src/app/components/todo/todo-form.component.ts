import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConvexService } from '../../core/services/convex.service';
import { api } from '../../../../convex/_generated/api';
import { parseConvexError } from '../../shared/utils';

@Component({
  selector: 'app-todo-form',
  imports: [ReactiveFormsModule],
  templateUrl: './todo-form.component.html',
  styleUrl: './todo-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoFormComponent {
  private fb = inject(FormBuilder);
  private convex = inject(ConvexService);

  protected isSubmitting = signal(false);
  protected error = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    text: ['', [Validators.required, Validators.minLength(1)]],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    try {
      const { text } = this.form.getRawValue();
      await this.convex.mutation(api.todos.create, { text: text.trim() });
      this.form.reset();
    } catch (err) {
      this.error.set(parseConvexError(err, 'Failed to add task'));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
