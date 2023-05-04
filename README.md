# atproto-react

cute reusable helpers for ur besties' new favorite protocol. made primarily for Next.js@13 apps; super WIP ymmv idk

![](http://textfiles.com/underconstruction/mamagnolia_acresunderconstruction.gif)

## Exports

### `ATPProvider`

```tsx
// app/layout.tsx
import { ATPProvider } from "atproto-react";

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <ATPProvider>{children}</ATPProvider>
      </body>
    </html>
  );
}
```

### `useATP`

```tsx
// components/CuteComponent.tsx
"use client";

export function CuteComponent() {
  const { login, logout } = useATP();
  return …;
}
```
