Here is a comprehensive breakdown designed specifically for an advanced LLM (like Claude Opus) to consume. It is formatted as a formal Product Requirements Document (PRD) combined with a technical comparison to Microsoft Teams Approvals.

---

# Part 1: Deep Research & Comparison: Microsoft Teams Approvals vs. Requested System

To build this system correctly, we must understand the inspiration: the **Microsoft Teams Approvals** app.

### How Microsoft Teams Approvals Works

Microsoft Teams provides a centralized hub for approvals, powered entirely by Microsoft Power Automate under the hood. It features two distinct operational modes:

1. **Basic/Ad-Hoc Approvals**: Any user can open the app, click "New approval request," add a title, description, attachments, and manually type in the names of the approvers. The user can specify if _everyone_ must approve, or if the _first to respond_ is sufficient.
2. **Template-Based Approvals**: Org Administrators or Team Owners can create structured templates (e.g., "Leave Request," "Expense Report"). These templates have fixed forms and pre-configured routing (e.g., it always goes to the Finance Manager, then the HR Director).
3. **The UI Hub**: All users have an "Approvals" dashboard with two main tabs: **Received** (requests waiting for their sign-off) and **Sent** (requests they initiated), showing the current status (Requested, Approved, Rejected).

### Direct Comparison: MS Teams vs. Requested Custom System

| Feature/Concept                         | Microsoft Teams Approvals                                                                              | Requested Custom System                                                                                                                                                                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core Architecture**                   | Relies on external engine (Power Automate workflows).                                                  | Must be an internal, native **plug-in/module** accessible across all existing modules (e.g., Daily Reports, Equipment).                                                                                                                                                                 |
| **Ad-Hoc Requests**                     | Yes. Users can send free-form requests to anyone.                                                      | Yes. Users must be able to send custom requests (e.g., leaving early, signing a random contract).                                                                                                                                                                                       |
| **Template Configurator**               | Configured by Team Owners or IT Admins via a form builder.                                             | Configured by a designated **Key User** (Project Admin) at the start of a project.                                                                                                                                                                                                      |
| **Workflow Routing**                    | Sequential (A then B) or Parallel (A and B at the same time).                                          | Highly variable sequential/parallel routing (e.g., Person 1 $\rightarrow$ Person 3 OR 4 $\rightarrow$ Person 5).                                                                                                                                                                        |
| **Template Versioning / State Changes** | Modifying a Power Automate flow can break in-flight approvals or requires creating entirely new flows. | **Crucial Difference:** Requires a "Rebase/Cut" system. If an approval workflow changes from 3 steps to 5 steps mid-project, completed approvals must retain their historical 3-step integrity (Audit Log). In-flight requests must gracefully adapt or remain on their legacy version. |
| **UI Experience**                       | Centralized dashboard (Received / Sent).                                                               | Centralized dashboard (**Recibidos / Enviados**) matching the MS Teams layout.                                                                                                                                                                                                          |

---

# Part 2: Detailed Software Requirements for Claude Opus

**Context for Claude:** You are acting as a Senior Staff Engineer. Read the following Product Requirements Document (PRD) derived from a stakeholder meeting. Your goal is to understand the two distinct approval modes (Structured/Module-based and Ad-Hoc/Free-form), the dynamic template routing system, and the strict audit/versioning requirements.

## 1. System Overview

The goal is to build a highly flexible, centralized **Approvals Engine (Plug-in/Module)** for an enterprise project management application (used in construction/engineering). Because every project and company has different bureaucratic rules, hardcoding approval workflows (e.g., for Equipment Requests or Daily Reports) is impossible. The system must support user-defined dynamic routing and standalone ad-hoc requests.

## 2. User Roles

- **Key User (Project Admin):** Responsible for configuring the approval templates, determining the number of steps, and assigning roles/users to those steps.
- **Standard User (Requester):** Can trigger module-based approvals (e.g., submitting a daily report) or create ad-hoc approval requests.
- **Approver:** A user assigned to a node in an approval workflow. Can "Approve" or "Reject" requests.

