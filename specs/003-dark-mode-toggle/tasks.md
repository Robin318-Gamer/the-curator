# Tasks: Dark Mode Toggle

**Input**: Design documents from `/specs/003-dark-mode-toggle/`  
**Prerequisites**: plan.md, spec.md  
**Branch**: 003-dark-mode-toggle

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependencies

- [X] T001 Install next-themes dependency in the-curator/package.json
- [X] T002 [P] Configure Tailwind CSS dark mode in the-curator/tailwind.config.js
- [X] T003 [P] Create lib/constants/theme.ts for color palette definitions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core theme infrastructure that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create ThemeProvider client component in components/shared/ThemeProvider.tsx
- [X] T005 Wrap app with ThemeProvider in app/layout.tsx
- [X] T006 [P] Create useTheme custom hook in lib/hooks/useTheme.ts
- [X] T007 [P] Add dark mode color variants to Tailwind config
- [X] T008 Test ThemeProvider initializes without FOUC

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - First-time User Discovers Dark Mode (Priority: P1) 🎯 MVP

**Goal**: User can toggle between light and dark modes and see immediate visual change

**Independent Test**: Open home page → Click toggle → Verify theme switches immediately

### Implementation for User Story 1

- [X] T009 [P] [US1] Create ThemeToggle component in components/shared/ThemeToggle.tsx
- [X] T010 [P] [US1] Create sun/moon SVG icons for toggle states
- [X] T011 [US1] Add ThemeToggle to home page header in app/page.tsx
- [X] T012 [US1] Implement toggle click handler with theme switching logic
- [X] T013 [US1] Add ARIA labels for accessibility
- [X] T014 [US1] Style toggle button for light mode in ThemeToggle.tsx
- [X] T015 [US1] Style toggle button for dark mode in ThemeToggle.tsx
- [X] T016 [US1] Add smooth transition animation (under 300ms)
- [X] T017 [US1] Apply dark mode styles to home page in app/page.tsx
- [X] T018 [US1] Apply dark mode styles to NewsLanding component in components/news/NewsLanding.tsx
- [X] T019 [US1] Apply dark mode styles to NewsList component in components/news/NewsList.tsx

**Checkpoint**: User can toggle theme and see immediate visual changes across home page

---

## Phase 4: User Story 2 - User Preference is Remembered (Priority: P1) 🎯 MVP

**Goal**: User's theme choice persists across browser sessions

**Independent Test**: Toggle to dark mode → Close browser → Reopen → Verify dark mode still active

### Implementation for User Story 2

- [X] T020 [US2] Configure localStorage persistence in ThemeProvider.tsx
- [X] T021 [US2] Add theme preference loading on mount
- [X] T022 [US2] Add theme preference saving on change
- [X] T023 [US2] Test persistence after page refresh
- [X] T024 [US2] Test persistence after browser restart
- [X] T025 [US2] Handle localStorage unavailable gracefully

**Checkpoint**: Theme preference persists and loads correctly on return visits

---

## Phase 5: User Story 3 - System Preference Detection (Priority: P2)

**Goal**: On first visit, automatically apply user's system theme preference

**Independent Test**: Clear localStorage → Set system to dark mode → Open site → Verify dark mode applied

### Implementation for User Story 3

- [X] T026 [US3] Detect prefers-color-scheme in ThemeProvider.tsx
- [X] T027 [US3] Apply system preference as default on first visit
- [X] T028 [US3] Fallback to light mode if system preference unavailable
- [X] T029 [US3] Update toggle indicator to show current resolved theme
- [X] T030 [US3] Test with different system preferences
- [X] T031 [US3] Test localStorage priority over system preference

**Checkpoint**: System preference detection works correctly for first-time visitors

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete accessibility, testing, and documentation

- [ ] T032 [P] Write unit test for ThemeToggle component in __tests__/components/shared/ThemeToggle.test.tsx
- [ ] T033 [P] Write unit test for ThemeProvider in __tests__/components/shared/ThemeProvider.test.tsx
- [ ] T034 [P] Test WCAG AA contrast ratios for light mode colors
- [ ] T035 [P] Test WCAG AA contrast ratios for dark mode colors
- [ ] T036 [P] Test toggle on mobile devices (responsive design)
- [ ] T037 Test keyboard navigation for toggle button
- [ ] T038 Test screen reader announcements
- [ ] T039 Add JSDoc documentation to ThemeProvider.tsx
- [ ] T040 Add JSDoc documentation to ThemeToggle.tsx
- [ ] T041 [P] Update README with dark mode feature description
- [ ] T042 Performance test: Verify theme switch <300ms
- [ ] T043 Performance test: Verify page load impact <50ms

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - Can start independently
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) - Extends toggle with persistence
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - Can start after US1/US2 or in parallel
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1**: Toggle functionality and visual themes - NO dependencies on other stories
- **User Story 2**: Persistence layer - DEPENDS on User Story 1 toggle component existing
- **User Story 3**: System preference - DEPENDS on Foundational phase but independent of US1/US2

### Within Each User Story

**User Story 1** (Toggle & Visual):
1. Create toggle component (T009-T010)
2. Add to page (T011)
3. Implement logic (T012-T013)
4. Style for both modes (T014-T015)
5. Add transitions (T016)
6. Apply dark styles to all components (T017-T019)

**User Story 2** (Persistence):
1. Configure persistence (T020)
2. Load preference (T021)
3. Save preference (T022)
4. Test scenarios (T023-T025)

**User Story 3** (System Preference):
1. Detect system preference (T026)
2. Apply as default (T027)
3. Handle fallbacks (T028)
4. Update UI (T029)
5. Test scenarios (T030-T031)

