import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { TodoFormComponent } from '../components/todo/todo-form.component';
import { TodoListComponent } from '../components/todo/todo-list.component';

@Component({
  selector: 'app-todo-page',
  imports: [TodoFormComponent, TodoListComponent],
  templateUrl: './todo-page.component.html',
  styleUrl: './todo-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoPageComponent {
  protected auth = inject(AuthService);

  async onLogout(): Promise<void> {
    await this.auth.logout();
  }
}
