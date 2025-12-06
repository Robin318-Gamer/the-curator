# Implementation Plan: Dark Mode Toggle

**Branch**: `003-dark-mode-toggle` | **Date**: December 6, 2025 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/003-dark-mode-toggle/spec.md`

## Summary

Implement a dark mode toggle on the home page that allows users to switch between light and dark color schemes with preference persistence across sessions. The feature will use Next.js app router architecture with Tailwind CSS for styling, React Context for state management, and localStorage for persistence. System preference detection via `prefers-color-scheme` will provide smart defaults on first visit.

## Technical Context

**Language/Version**: TypeScript with Next.js 14.2.33, Node.js 18+  
**Primary Dependencies**: Next.js, React 18, Tailwind CSS 3.x, next-themes (for theme management)  
**Storage**: Browser localStorage (client-side preference persistence)  
**Testing**: Jest (unit tests), React Testing Library (component tests)  
**Target Platform**: Web browsers with SSR support, responsive design for mobile/desktop  
**Project Type**: Web application with public (multi-language) and admin (Traditional Chinese) sections  
**Performance Goals**: Theme switch <300ms, no layout shift on page load, <50ms impact on initial render  
**Constraints**: WCAG AA contrast ratios, no Flash of Unstyled Content (FOUC), responsive across all breakpoints  
**Scale/Scope**: Single toggle component, affects all public pages (starting with home page)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **Specification-Driven**: Feature has detailed spec in [spec.md](spec.md)
- ✅ **Test-Driven**: Plan includes TDD approach with unit and integration tests
- ✅ **Object-Oriented**: Theme service encapsulates state management; component follows React composition patterns
- ✅ **Integration Testing**: Tests cover theme persistence, system preference detection, component integration
- ✅ **Simplicity**: Leverages existing next-themes library; minimal custom code; no over-engineering
- ✅ **User Interface Simplicity**: Toggle is intuitive; single-click action; clear visual state indicator
- ✅ **Centralized Styling**: Tailwind CSS with theme variants; centralized color definitions
- ✅ **Internationalization**: Theme toggle works for all languages; no text labels needed (icon-based)

**Status**: ✅ PASSED - No violations

## Project Structure

### Documentation (this feature)

```
specs/003-dark-mode-toggle/
├── plan.md              # This file
├── research.md          # Phase 0: Library selection, color palette design
├── data-model.md        # Phase 1: Theme state model, storage schema
├── quickstart.md        # Phase 1: Developer guide for using dark mode
├── contracts/           # Phase 1: Theme context API contract
│   └── theme-api.ts     # TypeScript interface definitions
└── tasks.md             # Phase 2: Implementation task breakdown
```

### Source Code (repository root)

```
the-curator/
├── app/
│   ├── layout.tsx                 # Modified: Add ThemeProvider wrapper
│   └── page.tsx                   # Modified: Add theme toggle to header
├── components/
│   └── shared/
│       ├── ThemeToggle.tsx        # NEW: Toggle button component
│       └── ThemeProvider.tsx      # NEW: Client-side theme context provider
├── lib/
│   ├── hooks/
│   │   └── useTheme.ts            # NEW: Custom hook for theme access
│   └── constants/
│       └── theme.ts               # NEW: Color palette definitions
├── tailwind.config.js             # Modified: Add dark mode configuration
└── __tests__/
    └── components/
        └── shared/
            └── ThemeToggle.test.tsx  # NEW: Component unit tests
```

**Structure Decision**: Next.js app router structure with client components for theme toggle. ThemeProvider wraps the app at root layout level. Theme state managed via next-themes library with localStorage persistence. Tailwind CSS configured for dark mode class strategy.

## Complexity Tracking

> No Constitution violations - this section is empty.

---

## Phase 0: Outline & Research

**Objective**: Research best practices for dark mode implementation, evaluate library options, and design color palettes that meet accessibility standards.

### Research Tasks

#### 1. Dark Mode Library Evaluation
**Question**: What's the best approach for dark mode in Next.js with SSR?

**Research Areas**:
- Evaluate `next-themes` vs custom implementation
- Investigate SSR considerations (avoiding FOUC)
- Review performance implications of different approaches
- Check localStorage vs cookie-based persistence

**Decision Criteria**:
- No flash of unstyled content on page load
- TypeScript support
- SSR compatibility
- Minimal bundle size impact
- Active maintenance

#### 2. Color Palette Design
**Question**: What colors should we use for light and dark modes that meet WCAG AA?

**Research Areas**:
- Tailwind CSS dark mode best practices
- WCAG AA contrast ratio requirements (4.5:1 for normal text, 3:1 for large text)
- Color psychology for light/dark themes
- Existing design system colors that can be adapted

**Deliverable**: Color palette specification with contrast ratios verified

#### 3. System Preference Detection
**Question**: How to reliably detect and respect user's system theme preference?

**Research Areas**:
- `prefers-color-scheme` media query browser support
- Handling preference changes during session
- Fallback strategies for unsupported browsers
- Priority: localStorage preference vs system preference

**Deliverable**: Decision matrix for theme selection logic

### Research Output: `research.md`

Format:
```markdown
# Dark Mode Research

