# Frontend Documentation

## Overview
This document provides a comprehensive overview of the frontend codebase structure, patterns, and conventions used in the Urban Furniture Accounting System.

## Code Documentation Standards

All frontend code follows these documentation standards:

### 1. File-Level Comments
Every `.ts` and `.tsx` file includes a file-level JSDoc comment explaining:
- **What the file does** - High-level purpose and responsibilities
- **Role in the app** - How it fits into the overall architecture
- **Who consumes this** - Which components/features depend on it
- **Key patterns** - Important architectural decisions or flows

Example:
```typescript
/**
 * @file use-login-form.ts
 *
 * Custom hook that owns all login form logic.
 *
 * What this file does:
 * - Manages form fields, validation errors, and UI toggles (show password, remember me)
 * - Validates locally, then calls AuthContext.login via React Query
 * - Maps API errors back to field messages and banner notices
 *
 * Who consumes this:
 * - `LoginForm` component — renders UI and wires inputs to this hook's return values
 */
```

### 2. Function-Level Comments
Complex functions and React components include inline comments explaining:
- Purpose and responsibilities
- Key parameters and return values
- Important side effects
- Flow of execution for multi-step operations

Example:
```typescript
/**
 * Hook for the login form — state, validation, submit, and error handling.
 *
 * State owned:
 * - `fields` — login_id and password input values
 * - `errors` — per-field validation/API error messages
 * - `rememberDevice` — whether to persist session in localStorage
 * - `showPassword` — toggles password visibility
 * - `notice` — top-of-form banner (error/info)
 *
 * Flow:
 * 1. User submits → validate locally
 * 2. If valid → loginMutation calls AuthContext.login
 * 3. Success → router.push("/")
 * 4. Failure → map status codes (422, 401, 403) to user messages
 */
export function useLoginForm() {
  // Implementation
}
```

## Centralized Constants

All HTTP status codes, error codes, and magic strings are centralized in `/src/lib/constants.ts`:

### HTTP Status Codes
```typescript
import { HTTP_STATUS } from "@/lib/constants";

// Instead of:
if (error.status === 401) { }

// Use:
if (error.status === HTTP_STATUS.UNAUTHORIZED) { }
```

Available status codes:
- `HTTP_STATUS.OK` (200)
- `HTTP_STATUS.CREATED` (201)
- `HTTP_STATUS.NO_CONTENT` (204)
- `HTTP_STATUS.BAD_REQUEST` (400)
- `HTTP_STATUS.UNAUTHORIZED` (401)
- `HTTP_STATUS.FORBIDDEN` (403)
- `HTTP_STATUS.NOT_FOUND` (404)
- `HTTP_STATUS.CONFLICT` (409)
- `HTTP_STATUS.UNPROCESSABLE_ENTITY` (422)
- `HTTP_STATUS.TOO_MANY_REQUESTS` (429)
- `HTTP_STATUS.INTERNAL_SERVER_ERROR` (500)
- `HTTP_STATUS.SERVICE_UNAVAILABLE` (503)

### Storage Keys
```typescript
import { STORAGE_KEYS } from "@/lib/constants";

// Auth token key
localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

// User data key
localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));

// Theme preference
localStorage.setItem(STORAGE_KEYS.THEME, theme);
```

### React Query Cache Keys
```typescript
import { QUERY_KEYS } from "@/lib/constants";

// Lists
useQuery({ queryKey: QUERY_KEYS.CONTACTS, ... });
useQuery({ queryKey: QUERY_KEYS.PRODUCTS, ... });

// Detail views
useQuery({ queryKey: QUERY_KEYS.CONTACT_DETAIL(id), ... });
useQuery({ queryKey: QUERY_KEYS.PRODUCT_DETAIL(id), ... });
```

### User Roles
```typescript
import { USER_ROLES } from "@/lib/constants";

if (user.role === USER_ROLES.ADMIN) {
  // Admin-only logic
}
```

### Document Statuses
```typescript
import { PO_STATUS, BILL_STATUS, SALES_ORDER_STATUS } from "@/lib/constants";

// Purchase orders
const isPoDraft = po.status === PO_STATUS.DRAFT;

// Vendor bills
const isBillPosted = bill.status === BILL_STATUS.POSTED;

// Sales orders
const isSoConfirmed = so.status === SALES_ORDER_STATUS.CONFIRMED;
```

## Architecture Patterns

### Authentication Flow
1. **Login**: User submits credentials → `useLoginForm` hook validates → Calls `AuthContext.login()`
2. **Session Management**: Token stored in localStorage (remember me) or sessionStorage
3. **Bootstrap**: On app load, `AuthContext` validates stored token via `/auth/me` endpoint
4. **Cache**: User data cached in React Context and browser storage
5. **Logout**: Clears both token and user data from all storage locations

### Data Fetching with React Query
```typescript
// Query pattern
const { data, isLoading, error } = useQuery({
  queryKey: QUERY_KEYS.CONTACTS,
  queryFn: () => fetchContacts(),
});

// Mutation pattern
const mutation = useMutation({
  mutationFn: (payload) => createContact(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTACTS });
  },
});
```

### Error Handling Pattern
```typescript
try {
  const result = await apiFetch("/api/endpoint", { auth: true });
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === HTTP_STATUS.UNPROCESSABLE_ENTITY && error.fields) {
      // Handle field-level validation errors
      setErrors(error.fields);
    } else if (error.status === HTTP_STATUS.UNAUTHORIZED) {
      // Handle authentication errors
      redirectToLogin();
    } else if (error.status === HTTP_STATUS.FORBIDDEN) {
      // Handle authorization errors
      showAccessDenied();
    }
  }
}
```

