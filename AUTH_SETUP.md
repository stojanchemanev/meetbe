# Authentication Implementation

## Overview

A complete login and register system has been implemented for both business and client users, using Supabase Auth with role-based access control.

## Components Created/Updated

### 1. **Supabase Database Migrations**

#### `supabase/migrations/002_create_users_table.sql`

- Creates `users` table with columns: id, email, name, role, avatar, created_at, updated_at
- Links to Supabase Auth.users table via foreign key
- Adds indexes for email and role lookup

#### `supabase/migrations/003_add_fk_business_owner.sql`

- Adds foreign key constraint from businesses.owner_id to users.id

### 2. **Server Actions** (`app/actions/`)

#### `app/actions/auth.ts`

Server actions for authentication:

- `signUp(email, password, name, role)` - Create new user account
- `signIn(email, password)` - Login user
- `signOut()` - Logout user
- `getCurrentUser()` - Fetch current user profile from database

#### `app/actions/businesses.ts`

Updated server actions for business management:

- `fetchBusinesses(limit)` - Get list of businesses
- `createBusiness(...)` - Create business (business users only)
- `updateBusiness(...)` - Update business profile
- `getBusiness(id)` - Get specific business
- `getUserBusiness()` - Get current user's business

### 3. **AuthContext** (`src/context/AuthContext.tsx`)

Updated to use Supabase:

- Uses server actions for auth operations
- Fetches user profile from database on mount
- Exposes `login`, `register`, `logout`, `user`, `loading`
- Returns async functions with error handling

### 4. **Auth Hooks** (`src/hooks/useAuth.ts`)

Helper hooks for component usage:

- `useCurrentUser()` - Get logged-in user
- `useIsClient()` - Check if user is a client
- `useIsBusiness()` - Check if user is a business
- `useIsAdmin()` - Check if user is an admin
- `useRequireAuth(role?)` - Require authentication (optionally specific role)

### 5. **Pages**

#### `app/login/page.tsx`

- Updated to use password field (was demo-only before)
- Handles both client and business login
- Shows error messages
- Redirects authenticated users to home page

#### `app/register/page.tsx` (NEW)

- Registration form with:
    - Name, email, password fields
    - Role selection (Client or Business)
    - Password confirmation
    - Error handling
    - Link to login page

## Database Schema

### users table

```
id (UUID, PK, FK to auth.users)
email (VARCHAR, UNIQUE)
name (VARCHAR)
role (VARCHAR) - CLIENT, BUSINESS, or ADMIN
avatar (TEXT, nullable)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### businesses table

Updated to reference users table:

- owner_id now has foreign key constraint to users(id)

## Usage Examples

### In Components

```tsx
import { useAuth } from "@/src/context/AuthContext";
import { useIsBusiness } from "@/src/hooks/useAuth";

function MyComponent() {
    const { user, logout } = useAuth();
    const isBusiness = useIsBusiness();

    return (
        <div>
            {user && <p>Hello, {user.name}</p>}
            {isBusiness && <p>You are a business owner</p>}
            <button onClick={() => logout()}>Logout</button>
        </div>
    );
}
```

### In Server Actions

```tsx
import { getCurrentUser } from "@/app/actions/auth";
import { createBusiness } from "@/app/actions/businesses";

async function handleCreateBusiness(data: FormData) {
    const { user } = await getCurrentUser();
    if (!user) return;

    const result = await createBusiness(
        data.get("name"),
        data.get("description"),
        data.get("category"),
        data.get("address"),
    );

    if (result.error) {
        console.error(result.error);
    }
}
```

## Flow

### Registration

1. User chooses role (Client or Business)
2. Enters name, email, password
3. Server action `signUp` creates auth user and user profile
4. User is logged in automatically
5. Redirected to home page

### Login

1. User selects role
2. Enters email and password
3. Server action `signIn` authenticates with Supabase
4. User profile fetched from database
5. AuthContext updated with user data
6. Redirected to home page

### Business Operations

- Only users with BUSINESS role can:
    - Create businesses via `createBusiness`
    - Update their business via `updateBusiness`
    - Get their business via `getUserBusiness`

## Protected Routes

The existing `ProtectedRoute` component works with the new auth system. Use it to protect pages:

```tsx
import ProtectedRoute from "@/src/components/shared/ProtectedRoute";
import { UserRole } from "@/src/types";

export default function BusinessDashboard() {
    return (
        <ProtectedRoute role={UserRole.BUSINESS}>
            <Dashboard />
        </ProtectedRoute>
    );
}
```

## Environment Variables

Make sure your `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
```

## Next Steps

1. Run database migrations to create the users table
2. Test registration flow
3. Test login flow
4. Build business dashboard/profile management
5. Add email verification if needed
6. Add password reset functionality
