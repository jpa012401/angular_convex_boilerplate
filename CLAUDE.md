
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->


## Type System Guidelines

**IMPORTANT**: Never use `Record<string, unknown>`, `any`, or generic object types. Always define proper interfaces.

### Example Pattern

```typescript
// BAD - Never do this
const data: Record<string, unknown> = { ... };
const config: { [key: string]: any } = { ... };

// GOOD - Always use interfaces
interface PDLCreateInput {
  firstName: string;
  lastName: string;
  dateOfBirth: number;
  gender: 'male' | 'female';
  // ... all fields explicitly typed
}

const data: PDLCreateInput = { ... };
```

### Type Sharing Between Angular & Convex

- Define base types in `convex/types/` (source of truth from schema)
- Import and extend in Angular `src/app/shared/types/`
- Use Convex's `Doc<"tableName">` for document types
- Create input/output types for mutations/queries

## Convex API Usage

**IMPORTANT**: Always use the typed API pattern. Never use string-based function calls.

### Correct API Usage

```typescript
import { api } from '../../../../convex/_generated/api';
import { ConvexService } from './convex.service';

// Inject the service
private convex = inject(ConvexService);

// ✅ CORRECT - Use typed API
const user = await this.convex.query(api.users.viewer, {});
await this.convex.mutation(api.setup.completeSetup, { name: 'Test' });
await this.convex.action(api.auth.signIn, { provider: 'password-custom', params: {...} });

// ❌ WRONG - Never use string-based calls
await (this.convex.client as any).query('users:viewer', {});
await this.convex.client.mutation('setup:completeSetup', {...});
```

### Convex Subscriptions

Use `src/app/core/services/convex-subscription.ts` for reactive subscriptions:

```typescript
import { createSubscription, DynamicSubscription } from '../services/convex-subscription';

// For static query args
feeders = createSubscription(
  this.convex,
  this.destroyRef,
  api.feeders.listByUser,
  {}
);
// In template: feeders().data, feeders().isLoading

// For dynamic query args (route params, etc.)
private pdlSubscription = new DynamicSubscription(
  this.convex,
  this.destroyRef,
  api.pdl.getById
);

ngOnInit() {
  this.pdlSubscription.setArgs({ id: this.pdlId });
}
// In template: pdlSubscription.state().data
```

### ConvexService Methods

- `query<Query>(query, args)` - Execute typed queries
- `mutation<Mutation>(mutation, args)` - Execute typed mutations
- `action<Action>(action, args)` - Execute typed actions
- `subscribe<Query>(query, args, callback)` - Subscribe to typed queries