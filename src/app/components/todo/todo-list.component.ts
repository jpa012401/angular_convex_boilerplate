import { Component, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { ConvexService } from '../../core/services/convex.service';
import { createSubscription } from '../../core/services/convex-subscription';
import { api } from '../../../../convex/_generated/api';
import { TodoItemComponent } from './todo-item.component';

@Component({
  selector: 'app-todo-list',
  imports: [TodoItemComponent],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListComponent {
  private convex = inject(ConvexService);
  private destroyRef = inject(DestroyRef);

  protected todos = createSubscription(this.convex, this.destroyRef, api.todos.list, {});
}
