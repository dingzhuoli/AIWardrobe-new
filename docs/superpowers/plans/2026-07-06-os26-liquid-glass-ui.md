# OS 26 Liquid Glass UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh AIWardrobe to the selected OS 26 / Liquid Glass visual direction and merge passing work into `main`.

**Architecture:** Keep existing React routes, contexts, fetch calls, and data contracts unchanged. Centralize visual language in CSS utilities, then update shared components and pages to consume those utilities.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, Vitest, Testing Library, Lucide React.

---

### Task 1: Add UI Contract Test

**Files:**
- Create: `frontend/src/__tests__/os26-ui-contract.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const srcRoot = path.resolve(process.cwd(), 'src')
const read = (file) => fs.readFileSync(path.join(srcRoot, file), 'utf8')

describe('OS 26 liquid glass UI contract', () => {
  it('defines global liquid glass tokens and utilities', () => {
    const css = read('index.css')
    expect(css).toContain('--glass-surface')
    expect(css).toContain('--glass-border')
    expect(css).toContain('.app-shell')
    expect(css).toContain('.liquid-glass')
    expect(css).toContain('.liquid-tabbar')
    expect(css).toContain('.liquid-chip')
  })

  it('uses liquid navigation and glass controls in shared components', () => {
    expect(read('components/TabBar.jsx')).toContain('liquid-tabbar')
    expect(read('components/FilterBar.jsx')).toContain('liquid-search')
    expect(read('components/Upload.jsx')).toContain('liquid-upload')
    expect(read('components/Settings.jsx')).toContain('liquid-sheet')
  })

  it('removes emoji UI affordances and purple decorative blobs', () => {
    const files = [
      'components/Settings.jsx',
      'pages/Wardrobe.jsx',
      'pages/Recommendation.jsx',
    ]
    const source = files.map(read).join('\n')
    expect(source).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    expect(source).not.toContain('bg-purple')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/__tests__/os26-ui-contract.test.jsx`

Expected: FAIL because the current CSS and components do not yet contain the Liquid Glass contract.

### Task 2: Implement Global Design Tokens

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Replace global tokens and utilities**

Add Liquid Glass variables, app background utilities, glass/card/button/input/chip classes, reduced motion, and safe-area helpers.

- [ ] **Step 2: Wrap the app in the new shell**

Use `app-shell` and `app-content` in `App.jsx`, preserving the route tree and `TabBar`.

- [ ] **Step 3: Run UI contract test**

Run: `cd frontend && npm test -- src/__tests__/os26-ui-contract.test.jsx`

Expected: still FAIL until component classes and emoji removals are complete.

### Task 3: Refresh Shared Components

**Files:**
- Modify: `frontend/src/components/TabBar.jsx`
- Modify: `frontend/src/components/FilterBar.jsx`
- Modify: `frontend/src/components/Upload.jsx`
- Modify: `frontend/src/components/Settings.jsx`

- [ ] **Step 1: Update navigation**

Use `liquid-tabbar`, `liquid-tab`, and active-state glass pills for mobile and desktop navigation.

- [ ] **Step 2: Update search and filters**

Use `liquid-glass`, `liquid-search`, and `liquid-chip` classes for search and filter controls.

- [ ] **Step 3: Update upload and settings**

Use `liquid-upload`, `liquid-sheet`, `btn-primary`, `btn-secondary`, `btn-icon`, and `input-field`. Replace close/list/link emoji with Lucide icons.

- [ ] **Step 4: Run UI contract test**

Run: `cd frontend && npm test -- src/__tests__/os26-ui-contract.test.jsx`

Expected: PASS after pages no longer contain emoji UI affordances or purple blob classes.

### Task 4: Refresh Page Surfaces

**Files:**
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/pages/Entry.jsx`
- Modify: `frontend/src/pages/Wardrobe.jsx`
- Modify: `frontend/src/pages/Outfit.jsx`
- Modify: `frontend/src/pages/Recommendation.jsx`
- Modify: `frontend/src/pages/ClothesDetail.jsx`

- [ ] **Step 1: Replace traditional white cards with glass/card utilities**

Use `card`, `liquid-panel`, `media-tile`, `subtle-panel`, `liquid-chip`, and `empty-state` classes where they preserve layout.

- [ ] **Step 2: Remove emoji weather rendering**

Replace weather emoji overlay with Lucide icon selection in `Recommendation.jsx`.

- [ ] **Step 3: Run full frontend verification**

Run: `cd frontend && npm test && npm run lint && npm run build`

Expected: all commands exit 0.

### Task 5: Merge

**Files:**
- Git branch state only

- [ ] **Step 1: Commit passing work**

Run: `git status --short`, `git add docs frontend`, `git commit -m "feat: apply OS 26 liquid glass UI"`

- [ ] **Step 2: Merge to main**

Run: `git checkout main`, `git merge codex/os26-liquid-glass-ui`

- [ ] **Step 3: Verify merged main**

Run: `cd frontend && npm test && npm run lint && npm run build`

Expected: all commands exit 0 on `main`.
