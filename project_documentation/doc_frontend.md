# 📚 Module Documentation: Frontend (AdminSuite UI)

**Role**: The User Interface.
**Stack**: React, TypeScript, Vite, TailwindCSS, React Query.

---

## 📂 File Structure & Explanations

### 1. `api.ts`
**Location**: `src/lib/api.ts`
**Purpose**: The central HTTP client.

```typescript
const api = axios.create({ baseURL: 'http://localhost:8080' });

// INTERCEPTOR (Critical!)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```
*   **Interceptor**: Automatically adds the JWT to *every* request so we don't have to repeat code.

### 2. `authContext.tsx`
**Location**: `src/contexts/authContext.tsx`
**Purpose**: Global State Management (The "Brain").

*   **`createContext`**: React feature to pass data down the tree without props.
*   **`refreshProfile()`**: Our custom function to call `/api/users/me` and update the local user state.

### 3. `Navbar.tsx`
**Location**: `src/components/layout/Navbar.tsx`
**Purpose**: Dynamic Navigation.

```typescript
// DYNAMIC MAPPING
{user?.roles?.modules?.map(module => (
    <NavLink to={`/cms/${module.code}`}>
        {module.name}
    </NavLink>
))}
```
*   **Concept**: The menu is data-driven. It loops through permissions to decide what to show.

### 4. `GenericModulePage.tsx`
**Location**: `src/pages/cms/GenericModulePage.tsx`
**Purpose**: The "Shape-Shifter" Page.

*   **`useQuery(['schema', moduleCode])`**: Fetches the layout (What fields do I show?).
*   **`useQuery(['content', moduleCode])`**: Fetches the data (What rows do I show?).
*   **`DataTable`**: Reusable component that renders columns dynamically based on the Schema.

### 5. `UserForm.tsx` & `UserList.tsx`
**Location**: `src/pages/users/...`
**Purpose**: User Management.

*   **Mutation (`useMutation`)**: React Query helper for POST/PUT/DELETE requests. It handles "Is Loading?", "Is Error?", and "On Success" states automatically.
*   **Invalidation (`queryClient.invalidateQueries`)**: After a mutation (save), tell React Query "The 'users' list is old now. Refetch it."

---

## ⚙️ How It Works (The Lifecycle)

1.  **Boot**: `App.tsx` wraps everything in `QueryClientProvider` (Networking) and `AuthProvider` (Identity).
2.  **Mount**: `AuthContext` runs `useEffect` -> Checks local storage -> Loads User.
3.  **Render**: `Navbar` sees User -> Renders Links.
4.  **Navigation**: User clicks "Gallery".
    *   Router switches to `GenericModulePage` with `moduleCode="GALLERY"`.
    *   Page fetches schema for Gallery.
    *   Page renders table.
5.  **Interaction**: User edits row.
    *   `UserForm` opens.
    *   User clicks Save.
    *   `api.put` sends data to Gateway.
    *   Gateway -> CMS Service -> DB.
    *   Success.
    *   List Refreshes.

---

## 🔑 Important Syntaxes

*   **`useEffect(() => { ... }, [dep])`**: Run this side-effect when `dep` changes.
*   **`{ ...prev, [key]: value }`**: Spread syntax. Essential for immutable state updates in React. "Copy the old state, overwrite just this one key."
*   **`interface User { ... }`**: TypeScript definitions. Ensures we don't misspell "username" as "userName".
