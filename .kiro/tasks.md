# Implementation Plan: Aether Particle Effect Bugfix

## Overview

This plan addresses three critical errors affecting the Anticeil landing page.

## Tasks

- [-] 1. Write bug condition exploration property test
  - Create diagnostic test in apps/web/app/__tests__/aether-canvas-diagnostic.test.tsx

- [~] 2. Fix handleResize scope error
  - Verify handler declarations are in outer useEffect scope

- [~] 3. Fix canvas ref retry logic
  - Increase initial delay from 150ms to 250ms

- [~] 4. Fix hydration mismatch for navigation
  - Apply suppressHydrationWarning properly

- [~] 5. Implement canvas dimension fix
  - Improve parent element dimension detection

- [~] 6. Verify z-index layering
  - Set canvas zIndex to 1

- [~] 7. Add animation frame monitoring
  - Verify frame counter logs

- [~] 8. Integration testing and visual verification
  - Test particles visible in all browsers

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3] },
    { "wave": 4, "tasks": [4] },
    { "wave": 5, "tasks": [5] },
    { "wave": 6, "tasks": [6] },
    { "wave": 7, "tasks": [7] },
    { "wave": 8, "tasks": [8] }
  ]
}
```

## Notes

Key files: apps/web/app/page.tsx