### Route Protection
```typescript
// Protected routes wrapped in RequireAuth
export default function AppLayout({ children }) {
  return (
    <RequireAuth>
      {children}
    </RequireAuth>
  );
}

// Role-based protection
export default function AdminPage() {
  return (
    <RequireRole role={USER_ROLES.ADMIN}>
      {/* Admin-only content */}
    </RequireRole>
  );
}
```

## File Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (app)/                   # Protected app routes (requires auth)
│   │   ├── layout.tsx           # Main app layout with sidebar
│   │   ├── page.tsx             # Dashboard (home)
│   │   ├── contacts/            # Contact management
│   │   ├── products/            # Product catalog
│   │   ├── purchase-orders/     # Purchase order workflow
│   │   ├── vendor-bills/        # Vendor bill management
│   │   └── admin/               # Admin-only pages
│   ├── (auth)/                  # Public auth routes (login/signup)
│   │   ├── layout.tsx           # Auth layout (centered form)
│   │   ├── login/page.tsx       # Login page
│   │   └── signup/page.tsx      # Registration page
│   └── layout.tsx               # Root layout (providers)
│
├── components/                   # Shared/reusable components
│   ├── ui/                      # Base UI components (button, input, etc.)
│   ├── data-table.tsx           # Generic data table with search/pagination
│   ├── require-auth.tsx         # Auth guard wrapper
│   ├── require-role.tsx         # Role-based access control wrapper
│   └── ...                      # Other shared components
│
├── features/                     # Feature-specific modules
│   ├── auth/                    # Authentication feature
│   │   ├── api.ts              # Auth API calls
│   │   ├── auth-context.tsx    # Auth state management
│   │   ├── components/         # Auth UI components
│   │   ├── hooks/              # Auth custom hooks
│   │   ├── validation.ts       # Auth form validation
│   │   └── error-mapping.ts    # API error to UI error mapping
│   ├── master-data/            # Contacts, products, accounts
│   ├── purchase-orders/        # PO management
│   ├── vendor-bills/           # Bill management
│   ├── sales-orders/           # SO management
│   └── dashboard/              # Dashboard stats and widgets
│
├── hooks/                        # Global custom hooks
│   └── use-mounted.ts           # SSR-safe mount detection
│
└── lib/                          # Core utilities and types
    ├── api.ts                   # HTTP client (apiFetch wrapper)
    ├── constants.ts             # Centralized constants
    ├── types.ts                 # TypeScript type definitions
    ├── format.ts                # Display formatting (currency, dates)
    └── utils.ts                 # Utility functions
```

## Key Libraries

- **Next.js 14** - React framework with App Router
- **React Query** - Server state management and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **date-fns** - Date manipulation

## Development Guidelines

### Adding New Features
1. Create feature directory under `src/features/`
2. Add API layer (`*-api.ts`) with well-documented functions
3. Create React Query hooks in `queries.ts` or custom hook files
4. Build UI components with proper TypeScript types
5. Add centralized constants if needed
6. Document all public functions and complex logic

### Error Handling
- Always use `HTTP_STATUS` constants for status code checks
- Map API field errors to form fields consistently
- Show user-friendly error messages
- Log detailed errors to console in development

### Authentication
- Use `useAuth()` hook to access auth state
- Wrap protected routes in `<RequireAuth>`
- Use `<RequireRole>` for role-based access control
- Always pass `{ auth: true }` to `apiFetch` for protected endpoints

### State Management
- Use React Query for server state (API data)
- Use React Context for global client state (auth, theme)
- Use local state (useState) for UI-only state
- Use URL search params for shareable filter/page state

## Testing Approach
- Unit tests for utility functions and validation logic
- Integration tests for API layers with mock responses
- E2E tests for critical user flows (login, create PO, etc.)
- Manual testing checklist for each feature

## Common Patterns

### Form Handling
All forms follow this pattern:
1. Custom hook manages state, validation, and submission
2. Component renders UI and wires to hook's return values
3. Validation happens on submit (client-side)
4. API errors mapped to form fields or banner notices
5. Success redirects or shows success message

### Data Tables
All list views use the `DataTable` component:
- Client-side search/filter/pagination by default
- Can switch to server-side mode with callbacks
- Consistent empty states and loading spinners
- Mobile-responsive with horizontal scroll

### Status Badges
Use centralized badge components:
- `POStatusBadge` for purchase orders
- `VendorBillStatusBadge` for bills
- `SOStatusBadge` for sales orders
- Each maps status to consistent colors and labels

## Performance Optimizations

### React Query Caching
- List queries cached for 5 minutes
- Detail queries cached until invalidated
- Background refetch on window focus
- Optimistic updates for mutations

### Code Splitting
- Route-based code splitting via Next.js
- Dynamic imports for heavy components
- Lazy loading for modals and dropdowns

### Image Optimization
- Next.js Image component for automatic optimization
- WebP format with fallbacks
- Lazy loading by default

## Accessibility
- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management for modals and dropdowns
- Color contrast meets WCAG AA standards

## Browser Support
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript features
- CSS Grid and Flexbox
- LocalStorage and SessionStorage APIs

## Environment Variables
```bash
# API Backend URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Feature Flags (if needed)
# NEXT_PUBLIC_FEATURE_SALES_ORDERS=true
```

## Deployment
1. Build: `npm run build`
2. Test build locally: `npm start`
3. Deploy to Vercel/Netlify or serve `out/` directory
4. Set environment variables in hosting platform
5. Configure custom domain if needed

## Contributing
1. Follow existing code patterns and conventions
2. Add comments for complex logic
3. Use centralized constants instead of magic strings/numbers
4. Test changes locally before committing
5. Update this documentation when adding new patterns

## Additional Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
