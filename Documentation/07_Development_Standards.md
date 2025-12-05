# 0. User Story Isolation

Each user story/module (web app, API, scraper, WordPress integration) must be independently testable and maintainable.
All integration points must be documented and testable in isolation.
# 07. Development Standards

> **Project**: The Curator (Global News Aggregator)
> **Status**: Draft
> **Last Updated**: 2025-12-01

## 1. Methodology: Test Driven Development (TDD)

We strictly follow the **Red-Green-Refactor** cycle. No feature code is written without a failing test first.

### 1.1 The Cycle
1.  **RED**: Write a test for the new feature or class. Run it. It MUST fail.
2.  **GREEN**: Write the *minimum* amount of code to make the test pass.
3.  **REFACTOR**: Clean up the code while keeping the test passing.

### 1.2 Testing Stack
*   **Unit Tests**: `Jest` or `Vitest`.
*   **Integration Tests**: Test against a local Supabase instance or mocked DB.
*   **Location**: Tests co-located with code (e.g., `src/lib/scraper/OrientalDailyScraper.test.ts`).

## 2. Coding Paradigm: Object-Oriented Programming (OO)

We avoid "Scripting" or "Functional Spaghetti". We use **True OO** concepts.

### 2.1 Encapsulation
*   **Private Fields**: Use `private` or `#` for internal state.
*   **Getters/Setters**: Expose data only through controlled methods.
*   **Example**: `Article` class should validate its own data in the constructor.

### 2.2 Inheritance
*   **Abstract Base Classes**: Use `abstract class BaseScraper` to define the template method pattern.
*   **Concrete Implementations**: `class OrientalDailyScraper extends BaseScraper`.
*   **DRY**: Common logic (HTTP fetching, HTML cleaning) LIVES in the Base Class.

### 2.3 Polymorphism
*   **Interfaces**: All scrapers must implement `ScraperInterface`.
*   **Dependency Injection**: The system should accept `ScraperInterface` types, not specific classes.
    *   *Good*: `function scrapeNews(scraper: ScraperInterface)`
    *   *Bad*: `function scrapeNews(scraper: OrientalDailyScraper)`

## 3. Project Structure (OO Focused)

```
src/
├── domain/                 # Core Business Logic (Pure TS, No Frameworks)
│   ├── models/
│   │   └── Article.ts      # The 'Article' Entity
│   ├── services/
│   │   └── ScraperService.ts
│   └── interfaces/
│       └── IRepository.ts
├── infrastructure/         # External concerns (DB, API, Web)
│   ├── repositories/
│   │   └── SupabaseArticleRepository.ts  # Implements IRepository
│   └── scrapers/
│       ├── BaseScraper.ts
│       └── OrientalDailyScraper.ts
└── app/                    # Next.js View Layer (UI only)
```

## 4. Workflow Checklist
Before marking a task as "Done":
- [ ] Does a test exist?
- [ ] Do all tests pass?
- [ ] Is the logic encapsulated in a Class?
- [ ] Are types strictly defined (No `any`)?
