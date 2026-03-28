import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { ConvexService } from '../../core/services/convex.service';
import { api } from '../../../../convex/_generated/api';
import type { Doc } from '../../../../convex/_generated/dataModel';

@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoItemComponent {
  private convex = inject(ConvexService);

  todo = input.required<Doc<'todos'>>();

  async onToggle(): Promise<void> {
    await this.convex.mutation(api.todos.toggle, { id: this.todo()._id });
  }

  async onDelete(): Promise<void> {
    await this.convex.mutation(api.todos.remove, { id: this.todo()._id });
  }
}
