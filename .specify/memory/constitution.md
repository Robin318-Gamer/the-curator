<!--
Sync Impact Report
Version change: 1.1.0 → 1.2.0
List of modified principles: Added VIII. Internationalization
Added sections: None
Removed sections: None
Templates requiring updates: plan-template.md (Constitution Check updated)
Follow-up TODOs: None
-->
# Speckit Project Constitution

## Core Principles

### I. Specification-Driven Development
Every feature must begin with a detailed specification that outlines requirements, user scenarios, and success criteria. Implementation only starts after the spec is approved.

### II. Test-Driven Development (NON-NEGOTIABLE)
All development follows Test-Driven Development principles. Tests are written before code implementation, ensuring red-green-refactor cycle is strictly enforced.

### III. Object-Oriented Principles
Code must adhere to Object-Oriented Programming principles: encapsulation, inheritance, polymorphism, and abstraction. Design patterns should be used where appropriate to promote maintainable and extensible code.

### IV. Integration Testing
Integration tests are required for new features, contract changes, and inter-module communication. Focus on ensuring components work together correctly.

### V. Simplicity and Observability
Keep code simple and follow YAGNI principles. Ensure observability through structured logging and clear error handling.

### VI. User Interface Simplicity
The site must be simple and clear, with intuitive navigation. Public site is accessible without login; Admin site requires authentication.

### VII. Centralized Styling
All styling must be centralized with class definitions for consistency and maintainability.

### VIII. Internationalization
Public site must support multiple languages. Admin site uses Traditional Chinese only.

## Additional Constraints
Technology stack must include Next.js with JavaScript/TypeScript, adhering to best practices. All code must be documented and version-controlled.

## Development Workflow
Code reviews are mandatory for all changes. Testing gates must pass before merging. Development follows the spec-plan-tasks cycle.

## Governance
Constitution supersedes all other practices. Amendments require documentation, approval, and a migration plan. All PRs must verify compliance.

**Version**: 1.2.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date unknown | **Last Amended**: 2025-12-01
