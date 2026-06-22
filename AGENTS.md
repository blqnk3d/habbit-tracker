# AGENTS.md — All Skills Reference

## Table of Contents

1. [Accessibility UI Design](#accessibility-ui-design)
2. [API Design (REST)](#api-design-rest)
3. [Caching Strategies](#caching-strategies)
4. [CI/CD Pipeline Architecture](#cicd-pipeline-architecture)
5. [Code Review Guidelines](#code-review-guidelines)
6. [Database Query Optimization](#database-query-optimization)
7. [Debugging Strategies](#debugging-strategies)
8. [DOM Security Hardening](#dom-security-hardening)
9. [Error Handling Architecture](#error-handling-architecture)
10. [Event-Driven Design](#event-driven-design)
11. [Frontend Design](#frontend-design)
12. [Git Workflow & Branching](#git-workflow--branching)
13. [Logging & Observability Standards](#logging--observability-standards)
14. [React Component Design](#react-component-design)
15. [State Management Patterns](#state-management-patterns)
16. [Theme Factory](#theme-factory)

---

## 1. Accessibility UI Design

**When to use:** Writing HTML markup, designing interactive widgets (modals, dropdowns, tabs, date pickers), auditing UIs for WCAG compliance, building custom form controls, creating data tables.

**When NOT to use:** Visual design, component styling, performance optimization.

**Workflow:**
1. Use Semantic HTML First — native elements (`<button>`, `<nav>`, `<dialog>`, `<form>`) instead of `<div>`
2. Keyboard Navigation — ALL interactive elements reachable via Tab, operable via Enter/Space
3. Manage Focus — trap focus inside modals, return focus to trigger after close
4. Add ARIA Only When Needed — `aria-*` only when native HTML is insufficient
5. Test Color Contrast — WCAG AA 4.5:1 ratio for text
6. Provide Text Alternatives — `alt` on images, captions for videos
7. Label Form Controls — explicitly associate `<label>` with form inputs
8. Test with Assistive Technology — screen reader (NVDA, JAWS) and keyboard only

**Rules:**
- MUST use semantic HTML elements
- MUST make all interactive elements keyboard accessible
- MUST NOT remove focus outlines without providing custom focus states
- MUST provide alt text for all images (empty `alt=""` for decorative)
- MUST label all form inputs with `<label>` elements
- MUST use ARIA only to supplement, never replace, semantic HTML
- MUST achieve WCAG AA color contrast (4.5:1 for body text, 3:1 for large text)
- MUST NOT rely solely on color to communicate information
- MUST support screen readers (test with real screen readers)

**Anti-patterns:** Div buttons, relying on color alone, missing labels, removed focus outlines, placeholder as label, inaccessible modals, overuse of ARIA.

**Validation checklist:**
- All interactive elements use semantic HTML
- All elements reachable/operable via keyboard (Tab, Enter, Space, Escape)
- Focus visible state (no `outline: none`)
- All images have alt text (or `alt=""` if decorative)
- All form inputs have associated `<label>` elements
- Color contrast meets WCAG AA
- Focus trap works in modals
- Escape key closes modals and returns focus
- Modals announced to screen readers
- No keyboard traps
- Tested with keyboard only
- Tested with screen reader (NVDA, JAWS, VoiceOver)
- Automated tools pass (axe, Lighthouse)

---

## 2. API Design (REST)

**When to use:** Building a new backend service, adding a new domain entity, creating integration endpoints, designing webhooks, standardizing an inconsistent API.

**When NOT to use:** Error handling specifics (see Error Handling Architecture), API authentication/authorization, rate limiting, GraphQL design.

**Workflow:**
1. Identify Resources — map business entities to plural nouns (users, orders, invoices)
2. Assign Verbs — CRUD → HTTP methods: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
3. Design URL Hierarchy — nest logically but NO DEEPER than 2 levels
4. Standardize Responses — consistent success payloads, RFC 7807 for errors
5. Add Pagination — `limit` and `offset` (or cursor-based) on collection endpoints
6. Version the API — `/v1/` prefix or header-based from day one
7. Document with OpenAPI — generate automatically or maintain in sync

**Rules:**
- MUST use HTTP status codes semantically
- MUST NOT use verbs in URLs (no `GET /getUsers`)
- MUST NOT nest beyond 2 levels
- MUST use lowercase URLs with hyphens for multi-word resources
- MUST require API versioning
- MUST return RFC 7807 problem details for ALL errors
- MUST paginate collection responses

**Anti-patterns:** Verbs in URLs, HTTP 200 for errors, deep nesting, mixed status codes, unversioned APIs.

**Validation checklist:**
- All resource URLs are plural nouns
- HTTP methods used semantically
- No verbs in URL paths
- Status codes correct (201 create, 204 delete, 400 validation, 500 server errors)
- All errors use RFC 7807 format
- Collection endpoints support `limit` and `offset`
- URLs include version (`/v1/users`)
- URLs use lowercase with hyphens
- Resource nesting ≤ 2 levels
- OpenAPI schema generated/synchronized

---

## 3. Caching Strategies

**When to use:** High latency on read-heavy endpoints, database CPU/memory peaking on repeated queries, designing systems expecting massive read throughput, content rarely changes but reads happen constantly.

**When NOT to use:** Before optimizing database queries, for data that changes frequently or is highly personalized, when consistency > performance, as quick fix for poor architecture.

**Workflow:**
1. Identify Bottlenecks — profile APIs for read-heavy, slow-changing data
2. Measure Access Patterns — read vs. write frequency, size, acceptable staleness
3. Select Strategy — Cache-Aside, Write-Through, or Write-Behind
4. Set Eviction Policy — assign TTL values based on business tolerance for stale data
5. Handle Invalidation — implement cache invalidation on mutations (UPDATE/DELETE)
6. Prevent Stampedes — caching locks or staggered TTLs
7. Add Monitoring — track hit rates, eviction rates, staleness

**Rules:**
- MUST treat cache as ephemeral (can disappear at any time)
- MUST NOT cache PII in shared caches
- MUST ALWAYS implement fallback to primary data store on cache failure
- MUST set TTL values (no infinite cache)
- MUST invalidate cache on mutations
- MUST use separate caches for different data types/sensitivity levels
- MUST NOT use cache as source of truth

**Anti-patterns:** Infinite TTL, premature caching, no fallback, over-caching, forgetting invalidation, cache stampede, storing mutable objects.

---

## 4. CI/CD Pipeline Architecture

**When to use:** Setting up GitHub Actions / GitLab CI / Jenkins, automating manual deployments, enforcing code quality on PRs, establishing environment promotion strategy (dev → staging → production).

**When NOT to use:** Local development builds (use Makefile/npm scripts), manual hotfixes (always use pipeline).

**Workflow:**
1. Trigger Definition — tests/linters on `pull_request`, builds/deployments on `push` to `main` or `release` tags
2. Fail Fast — run linters/type checkers first, halt before expensive test suites
3. Automate Testing — unit and integration tests in isolated ephemeral containers
4. Build Immutable Artifacts — compile/build exactly ONCE, tag with commit SHA
5. Promote the Artifact — deploy SAME artifact staging→production, do not rebuild
6. Monitor Deployment — log status, verify health checks, alert on failures
7. Rollback Strategy — revert to previous artifact tag

**Rules:**
- MUST inject secrets via platform's secret manager (NEVER hardcode)
- MUST fail immediately on non-zero exit code
- MUST tag artifacts with commit SHA (no "latest" in production)
- MUST build artifact exactly once, promote across environments
- MUST NOT rebuild for different environments
- MUST NOT ignore flaky tests (no `continue-on-error: true`)
- MUST NOT allow manual deployments outside pipeline
- MUST cache dependencies between runs

**Anti-patterns:** Rebuilding per environment, flaky test tolerance, deploying from local, hardcoded secrets, concurrent deployments, no artifact tracking, test skipping.

---

## 5. Code Review Guidelines

**When to use:** Evaluating a PR/MR, providing constructive feedback, ensuring code quality, building new team members' skills.

**When NOT to use:** Nitpicking personal coding style (use linters), blocking on subjective preferences, reviewing without context.

**Workflow:**
1. Understand the Goal — read PR description and linked ticket FIRST
2. Review Architecture — structural integrity, new dependencies justified, right abstraction level
3. Review Logic — error handling, edge cases, off-by-one, security implications
4. Check Tests — unit/integration tests test actual behavior, not just coverage
5. Consider Performance — N+1 queries, memory leaks, sync blocking in async code
6. Provide Feedback — explain the WHY, differentiate blocking vs. suggestions
7. Be Constructive — phrase as questions, assume positive intent

**Rules:**
- MUST assume positive intent; critique the code, not the author
- MUST automate style/formatting via linters (no arguing over spacing)
- MUST approve immediately if code improves codebase, even if not perfect
- MUST provide context/links when referring to standards
- MUST distinguish blocking requests from optional suggestions
- MUST NOT block on personal style preferences
- MUST NOT require unrelated changes

**Anti-patterns:** Gatekeeping, rubber stamping, scope creep, vague comments, late requests, dismissive tone.

---

## 6. Database Query Optimization

**When to use:** Writing complex SQL or ORM access, resolving performance bottlenecks on read-heavy endpoints, designing schema migrations for growing datasets, refactoring loops making repeated DB calls.

**When NOT to use:** Schema design, database selection, caching strategies (see Caching Strategies), application-level performance.

**Workflow:**
1. Profile the Bottleneck — EXPLAIN ANALYZE on slow queries
2. Identify N+1 — loops making repetitive DB calls for same entity
3. Measure Selectivity — analyze WHERE clause filters, index highly selective columns
4. Replace Loops — N+1 → single IN queries or ORM eager-loading (JOINs)
5. Remove Over-Fetching — replace SELECT * with explicit columns
6. Add Indexes — B-Tree on WHERE, JOIN, ORDER BY columns
7. Paginate — enforce LIMIT and OFFSET (or cursor pagination)
8. Verify Performance — re-run EXPLAIN ANALYZE, benchmark end-to-end latency

**Rules:**
- MUST explicitly define selected columns (NEVER SELECT * in production)
- MUST NEVER have database operations inside loops
- MUST perform filtering/aggregation in database, not application memory
- MUST enforce LIMIT and OFFSET on collection queries
- MUST EXPLAIN before adding indexes
- MUST rollback indexes if they degrade INSERT/UPDATE performance
- MUST NOT over-index

**Anti-patterns:** N+1 problem, over-indexing, application-side filtering, SELECT *, unbounded queries, ignoring selectivity.

---

## 7. Debugging Strategies

**When to use:** Investigating production defects, failing tests with no obvious root cause, understanding undocumented legacy code, debugging intermittent failures (flaky tests).

**When NOT to use:** Performance optimization (see Caching Strategies, Database Query Optimization), code review (see Code Review Guidelines), architecture decisions.

**Workflow:**
1. Reproduce the Bug — consistently replicate failure state; if you can't, STOP and get more details
2. Isolate the Subsystem — binary search (comment out code halves, `git bisect`, logging)
3. Formulate Hypothesis — propose WHY based on logs, stack traces, code inspection
4. Test Hypothesis — targeted logging or debugger to verify assumptions
5. Apply Minimal Fix — change ONLY what's necessary (single line if possible)
6. Verify Fix — failing test passes, no other tests break
7. Add Regression Test — ensure bug never reoccurs

**Rules:**
- MUST establish reproducible test BEFORE changing code
- MUST change one variable/line at a time during hypothesis testing
- MUST NOT apply multiple changes simultaneously
- MUST use binary search for isolation
- MUST formulate hypothesis before adding logging/changes
- MUST keep fix minimal

**Anti-patterns:** Shotgun debugging, blaming the compiler, excessive debug logging, not isolating, fixing symptoms, multiple changes at once.

---

## 8. DOM Security Hardening

**When to use:** Setting up index.html/document root, refactoring legacy direct DOM manipulation, auditing frontend for XSS, processing rich text/markdown from untrusted users, creating forms/chat systems.

**When NOT to use:** CSS framework design, React component prop validation (see React Component Design), backend input validation.

**Workflow:**
1. Enforce CSP — strict `<meta http-equiv="Content-Security-Policy">` in `<head>` (or HTTP headers)
2. Externalize Assets — ALL inline `<script>` and `<style>` into separate files
3. Remove Inline Events — replace `onclick="..."` etc. with `addEventListener`
4. Replace Unsafe DOM — replace `innerHTML`/`outerHTML`/`dangerouslySetInnerHTML` with `textContent`/`innerText`
5. Implement Sanitizer — DOMPurify if HTML rendering is REQUIRED
6. Test CSP — verify policy blocks unauthorized execution
7. Verify No Bypasses — OWASP ZAP or Burp to confirm XSS vectors closed

**Rules:**
- MUST implement strict CSP: `default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'`
- MUST NEVER use inline `<script>` blocks
- MUST NEVER use inline `style="..."` attributes
- MUST NEVER use `eval()`, `setTimeout(string)`, `new Function(string)`
- MUST NEVER use `innerHTML`/`outerHTML`/`dangerouslySetInnerHTML` with user input
- MUST use `textContent`/`innerText` for dynamic text insertions
- MUST sanitize user HTML with DOMPurify before insertion
- MUST NOT use `'unsafe-inline'` or `'unsafe-eval'` in CSP

**Anti-patterns:** `innerHTML` assignment, `javascript:` URIs, unsafe CSP, event handler strings, trusting user input, missing sanitizer.

---

## 9. Error Handling Architecture

**When to use:** Setting up a new backend service, refactoring uncoordinated `try/catch` blocks, standardizing API error responses, implementing a new microservice.

**When NOT to use:** Client-side error handling, monitoring/alerting setup (see Logging & Observability), specific framework error documentation.

**Workflow:**
1. Define Error Classes — base `AppError` with `statusCode`, `isOperational` flag, metadata
2. Categorize Errors — Operational (bad input, network) vs. Programmer (null ptr, logic bug)
3. Centralize Middleware — framework-level error handler catching ALL exceptions globally
4. Log Appropriately — full stack for 5xx, metadata only for 4xx
5. Sanitize Output — strip stack traces and internal details before sending to client
6. Crash on Programmer Error — unhandled programmer errors MUST crash and restart
7. Test Error Paths — verify error handling for all failure scenarios

**Rules:**
- MUST NEVER silently swallow exceptions (`catch(e) {}`)
- MUST crash and restart for unhandled Programmer Errors
- MUST standardize all HTTP error responses to RFC 7807 format
- MUST log full stack traces for 5xx errors
- MUST log only message and context for 4xx errors
- MUST sanitize all error responses (no DB details, SQL, stack traces)
- MUST NEVER throw string literals (always throw Error objects)
- MUST distinguish Operational from Programmer errors

**Anti-patterns:** Throwing strings, leaking DB details, silent catching, 200 OK for errors, generic messages, unhandled promises.

---

## 10. Event-Driven Design

**When to use:** De-coupling monolithic microservices, implementing long-running async workflows (video processing, email sending), triggering multiple side-effects from a single action, designing systems needing replay/audit.

**When NOT to use:** Simple sync request-response flows, real-time bidirectional communication (use WebSockets), workflows requiring immediate response.

**Workflow:**
1. Define Events — past-tense state changes (`OrderPlaced`, `UserRegistered`, `PaymentProcessed`)
2. Design Event Payloads — Event ID, Timestamp, Event Type, minimal required data
3. Publishing Mechanism — producer emits to Message Broker without caring about consumers
4. Idempotent Consumers — same event processed multiple times = same outcome
5. Handle Failures — Dead Letter Queues (DLQ) for repeatedly failing events
6. Track Processing — idempotency keys or processed event IDs to detect duplicates
7. Monitor — alerts on DLQ messages and processing delays

**Rules:**
- MUST model events as immutable facts (past tense: `OrderPlaced` not `PlaceOrder`)
- MUST NEVER modify/delete events once emitted
- MUST make consumers idempotent
- MUST avoid deeply nested entity graphs in payloads
- MUST include Event ID, Timestamp, Event Type in all events
- MUST implement Dead Letter Queues for failed events
- MUST NOT use synchronous HTTP calls as part of event workflows

**Anti-patterns:** Commands as events, distributed monolith (sync HTTP in event handlers), huge payloads, no idempotency, synchronous dependencies, event loss.

---

## 11. Frontend Design

**Approach:** Design lead at a small studio known for distinctive visual identity. Make deliberate, opinionated choices about palette, typography, and layout specific to the brief.

**Ground it in the subject:** Name one concrete subject, its audience, and the page's single job. The subject's own world (materials, instruments, artifacts, vernacular) is where distinctive choices come from.

**Design principles:**
- **Hero is a thesis** — open with the most characteristic thing in the subject's world
- **Typography carries personality** — pair display and body faces deliberately, not defaults
- **Structure is information** — devices (numbering, dividers, labels) should encode something true
- **Motion deliberately** — think about where/whether animation serves the subject
- **Match complexity to vision** — elegant execution of the chosen direction

**Process:** Brainstorm → Explore → Plan → Critique → Build → Critique again. Work in two passes:
1. Create a compact token system: color (4-6 hex values), type (2+ roles), layout concept with ASCII wireframes, signature element
2. Review plan against brief — if it reads like a generic default, revise

**Restraint:** Spend boldness in one place. Let the signature element be the one memorable thing; keep everything else quiet.

**Writing in design:** Words make it easier to understand/use. Write from the end user's side. Active voice. Cohesion and consistency. Treat failure and emptiness as moments for direction.

---

## 12. Git Workflow & Branching

**When to use:** Starting a new feature/bugfix ticket, reviewing PRs and merging, hotfixing production, onboarding new team members.

**When NOT to use:** Complex merge conflicts (use git docs), repository history rewrites, CI/CD trigger configuration.

**Workflow:**
1. Sync Main — always fetch/pull latest from `main` before creating branch
2. Create Branch — `type/ticket-id-short-description` (e.g., `feat/PROJ-123-add-login`)
3. Commit Atomically — small logical chunks, Conventional Commits format
4. Keep Branch Synced — rebase against `main` frequently
5. Push Regularly — push to remote regularly
6. Rebase Before PR — interactive rebase to clean up WIP commits
7. Squash Merge — squash-merge to keep main history clean
8. Delete Branch — delete feature branch after merging

**Rules:**
- MUST NEVER push directly to `main` (always PRs)
- MUST use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- MUST rebase before PR (no merge commits from main)
- MUST delete feature branches after merging
- MUST NOT commit "wip", "fixed typo", "trying again"
- MUST resolve conflicts locally before pushing
- MUST NOT force-push to shared branches
- MUST keep feature branches <5 days old

**Anti-patterns:** WIP commits, long-lived branches, merge commits, squashing too early, force pushing to shared, vague messages.

---

## 13. Logging & Observability Standards

**When to use:** Bootstrapping a new backend service/API, refactoring disorganized `console.log`/`print` statements, designing multi-service systems, setting up monitoring/alerting/debugging infrastructure.

**When NOT to use:** APM, security incident response (SIEM), user analytics.

**Workflow:**
1. Implement Structured Logging — NDJSON (Newline Delimited JSON), not plain text
2. Inject Context — `correlation_id`/`trace_id` at HTTP entry, pass through downstream calls
3. Standardize Levels — ERROR (system broken), WARN (unexpected but recovered), INFO (lifecycle), DEBUG (verbose tracing)
4. Sanitize Data — redaction middleware for credentials, tokens, PII
5. Add Request Context — duration, status code, user context (anonymized), performance metrics
6. Trace Async Flows — correlation ID through event handlers, message queues, inter-service calls
7. Monitor Log Health — alert on high ERROR rates, missing correlation IDs

**Rules:**
- MUST output JSON in production (not plain text)
- MUST include Request/Correlation ID in all HTTP requests
- MUST NEVER log raw passwords, session tokens, financial data
- MUST log full stack traces for ERROR level
- MUST log only message/context for WARN/INFO
- MUST redact/sanitize PII before log emission
- MUST include timestamps in UTC
- MUST standardize key names across all logs

**Anti-patterns:** String concatenation in logs, logging expected errors as ERROR, silent catching, no context/correlation ID, unstructured logs, missing timestamps, over-logging.

---

## 14. React Component Design

**When to use:** Building a new UI element, refactoring monolithic components, extracting shared UI patterns, adding features to existing component hierarchy, preparing for cross-team reuse.

**When NOT to use:** Styling implementation details (see DOM Security Hardening), state management architecture (see State Management Patterns), memo/useMemo performance optimization.

**Workflow:**
1. Define the API — TypeScript interface for props BEFORE component body
2. Verify Props — only what the component needs, no unnecessary inherited types
3. Isolate Logic — complex state/side-effects into custom hooks (NEVER in component body)
4. Render JSX — static JSX based solely on props and hook return values
5. Apply Styles — CSS classes via `className`, NEVER inline `style={{...}}`
6. Export Type — export both component AND Props interface
7. Verify Size — file ≤ 150 lines; if larger, extract sub-components

**Rules:**
- MUST be a pure function: identical props = identical output
- MUST export strictly typed interface named `[ComponentName]Props`
- MUST NOT exceed 150 lines per file
- MUST NOT use inline styles
- MUST NOT drill props more than 2 levels deep
- MUST NOT fetch data directly (use hooks or parent)
- MUST support `className` prop for customization

**Anti-patterns:** Prop drilling >2 levels, inline styles, God components, state in props (`useState(props.val)`), implicit dependencies, class components.

---

## 15. State Management Patterns

**When to use:** Adding interactive features requiring data persistence across views, refactoring excessive re-renders, integrating external data fetching with UI state, deciding where new state lives, migrating from Redux unnecessarily.

**When NOT to use:** Component-level prop decisions (see React Component Design), server caching strategy (see Caching Strategies), real-time sync protocols.

**Workflow:**
1. Categorize State — UI-only, Server, URL-driven, Truly Global
2. URL First — move ALL sort, filter, pagination, search, tab params to URL search params
3. Separate Server Cache — React Query / SWR / TanStack Query for ALL server data (never Redux)
4. Localize UI State — form inputs, modals, toggles, tooltips in component `useState`
5. Identify Global — ONLY theme, auth, language preferences go to Context/Redux
6. Implement Separation — refactor to respect boundaries
7. Verify Sync — no state duplicated across layers

**Rules:**
- MUST store shareable states (filters, search, pagination) in URL, not Redux/Context
- MUST use React Query/SWR for server data, NEVER Redux
- MUST NOT manually sync server data between global store and cache layer
- MUST NOT store UI-only state in global store
- MUST NOT mirror props into local state
- MUST NOT have duplicate copies of state

**Anti-patterns:** Mirroring state (`useState(props.val)`), global everything in Redux, manual server sync, URL-less navigation, inverted cache (Redux as server data source of truth).

---

## 16. Theme Factory

**When to use:** Styling artifacts (slides, docs, reports, HTML landing pages) with consistent professional themes.

**Workflow:**
1. Show the theme showcase (`theme-showcase.pdf`) to allow user to see all 10 themes visually
2. Ask for their choice of theme
3. Wait for explicit selection
4. Apply the selected theme's colors and fonts to the artifact

**Available Themes:**
1. Ocean Depths — professional maritime
2. Sunset Boulevard — warm vibrant sunset
3. Forest Canopy — natural earth tones
4. Modern Minimalist — clean contemporary grayscale
5. Golden Hour — rich warm autumnal
6. Arctic Frost — cool crisp winter
7. Desert Rose — soft sophisticated dusty
8. Tech Innovation — bold modern tech
9. Botanical Garden — fresh organic garden
10. Midnight Galaxy — dramatic cosmic deep

**Custom Theme Creation:** When no existing theme works, generate a new theme with a descriptive name, appropriate colors/fonts based on provided inputs. Show for review, then apply.

Each theme is defined in `themes/` with color palette hex codes and font pairings.
