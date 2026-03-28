# Angular + Convex Boilerplate

A production-ready boilerplate for building full-stack Angular applications with Convex as the backend. Features password-based authentication, role-based access control, and real-time data synchronization.

## Tech Stack

- **Frontend**: Angular 21 (standalone components, signals)
- **Backend**: Convex (real-time database, serverless functions)
- **Authentication**: Convex Auth with Password provider
- **Styling**: Tailwind CSS 4
- **Environment**: @ngx-env/builder for environment variables

## Features

- Password-based authentication (login/register)
- Role-based access control (admin, secretary, personnel)
- Real-time data synchronization
- Automatic token refresh
- Route guards (auth, guest, role-based)
- Example Todo CRUD application

## Prerequisites

- Node.js 18+
- npm 10+
- Convex account ([sign up here](https://convex.dev))

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd angular-convex-boilerplate
npm install
```

### 2. Configure Convex

```bash
npx convex dev
```

This will:
- Create a new Convex project (or link to existing)
- Generate `.env.local` with your deployment URL
- Start the Convex development server

### 3. Start the Angular Dev Server

In a separate terminal:

```bash
npm start
```

Navigate to `http://localhost:4200/`

## Project Structure

```
├── convex/                     # Convex backend
│   ├── _generated/             # Auto-generated types and API
│   ├── auth.config.ts          # Auth provider configuration
│   ├── auth.ts                 # Auth setup with Password provider
│   ├── http.ts                 # HTTP routes for auth
│   ├── schema.ts               # Database schema
│   ├── users.ts                # User queries
│   └── todos.ts                # Todo CRUD operations
│
├── src/
│   ├── app/
│   │   ├── core/               # Core services and guards
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts      # Authentication service
│   │   │   │   └── auth.provider.ts     # App initializer
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts        # Route guards
│   │   │   │   └── index.ts
│   │   │   └── services/
│   │   │       ├── convex.service.ts    # Convex client wrapper
│   │   │       └── convex-subscription.ts
│   │   │
│   │   ├── components/         # Feature components
│   │   │   ├── auth/           # Login, Register, AuthLayout
│   │   │   └── todo/           # TodoList, TodoItem, TodoForm
│   │   │
│   │   ├── pages/              # Page components
│   │   │   └── todo-page.component.ts
│   │   │
│   │   ├── shared/             # Shared types and utilities
│   │   │   ├── types/
│   │   │   └── utils/          # Error handling utilities
│   │   │
│   │   ├── app.config.ts       # App configuration
│   │   ├── app.routes.ts       # Route definitions
│   │   └── app.ts              # Root component
│   │
│   ├── environments/           # Environment configuration
│   └── styles.css              # Global styles
│
└── .env.local                  # Environment variables (git-ignored)
```

## Core Services

### ConvexService

Wrapper around the Convex client with typed methods for queries, mutations, and actions.

```typescript
import { ConvexService } from './core/services/convex.service';
import { api } from '../../../convex/_generated/api';

// In your component
private convex = inject(ConvexService);

// Query
const todos = await this.convex.query(api.todos.list, {});

// Mutation
await this.convex.mutation(api.todos.create, { text: 'New todo' });

// Subscribe to real-time updates
const unsubscribe = this.convex.subscribe(api.todos.list, {}, (todos) => {
  console.log('Todos updated:', todos);
});
```

### AuthService

Handles authentication state with Angular signals.

```typescript
import { AuthService } from './core/auth/auth.service';

private auth = inject(AuthService);

// Signals (readonly)
auth.user()           // Current user or null
auth.isAuthenticated() // boolean
auth.isLoading()      // boolean

// Computed role checks
auth.isAdmin()
auth.isSecretary()
auth.isPersonnel()
auth.userRole()

// Methods
await auth.login(email, password);
await auth.register(email, password, name, role);
await auth.logout();
auth.hasRole(['admin', 'secretary']);
```

## Error Handling

The `parseConvexError` utility converts Convex error messages into user-friendly text.

```typescript
import { parseConvexError, isAuthError, isNetworkError } from './shared/utils';

try {
  await this.convex.mutation(api.todos.create, { text: '' });
} catch (err) {
  // Converts "Uncaught Error: required field missing\n    at handler..."
  // into "Please fill in all required fields"
  const message = parseConvexError(err);
  this.error.set(message);

  // Optional: handle specific error types
  if (isAuthError(err)) {
    this.router.navigate(['/auth/login']);
  }
}
```

**Features:**
- Strips stack traces and internal Convex details
- Maps common error patterns to friendly messages
- Provides fallback for unknown errors
- Includes helper functions: `isAuthError()`, `isNetworkError()`

## Route Guards

### authGuard

Requires authentication. Redirects to login if not authenticated.

```typescript
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard],
}
```

### guestGuard

Only allows unauthenticated users. Redirects to default route if authenticated.

```typescript
{
  path: 'login',
  component: LoginComponent,
  canActivate: [guestGuard],
}
```

### roleGuard

Requires specific role(s). Configure via route data.

```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [roleGuard],
  data: { roles: ['admin'] },
}

{
  path: 'reports',
  component: ReportsComponent,
  canActivate: [roleGuard],
  data: { roles: ['admin', 'secretary'] },
}
```

## Database Schema

```typescript
// convex/schema.ts
defineSchema({
  ...authTables,  // Convex Auth tables

  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("admin"),
      v.literal("secretary"),
      v.literal("personnel")
    )),
  }),

  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
  }).index("by_userId", ["userId"]),
});
```

## Environment Variables

Environment variables are managed with `@ngx-env/builder`. Variables must be prefixed with `NG_APP_`.

```bash
# .env.local
CONVEX_DEPLOYMENT=dev:your-deployment
CONVEX_URL=https://your-deployment.convex.cloud
NG_APP_CONVEX_URL=https://your-deployment.convex.cloud
```

Access in code:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  convexUrl: import.meta.env.NG_APP_CONVEX_URL || '',
};
```

## Backend Functions

### Users

| Function | Type | Description |
|----------|------|-------------|
| `users.viewer` | Query | Get current authenticated user |
| `users.getUserIdentity` | Query | Get user identity from auth context |

### Todos

| Function | Type | Description |
|----------|------|-------------|
| `todos.list` | Query | List todos for current user |
| `todos.create` | Mutation | Create a new todo |
| `todos.toggle` | Mutation | Toggle todo completion |
| `todos.remove` | Mutation | Delete a todo |

All todo mutations verify ownership before making changes.

## Development

### Commands

```bash
# Start Angular dev server
npm start

# Start Convex dev server
npx convex dev

# Build for production
npm run build

# Run tests
npm test
```

### Adding New Features

1. **Add schema** in `convex/schema.ts`
2. **Create functions** in `convex/` (queries, mutations, actions)
3. **Run Convex** to generate types: `npx convex dev`
4. **Create components** in `src/app/components/`
5. **Add routes** in `src/app/app.routes.ts`

### Protecting Backend Functions

Always verify authentication and authorization in Convex functions:

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";

export const protectedMutation = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check ownership or role before modifying
    const record = await ctx.db.get(args.id);
    if (record.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Proceed with mutation
  },
});
```

## Adding Google OAuth

To add Google authentication alongside the existing password auth:

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URI:
   ```
   https://<your-deployment>.convex.site/api/auth/callback/google
   ```
   (Find your deployment name in `.env.local` under `CONVEX_SITE_URL`)

### 2. Add Environment Variables

Add to Convex dashboard (**Settings > Environment Variables**):

| Variable | Value |
|----------|-------|
| `AUTH_GOOGLE_ID` | Your Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Your Google OAuth Client Secret |

### 3. Update Convex Auth

```typescript
// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@convex-dev/auth/providers/Google";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({ /* existing config */ }),
    Google,
  ],
});
```

### 4. Add Sign-in Method to AuthService

```typescript
// src/app/core/auth/auth.service.ts
async loginWithGoogle(): Promise<void> {
  const result = await this.convex.action(api.auth.signIn, {
    provider: 'google',
  });
  // OAuth will redirect to Google, then back to your callback URL
}
```

### 5. Add Google Button to Login UI

```html
<button (click)="loginWithGoogle()" type="button">
  Sign in with Google
</button>
```

### How It Works

1. User clicks "Sign in with Google"
2. Convex redirects to Google OAuth consent screen
3. User authorizes the app
4. Google redirects back to `CONVEX_SITE_URL/api/auth/callback/google`
5. Convex Auth exchanges the code for tokens and creates/updates the user
6. User is redirected back to your app with a session

## Production Deployment

### Convex

```bash
npx convex deploy
```

### Angular

```bash
npm run build
```

Deploy the `dist/angular-convex-boilerplate` folder to your hosting provider (Vercel, Netlify, etc.).

## License

MIT