### Parallel Opportunities

**Phase 1 (Setup)** - All tasks can run in parallel:
- T002 (Tailwind config) || T003 (Theme constants)

**Phase 2 (Foundational)** - Some tasks can run in parallel:
- T006 (useTheme hook) || T007 (Color variants) (after T004-T005 complete)

**Phase 3 (User Story 1)** - Some tasks can run in parallel:
- T009 (Component) || T010 (Icons) initially
- T014 (Light styles) || T015 (Dark styles) after component created
- T017 (page.tsx) || T018 (NewsLanding) || T019 (NewsList) all in parallel

**Phase 6 (Polish)** - Most tasks can run in parallel:
- All test tasks (T032-T038)
- Documentation tasks (T039-T041)
- Performance tests (T042-T043)

---

## Parallel Example: User Story 1

```bash
# After T009 component created, these can run in parallel:
Task T014: "Style toggle button for light mode in ThemeToggle.tsx"
Task T015: "Style toggle button for dark mode in ThemeToggle.tsx"

# After toggle added to page, these can run in parallel:
Task T017: "Apply dark mode styles to home page in app/page.tsx"
Task T018: "Apply dark mode styles to NewsLanding in components/news/NewsLanding.tsx"
Task T019: "Apply dark mode styles to NewsList in components/news/NewsList.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

The minimum viable product includes basic toggle and persistence:

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008) - CRITICAL
3. Complete Phase 3: User Story 1 (T009-T019) - Toggle works
4. Complete Phase 4: User Story 2 (T020-T025) - Preference saved
5. **STOP and VALIDATE**: Test complete toggle experience
6. Deploy/demo if ready

**MVP Deliverable**: Users can toggle dark mode and preference persists

### Full Feature Delivery

Add system preference detection for enhanced UX:

1. MVP complete (Phases 1-4)
2. Complete Phase 5: User Story 3 (T026-T031) - Smart defaults
3. Complete Phase 6: Polish (T032-T043) - Tests and docs
4. Full feature complete

### Incremental Delivery Timeline

- **Day 1-2**: Setup + Foundational (T001-T008)
- **Day 3-4**: User Story 1 - Toggle functionality (T009-T019)
- **Day 5**: User Story 2 - Persistence (T020-T025)
- **MVP CHECKPOINT** - Deploy and test
- **Day 6**: User Story 3 - System preference (T026-T031)
- **Day 7-8**: Polish - Testing and docs (T032-T043)
- **FINAL RELEASE**

---

## Testing Checklist

### Manual Testing (Required)

- [ ] Toggle appears in header on home page
- [ ] Click toggle switches from light to dark mode
- [ ] Click toggle switches from dark to light mode
- [ ] Theme change is smooth (under 300ms)
- [ ] All text remains readable in both modes
- [ ] Refresh page maintains selected theme
- [ ] Close and reopen browser maintains selected theme
- [ ] Clear localStorage resets to system preference (or light)
- [ ] System dark mode preference detected on first visit
- [ ] Toggle works on mobile devices
- [ ] Toggle accessible via keyboard (Tab + Enter)
- [ ] Screen reader announces theme changes

### Automated Testing (Optional - T032-T038)

- [ ] ThemeToggle component renders correctly
- [ ] ThemeToggle onClick handler called
- [ ] ThemeProvider provides correct context values
- [ ] localStorage read/write functions work
- [ ] System preference detection works
- [ ] WCAG AA contrast ratios verified

### Performance Testing (Required - T042-T043)

- [ ] Theme switch completes in <300ms
- [ ] Page load impact <50ms
- [ ] No Flash of Unstyled Content (FOUC)

---

## Success Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Theme switch speed | <300ms | Performance.now() timing |
| Page load impact | <50ms | Lighthouse score comparison |
| Contrast ratios | WCAG AA (4.5:1) | Chrome DevTools contrast checker |
| Mobile responsiveness | Works on all devices | Manual testing on iOS/Android |
| Accessibility | Keyboard + screen reader | Manual testing |

---

## Notes

- **TDD Approach**: For any tests written (optional in this feature), write test FIRST and verify it FAILS before implementing
- **[P] Tasks**: Can be worked on simultaneously by different developers
- **Commit Strategy**: Commit after each phase or logical task group
- **Each User Story**: Should be independently completable and testable
- **Checkpoints**: Use these to validate before proceeding - don't skip validation!
- **File Paths**: All paths relative to `the-curator/` repository root
- **Tailwind Dark Mode**: Uses `class` strategy (not `media` query strategy)

---

## File Summary

**New Files Created**:
- `components/shared/ThemeProvider.tsx` (T004)
- `components/shared/ThemeToggle.tsx` (T009)
- `lib/hooks/useTheme.ts` (T006)
- `lib/constants/theme.ts` (T003)
- `__tests__/components/shared/ThemeToggle.test.tsx` (T032)
- `__tests__/components/shared/ThemeProvider.test.tsx` (T033)

**Modified Files**:
- `package.json` (T001 - add next-themes)
- `tailwind.config.js` (T002, T007 - dark mode config)
- `app/layout.tsx` (T005 - wrap with ThemeProvider)
- `app/page.tsx` (T011, T017 - add toggle, dark styles)
- `components/news/NewsLanding.tsx` (T018 - dark styles)
- `components/news/NewsList.tsx` (T019 - dark styles)
- `README.md` (T041 - document feature)

**Total Tasks**: 43  
**Estimated Effort**: 6-8 developer days  
**MVP Tasks**: T001-T025 (25 tasks, ~5 days)
