---
name: 'Flutter Application Development'
description: 'Core guidelines, architectural strategies, and orchestration principles for building Flutter apps using Antigravity agents.'
---

# Flutter Application Development Skill

> **When to activate**: Any prompt involving Flutter, Dart code generation, architectural decisions in Flutter apps, structuring a Flutter project, or UI/UX implementation in Flutter.

---

## 1. Architectural Code Reading (Flutter & Dart)

**Description:** Because Antigravity’s agents generate the bulk of the Dart code, your job shifts from writing syntax to reading and reviewing it. You don't need to memorize every Flutter command, but you do need to understand core concepts—like how the Widget Tree is structured, the difference between stateless and stateful widgets, and basic data flow. This ensures that when the agent hands you an implementation plan, you can spot logical flaws before it writes bad code.

## 2. Task Decomposition & Agent Orchestration

**Description:** Antigravity works best when you break massive goals down into bite-sized missions. You need the skill to look at a large feature (e.g., "Build a User Profile") and split it into modular steps (e.g., "1. Scaffold the UI layout," "2. Connect to local storage," "3. Handle loading states"). By doing this, you can effectively dispatch Antigravity’s specialized agents in the Manager view to work on focused tasks asynchronously, keeping them on track and drastically reducing errors.

## 3. Precision Prompting & Context Management

**Description:** Vague instructions lead to model hallucinations and wasted tokens. You must master the art of writing clear, unambiguous acceptance criteria. Equally important is context management—knowing exactly which specific files, folders, or rule documents (like the design system in your skills/ folder) to feed the model using @ mentions. Giving the agent only what it needs to know, and nothing more, is the secret to keeping it focused and optimizing your token usage.

## 4. Artifact Verification & QA (Quality Assurance)

**Description:** Trusting an AI blindly is a fast track to a messy codebase. Antigravity generates "Artifacts"—tangible deliverables like task lists, structural plans, and browser screenshots—before and during its coding process. Your skill lies in rigorously reviewing these artifacts, directing the agents to run commands like `flutter analyze` or `flutter test`, and ensuring the final output actually matches your exact expectations before moving on to the next task.

---

### Additional Core Principles

## 5. State Management & Decoupling

**Description:** Flutter's flexibility with state can lead to tightly coupled spaghetti code if not guided properly. Always ensure a clear separation between the UI presentation layer and the domain/business logic. Demand explicit adherence to a chosen state management solution (e.g., Riverpod, BLoC, or Provider) throughout the codebase, verifying that state is lifted appropriately and that widgets rebuild only when necessary.

## 6. Responsive UI & Platform Adaptation

**Description:** When translating user requirements into UI, prioritize Flutter’s inherent responsive tools (`LayoutBuilder`, `Flexible`, `Expanded`, `MediaQuery`). Ensure the layout gracefully adapts across different screen sizes and orientations, avoiding hardcoded pixel values unless strictly necessary, to ensure native-feeling applications on mobile, web, and desktop.

## 7. Frontend Design & UI Consistency (Bitcorp Aero)

**Description:** While building Flutter UIs for this project, always draw inspiration from and maintain consistency with the established Bitcorp Aero design system. You MUST reference `.claude/skills/ui-design/SKILL.md` for core design foundations (colors, typography, spacing tokens) and the "UI Generation & Consistency Rules" section of `CLAUDE.md` to understand layout shell concepts and the Aero Component rules. Ensure your Flutter widgets visually align with the Angular frontend's premium, standardized enterprise UI.