## 3. Core Functional Requirements

### Feature 1: The "Ad-Hoc" Approval System (Free-form)

- **Description:** An email-like system where any user can generate a standalone approval request that is not tied to a specific system module.
- **Inputs:** Title, description/body, attachments (e.g., a PDF contract), list of "Approvers", and list of "CC/Informed" users.
- **Logic:** The requester manually selects the routing. For example, "I need to leave early because I am sick. I select the main coordinator to approve this."
- **Output:** Generates a secure audit trail proving the user received permission outside of standard structural modules.

### Feature 2: Module-Integrated Approval Templates (Structured)

- **Description:** A template builder used by the **Key User** to define how specific application modules (e.g., "Daily Report" / _Parte Diario_, "Material Purchases", "Equipment Onboarding") are approved.
- **Workflow Builder / Routing Rules:**
- Must support variable steps (Step 1 $\rightarrow$ Step 2 $\rightarrow$ Step 3).
- Must support OR conditions within steps (e.g., Step 2 can be approved by User A _OR_ User B).
- Must allow bypassing (e.g., Project A requires 5 steps, Project B only requires Step 1 and Step 5).
- Must map specific system Roles (e.g., "Supervisor", "Resident Engineer") or specific User IDs to steps.

- **Trigger Integration:** When a user creates a new record in the "Daily Report" module, the system automatically checks the Approvals Engine for the active template and instantiates the workflow.

### Feature 3: Centralized User Dashboard

- **Description:** A UI hub for users to manage all approvals across all modules and ad-hoc requests.
- **Tab 1 - "Recibidos" (Received):** A list of all pending items requiring the user's approval. User can click to view details, add a comment, and click "Approve" or "Reject".
- **Tab 2 - "Enviados" (Sent):** A list of all requests the user has initiated. Shows real-time status (Pending at Step X, Approved, Rejected).

## 4. Technical & Architectural Requirements

### Requirement A: Immutability & Template Versioning (The "Rebase" Protocol)

- **The Problem:** The Key User sets up a 3-step approval process for "Equipment". Two months later, they change it to a 5-step process.
- **The Rule:** Approval records are legal/security safety cards. They must be immutable.
- **Execution:** \* Templates must be **versioned**.
- If a request is fully completed under Template V1 (3 steps), it remains forever marked as "Approved (V1)".
- If an item is currently _in-flight_ (e.g., stuck at Step 2 of V1) when the template is changed to V2 (5 steps), the system must execute a "Cut/Rebase". Depending on business logic, it either finishes its lifecycle on V1, or the Key User manually maps the in-flight item to the new V2 flow. _Under no circumstances can the historical log of who approved what be overwritten._

### Requirement B: Plug-in / Agnostic Architecture

- The Approvals engine must be built as a decoupled service.
- Modules (HR, Procurement, Operations) simply pass a payload (Entity ID, Module Name, Payload Data) to the Approvals API.
- The Approvals API handles the state machine (Pending, Step 1, Step 2, Approved, Rejected) and emits webhooks/events back to the parent module when the final state is reached.

## 5. Example Use Cases to Test Against

1. **The "Parte Diario" (Daily Report) Flow:** Operator generates report $\rightarrow$ Supervisor approves $\rightarrow$ Equipment Chief approves $\rightarrow$ Resident Engineer approves. (Complex, multi-step, structured).
2. **The Fast-Track Flow:** Operator generates report $\rightarrow$ Resident Engineer approves. (Skipping middle management based on project setup).
3. **The Sick Leave Flow:** Operator creates an ad-hoc request stating "I feel sick, going home." $\rightarrow$ Directs it manually to the Coordinator $\rightarrow$ Coordinator clicks "Approve" so the operator has proof they didn't abandon their job. (Ad-hoc, unstructured).
