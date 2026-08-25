# React Hydration Fix Pattern for Next.js + Zustand

## The Problem

When using Zustand stores with localStorage persistence in Next.js, you'll encounter hydration mismatches because:

1. **Server-Side Rendering (SSR):**
   - No access to `window`, `localStorage`, or browser APIs
   - Renders with default/initial state values
   - Example: Empty message list, default language "en"

2. **Client-Side Hydration:**
   - Immediately reads from localStorage when store initializes
   - Has user's actual persisted data
   - Example: User's messages, selected language "id"

3. **React Hydration Error:**
   - React expects server HTML to match initial client render
   - Sees different content → throws hydration mismatch error
   - App still works, but with console errors and potential visual flicker

## The Solution Pattern

```typescript
'use client';

import { useState, useEffect } from 'react';

export function Component() {
  const dataFromStore = useStore((s) => s.data); // Data from localStorage
  const [isMounted, setIsMounted] = useState(false);

  // Mark as mounted after client-side hydration completes
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Render same "safe" content on server and during initial client render
  if (!isMounted) {
    return <div>Loading...</div>; // or skeleton UI
  }

  // After mount, safe to render with store data
  return <div>{dataFromStore}</div>;
}
```

## Why This Works

1. **Server renders:** `isMounted = false` → Shows skeleton
2. **Client first render:** `isMounted = false` → Shows skeleton (matches server!)
3. **After useEffect:** `isMounted = true` → Shows real data
4. **No mismatch:** Server and client initial render are identical

## Real-World Examples

### Example 1: Sidebar with Translations

```typescript
export function Sidebar() {
  const language = useSettingsStore((s) => s.language); // From localStorage
  const t = getTranslation(language);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <aside className="sidebar-skeleton" />;
  }

  return (
    <aside>
      <button>{t.nav.chat}</button> {/* Safe to use translations now */}
    </aside>
  );
}
```

### Example 2: Message List with Persisted Data

```typescript
export function MessageList() {
  const messages = useChatStore((s) => s.getActiveMessages()); // From localStorage
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always render empty state during SSR and initial hydration
  if (!isMounted || messages.length === 0) {
    return <EmptyState />;
  }

  // After mount, safe to render messages
  return (
    <div>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

### Example 3: Conditional Content Based on Auth

```typescript
export function UserMenu() {
  const user = useAuthStore((s) => s.user); // From localStorage
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="user-menu-skeleton" />;
  }

  return user ? <LoggedInMenu user={user} /> : <LoginButton />;
}
```

## Alternative Approaches

### 1. Suppress Hydration Warning (Not Recommended)

```typescript
// This hides the error but doesn't fix the root cause
<div suppressHydrationWarning>
  {language === 'id' ? 'Percakapan' : 'Chat'}
</div>
```

**Problems:**
- Only suppresses the warning, doesn't prevent the issue
- Can cause visual flicker when content updates
- Hides potential bugs

### 2. Dynamic Import (Overkill for Simple Cases)

```typescript
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./Sidebar'), {
  ssr: false, // Disable SSR entirely
});
```

**Problems:**
- Disables SSR entirely for the component
- Worse SEO and initial load performance
- More complex code

### 3. Use `useLayoutEffect` (Doesn't Fix SSR)

```typescript
useLayoutEffect(() => {
  // Still runs AFTER initial render
  setIsMounted(true);
}, []);
```

**Problems:**
- Runs after DOM is created but before paint
- Still doesn't fix server/client mismatch
- Only useful for DOM measurements

## When to Use This Pattern

✅ **Use this pattern when:**
- Component reads from Zustand store with localStorage persistence
- Component uses browser APIs (`window`, `localStorage`, etc.)
- Component renders different content based on client-side data
- Component uses user preferences that vary per device

❌ **Don't need this pattern when:**
- Component only uses props (already safe)
- Component uses server data from database
- Component is static and doesn't change per user
- Component uses CSS media queries (these work in SSR)

## Performance Considerations

### Trade-offs:
- **Pro:** Fixes hydration errors and visual flicker
- **Con:** Adds minimal delay before showing real content
- **Con:** Small JavaScript overhead for state management

### Optimization:
```typescript
// Instead of full skeleton, show partial UI
if (!isMounted) {
  return (
    <aside>
      <div className="logo" /> {/* Static, safe to render */}
      <div className="nav-skeleton" /> {/* Placeholder */}
    </aside>
  );
}
```

## Common Mistakes

### ❌ Mistake 1: Using `typeof window !== 'undefined'`

```typescript
// This STILL causes hydration mismatch!
const data = typeof window !== 'undefined' ? localStorage.getItem('data') : null;
```

**Why it fails:** The check happens during render, so server renders null, client renders data → mismatch!

### ❌ Mistake 2: Checking in Render Without State

```typescript
// This checks on every render but doesn't solve hydration
if (typeof window === 'undefined') return null;
return <div>{dataFromLocalStorage}</div>;
```

**Why it fails:** Server check passes (returns null), client check passes (renders data) → mismatch!

### ❌ Mistake 3: Using `useEffect` Without State

```typescript
useEffect(() => {
  // This runs AFTER initial render, too late!
  forceUpdate();
}, []);
```

**Why it fails:** Hydration already happened by the time this runs.

## Testing Your Fix

1. **Enable SSR warnings in development**
2. **Hard refresh the page** (Ctrl+Shift+R)
3. **Check console for hydration errors**
4. **Verify no content flicker on load**
5. **Test with both empty and populated localStorage**

## Further Reading

- [Next.js Hydration Docs](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Mismatch Guide](https://react.dev/link/hydration-mismatch)
- [Zustand Persist Middleware](https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md)

## Summary

The `isMounted` pattern is the cleanest, most maintainable solution for hydration issues with client-side state in Next.js. It:

✅ Guarantees server and client render identically  
✅ Works with any client-side data source  
✅ Minimal code overhead  
✅ No additional dependencies  
✅ Easy to understand and maintain  

Use it whenever you're rendering content that depends on browser APIs or client-side storage!