## Library Selection
- **Decision**: [chosen library]
- **Rationale**: [why chosen]
- **Alternatives Considered**: [other options and why rejected]

## Color Palette
- **Light Mode**: [color definitions with hex codes]
- **Dark Mode**: [color definitions with hex codes]
- **Contrast Ratios**: [verification that WCAG AA is met]

## System Preference Strategy
- **Detection Method**: [how to detect]
- **Priority Logic**: [localStorage vs system preference]
- **Fallback**: [what happens when detection fails]
```

---

## Phase 1: Design & Contracts

**Objective**: Define the data model for theme state, create API contracts for theme management, and document the developer experience.

### Deliverables

#### 1. Data Model (`data-model.md`)

**Theme State Entity**:
```typescript
interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'  // Computed from 'system' preference
  systemTheme?: 'light' | 'dark'   // Detected system preference
}
```

**Storage Schema** (localStorage):
```typescript
{
  "theme-preference": "light" | "dark" | "system"
}
```

**Component State**:
- Toggle button: enabled/disabled, light/dark indicator
- Theme provider: current theme, change handler
- App wrapper: theme class applied to root element

#### 2. API Contracts (`contracts/theme-api.ts`)

**Theme Context API**:
```typescript
interface ThemeContextValue {
  // Current theme setting
  theme: 'light' | 'dark' | 'system'
  
  // Resolved theme (light or dark, never system)
  resolvedTheme: 'light' | 'dark'
  
  // Set theme preference
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // System preference (if available)
  systemTheme?: 'light' | 'dark'
}

interface ThemeToggleProps {
  // Optional custom class names
  className?: string
  
  // Optional aria-label for accessibility
  ariaLabel?: string
}
```

**LocalStorage Contract**:
```typescript
// Key used for storage
const THEME_STORAGE_KEY = 'theme-preference'

// Valid values
type StoredTheme = 'light' | 'dark' | 'system'
```

#### 3. Quickstart Guide (`quickstart.md`)

Developer documentation covering:
- How to use the ThemeToggle component
- How to access current theme in components
- How to style components for dark mode
- Testing dark mode features
- Troubleshooting common issues

### Phase 1 Gate

Before proceeding to Phase 2:
- [ ] All data models documented
- [ ] API contracts defined with TypeScript interfaces
- [ ] Quickstart guide complete
- [ ] Re-check Constitution compliance

---

## Phase 2: Task Breakdown (NOT DONE IN THIS COMMAND)

**Note**: Phase 2 is handled by the `/speckit.tasks` command after Phase 0 and Phase 1 are complete.

The tasks will cover:
1. Setting up next-themes dependency
2. Creating ThemeProvider component
3. Creating ThemeToggle component
4. Configuring Tailwind CSS for dark mode
5. Adding color palette to theme configuration
6. Writing unit tests for components
7. Writing integration tests for theme persistence
8. Manual testing checklist
9. Documentation updates

---

## Success Metrics Tracking

| Metric | Target | How Measured |
|--------|--------|--------------|
| Theme Switch Performance | <300ms | Performance API timing |
| Preference Retention | 90% | Analytics: returning users with saved preference |
| Dark Mode Adoption | 40% | Analytics: sessions with dark mode enabled |
| Accessibility Compliance | WCAG AA | Automated contrast checker |
| Page Load Impact | <50ms | Lighthouse performance score |
| User Satisfaction | Easy to find/use | User testing observation |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Flash of unstyled content (FOUC) | High | Use next-themes with proper SSR setup; script in head |
| Browser compatibility issues | Medium | Test on all major browsers; provide fallbacks |
| Performance degradation | Medium | Monitor bundle size; lazy load if needed |
| Color palette not accessible | High | Use automated contrast checking tools |
| localStorage not available | Low | Graceful fallback to system preference only |

---

## Dependencies & Prerequisites

### External Dependencies
- `next-themes` (v0.2.1 or later)
- TypeScript (already in project)
- Tailwind CSS (already in project)

### Internal Dependencies
- Next.js app router structure (already exists)
- Existing layout.tsx and page.tsx files
- Tailwind CSS configuration

### Development Tools
- Jest (for unit tests)
- React Testing Library (for component tests)
- Contrast checker tool (for accessibility validation)

---

## Next Steps

1. **Complete Phase 0**: Fill in `research.md` with library evaluation and color palette design
2. **Complete Phase 1**: Create `data-model.md`, `contracts/theme-api.ts`, and `quickstart.md`
3. **Re-validate Constitution**: Ensure no violations introduced during design
4. **Run `/speckit.tasks`**: Generate detailed task breakdown for implementation
5. **Begin Implementation**: Follow TDD approach with tests before code

**Current Status**: ✅ Plan complete, ready for Phase 0 research
