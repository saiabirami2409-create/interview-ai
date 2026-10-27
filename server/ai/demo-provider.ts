import {
  AIProvider,
  GenerateQuestionsInput,
  GeneratedQuestion,
  EvaluateAnswerInput,
  EvaluationResult,
  GenerateReportInput,
  SessionReportResult,
} from "./types";
import { calculateWeightedOverallScore, determineReadinessLevel } from "./rubrics";
import { ROLE_MCQ_BANKS, GENERAL_TECHNICAL_MCQ_BANK, McqQuestionTemplate } from "./mcq-bank";

interface QuestionTemplate {
  q: string;
  cat: string;
  skills: string[];
  criteria: string;
  hints: string;
  keyConcepts: string[];
  sampleModelAnswer: string;
}

// Ultra-realistic, industry-standard interview question banks across all 10 professional roles
export const ROLE_QUESTION_BANKS: Record<
  string,
  Record<string, QuestionTemplate[]>
> = {
  "Full-Stack Developer": {
    TECHNICAL: [
      {
        q: "You are designing a high-traffic e-commerce checkout flow where 50,000 users attempt to purchase 500 limited-edition sneakers simultaneously during a flash sale. Walk through your database concurrency strategy (pessimistic vs. optimistic locking vs. Redis atomic decrements), idempotency handling, and how you prevent overselling without bottlenecking database write throughput.",
        cat: "High-Concurrency System Design",
        skills: ["Redis Atomic Operations", "PostgreSQL MVCC", "Idempotency Keys", "Distributed Locking", "Queue Buffering"],
        criteria: "Candidate should explain: 1) Redis DECR/DECRBY or Lua script for in-memory stock reservation; 2) Asynchronous order persistence via message queue (Kafka/RabbitMQ); 3) DB optimistic locking with version column or SELECT FOR UPDATE SKIP LOCKED; 4) Idempotency-Key headers on checkout POST.",
        hints: "Think about decoupling the stock reservation in fast in-memory cache from the slow relational DB order persistence.",
        keyConcepts: ["redis", "atomic", "lua", "decr", "optimistic", "pessimistic", "idempotency", "queue", "kafka", "rabbitmq", "lock", "concurrency"],
        sampleModelAnswer: "1. Architecture Overview: Decouple inventory decrement from order creation. 2. Stock Reservation: Store SKU stock in Redis and execute an atomic Lua script that checks `if stock > 0 then decrement and return 1 else return 0`. This guarantees single-threaded atomic operations in memory in <2ms. 3. Asynchronous Persistence: On successful decrement, publish an `OrderPlaced` event to Kafka. 4. DB Concurrency: Workers consume the event with an Idempotency Key, using optimistic concurrency (`UPDATE inventory SET stock = stock - 1, version = version + 1 WHERE id = sku_id AND version = current_version`). 5. Rollback: If payment gateway times out within 10 minutes, a TTL event triggers Redis increment compensation.",
      },
      {
        q: "Explain how React 19 Server Components (RSC) and Server Actions change data mutations and bundle size compared to traditional client-side data fetching with TanStack Query / useEffect. In what concrete scenarios can a server action lead to unexpected waterfall bottlenecks or security vulnerabilities?",
        cat: "Modern Frontend & Full-Stack Architecture",
        skills: ["React Server Components", "Next.js App Router", "Server Actions", "Streaming SSR", "CSRF Security"],
        criteria: "Explains zero-bundle impact of server dependencies, automatic POST endpoint generation for server actions, importance of revalidatePath/revalidateTag, and risks of sequential await waterfalls or exposing sensitive DB fields in action closures.",
        hints: "Consider what JavaScript actually ships to the client browser and how Server Actions serialize arguments.",
        keyConcepts: ["rsc", "server component", "server action", "bundle", "waterfall", "revalidate", "security", "csrf", "serialization", "streaming"],
        sampleModelAnswer: "1. Paradigm Shift: React Server Components execute exclusively on Node.js/Edge runtimes. Their import dependencies (e.g., date-fns, markdown parsers, Prisma) are never bundled into the client JS, drastically reducing First Input Delay (FID) and INP. 2. Data Mutations: Server Actions generate encrypted RPC endpoints, eliminating manual API boilerplates. 3. Bottleneck Risks: Nesting sequential `await` calls inside RSCs causes execution waterfalls; parallelizing with `Promise.all` or `<Suspense>` streaming boundaries is mandatory. 4. Security: Server Actions must treat all client arguments as untrusted input, requiring server-side Zod validation and session authentication guards to prevent privilege escalation.",
      },
      {
        q: "A mission-critical Next.js API route that generates PDF invoices is intermittently spiking CPU to 100% and throwing 504 Gateway Timeouts in production. Walk me through your step-by-step diagnostic workflow: tooling, V8 heap profiling, event loop lag monitoring, and architectural remediation.",
        cat: "Production Diagnostics & Performance",
        skills: ["Node.js Event Loop", "V8 Heap Snapshots", "CPU Profiling", "Clinic.js", "Worker Threads"],
        criteria: "Candidate should identify CPU-bound vs I/O-bound bottlenecks, offloading heavy compute (PDF generation) to Worker Threads or BullMQ background workers, and inspecting CPU profiles with Clinic.js or Chrome DevTools.",
        hints: "Remember that Node.js runs on a single main event loop thread; synchronous PDF rendering blocks all incoming requests.",
        keyConcepts: ["event loop", "worker threads", "cpu", "heap", "profiling", "clinic", "background job", "bullmq", "stream", "async"],
        sampleModelAnswer: "1. Diagnosis: Use Clinic.js Flame or Chrome DevTools node-inspect to capture a CPU profile during load. High CPU in PDF rendering libraries (like Puppeteer or pdfkit) confirms that synchronous rendering is blocking the V8 event loop. 2. Metrics: Monitor `perf_hooks.monitorEventLoopDelay()` to measure event loop lag under traffic. 3. Short-term Fix: Offload the synchronous PDF generation to Node.js `worker_threads` or child processes so the main HTTP thread remains responsive. 4. Long-term Architecture: Decouple the endpoint by returning a 202 Accepted with a job ID, dispatching the render task to a distributed Redis/BullMQ queue processed by dedicated worker containers.",
      },
      {
        q: "Walk through how you would architect a real-time collaborative workspace (like Google Docs or Figma) supporting 20 simultaneous active editors per document. Compare Operational Transformation (OT) with Conflict-Free Replicated Data Types (CRDTs) and explain your WebSocket connection state management.",
        cat: "Real-time Collaboration & Distributed State",
        skills: ["WebSockets", "CRDTs (Yjs/Automerge)", "Operational Transformation", "Redis Pub/Sub", "State Synchronization"],
        criteria: "Candidate compares centralized server coordination in OT vs decentralized peer/server convergence in CRDTs (e.g. Yjs, LWW-Element-Set), explains WebSocket heartbeat/reconnection logic, and horizontal scaling via Redis Pub/Sub.",
        hints: "Think about what happens when two users type at the exact same character index at the exact same millisecond.",
        keyConcepts: ["crdt", "ot", "websocket", "yjs", "conflict", "redis", "pubsub", "heartbeat", "reconnection", "convergence"],
        sampleModelAnswer: "1. Technology Selection: Prefer CRDTs (e.g., Yjs or Automerge) over classic OT because CRDTs achieve mathematical eventual consistency without requiring a central serialization server to sequence every keystroke. 2. Transport Layer: Establish WebSockets over TLS with a 30-second ping/pong heartbeat and exponential backoff reconnection. 3. Horizontal Scaling: Use a Redis Pub/Sub or NATS cluster to fan out room updates across multiple Node.js WebSocket gateway instances. 4. State Persistence: Periodically compress and flush document binary state vectors to an S3 object store with incremental write-ahead logging in Postgres.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "Describe a scenario where you discovered a critical security vulnerability or severe architectural flaw in production code written by a senior engineer or team lead. How did you verify the issue, communicate it without creating hostility, and drive the resolution?",
        cat: "Technical Conflict & Influence",
        skills: ["STAR Method", "Security Mindset", "Diplomacy", "Constructive Feedback"],
        criteria: "Uses STAR framework: details specific vulnerability, reproduces it safely with a POC, discusses it privately with data rather than blame, pairs on the patch, and adds automated CI regression tests.",
        hints: "Focus on blameless communication, objective vulnerability reproduction, and shared ownership of software quality.",
        keyConcepts: ["star", "situation", "task", "action", "result", "vulnerability", "diplomacy", "private", "proof of concept", "ci/cd"],
        sampleModelAnswer: "Situation: In my previous project, I noticed an endpoint lacked tenant-scoped foreign key checks, allowing horizontal BOLA/IDOR access across customer accounts. Task: As a junior engineer, I needed to get this patched immediately without undermining the senior author. Action: I wrote an isolated local reproduction test case demonstrating the data leak. Instead of calling it out publicly in Slack, I scheduled a 15-minute 1-on-1 with the author, framed the finding around edge-case security hardening, and offered a draft PR with parameterized SQL guards. Result: The lead reviewed and merged the patch within 2 hours, and we collaborated to add a custom ESLint/Semgrep rule into our CI/CD pipeline.",
      },
      {
        q: "Tell me about a high-pressure engineering deadline where business stakeholders wanted to cut corners on testing and monitoring to hit an arbitrary marketing date. How did you balance business urgency with engineering integrity?",
        cat: "Stakeholder Negotiation & Trade-offs",
        skills: ["STAR Method", "Risk Management", "Scope Prioritization", "Stakeholder Communication"],
        criteria: "Follows STAR: illustrates conflicting priorities, presents risk-adjusted compromise (cutting non-critical feature scope rather than core testing), and delivers on time with stability.",
        hints: "Never frame it as 'business vs. engineering'; frame it as protecting company reputation and customer experience.",
        keyConcepts: ["star", "stakeholder", "deadline", "risk", "scope", "testing", "monitoring", "trade-off", "compromise"],
        sampleModelAnswer: "Situation: Two weeks before a flagship placement portal launch, product management requested adding live resume exports, threatening to skip unit tests and integration tests to meet the date. Task: Prevent shipping untested code while honoring the launch commitment. Action: I quantified the business risk of checkout/export failures during peak traffic. I proposed a phased compromise: ship the core portal with 100% test coverage and telemetry on schedule, while rolling out resume export 10 days later as a fast-follow v1.1. Result: Stakeholders agreed. The v1.0 launch went live with zero downtime or P1 errors, and the follow-up feature was delivered safely the following week.",
      },
    ],
    HR: [
      {
        q: "Why do you want to join our engineering organization specifically, and how do you plan to transition from an academic/fresher mindset into a high-ownership production software engineer within your first 90 days?",
        cat: "Culture Alignment & 30-60-90 Day Plan",
        skills: ["Self-Awareness", "Ownership", "Onboarding Roadmap", "Company Research"],
        criteria: "Demonstrates authentic knowledge of company products, articulates a structured 30-60-90 day ramp-up plan (absorbing domain, fixing small bugs, taking on feature ownership), and eagerness for technical mentorship.",
        hints: "Show intentionality: Day 1-30 is learning & pairing, Day 31-60 is independent feature delivery, Day 61-90 is improving tooling or documentation.",
        keyConcepts: ["30-60-90", "ownership", "mentorship", "production", "culture", "initiative", "feedback"],
        sampleModelAnswer: "In my first 30 days, my primary focus is understanding the domain, setting up a zero-friction local environment, reading production incident postmortems, and submitting small documentation and bug-fix PRs to master the CI/CD workflow. In days 31 to 60, I aim to take ownership of mid-sized user stories, proactively solicit constructive feedback during code reviews, and pair with senior engineers. By day 90, I plan to be fully on-call, contributing to architecture discussions, and improving test tooling for my team.",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Walk me through the most complex project on your resume. What was the single biggest architectural bottleneck you encountered, what metrics proved it was a bottleneck, and what was your exact technical fix?",
        cat: "Deep Project Defense",
        skills: ["Architectural Defense", "Performance Metrics", "Root Cause Analysis", "Engineering Ownership"],
        criteria: "Candidate describes project purpose, pinpoints exact quantitative metric (e.g. p99 latency 2.4s -> 180ms, CPU 90% -> 25%), describes root cause, and details the refactoring.",
        hints: "Avoid vague statements like 'we improved it'. Use numbers, protocols, queries, and specific before/after measurements.",
        keyConcepts: ["metrics", "p99", "latency", "bottleneck", "database", "query", "refactor", "index", "cache"],
        sampleModelAnswer: "In my full-stack mock interview platform, our initial answer evaluation endpoint took 4.8 seconds p99 latency because we executed AI evaluations, PDF report generation, and multi-table database transactions sequentially in a single HTTP request handler. Using Datadog APM traces, I observed that external AI model round-trips accounted for 80% of request duration. I refactored the architecture by introducing a background queue: the API immediately returns a 202 with an evaluation tracking ID, while a BullMQ worker executes the AI prompt asynchronously and broadcasts completion via WebSockets. This brought our API response time down to 120ms.",
      },
    ],
  },

  "Frontend Developer": {
    TECHNICAL: [
      {
        q: "Explain how browser rendering engines calculate Interaction to Next Paint (INP) and Largest Contentful Paint (LCP). Your team's Next.js web application has an INP score of 420ms on mobile devices during complex data table interactions. Walk through your diagnostic process and concrete remediation techniques.",
        cat: "Core Web Vitals & Browser Internals",
        skills: ["INP Optimization", "LCP", "Long Tasks", "useDeferredValue", "Web Workers", "requestIdleCallback"],
        criteria: "Explains input delay, processing time, and presentation delay components of INP. Details breaking up long tasks (>50ms), using React 19 `useTransition` or `useDeferredValue`, offloading sorting/filtering to Web Workers, and minimizing main thread layout thrashing.",
        hints: "Break INP into its three distinct phases: Input Delay, Processing Time, and Presentation Delay.",
        keyConcepts: ["inp", "lcp", "web vitals", "long tasks", "event loop", "usedeferredvalue", "usetransition", "web worker", "layout thrashing", "devtools"],
        sampleModelAnswer: "1. Understanding INP: INP measures the worst latency of user interactions across three phases: Input Delay (waiting for main thread to clear), Processing Duration (running JavaScript event handlers), and Presentation Delay (browser recalculating style, layout, and compositing pixels). 2. Diagnostics: Use Chrome DevTools Performance Profiler with 4x CPU throttling to locate Long Tasks (>50ms). Look for heavy synchronous state updates or DOM manipulations. 3. Remediation: Wrap expensive table re-renders in `startTransition` or `useDeferredValue` so user typing remains snappy. Offload 10,000-row filtering and multi-column sorting to a dedicated Web Worker via Comlink. Use virtualized scrolling (e.g., TanStack Virtual) to keep DOM nodes under 100 elements.",
      },
      {
        q: "Deep dive into React's Fiber architecture. How does Fiber enable time slicing and concurrent rendering? What happens under the hood when a component tree undergoes an interruption by a higher-priority user interaction?",
        cat: "React Engine & Fiber Internals",
        skills: ["React Fiber", "Concurrent Mode", "Time Slicing", "Work In Progress Tree", "Scheduler Priorities"],
        criteria: "Explains singly linked list Fiber node structure (child, sibling, return), dual buffering (current vs workInProgress), Cooperative Scheduling via MessageChannel, and discarding/restarting incomplete work on user interrupts.",
        hints: "Contrast the old stack reconciler (recursive, blocking) with Fiber (linked-list, interruptible unit of work).",
        keyConcepts: ["fiber", "reconciliation", "time slicing", "workinprogress", "scheduler", "priority", "linked list", "interrupt", "dual buffering"],
        sampleModelAnswer: "1. Problem with Stack Reconciler: In React 15, reconciliation was synchronous recursion. Once rendering started, the main thread was blocked until completion, causing frame drops. 2. Fiber Architecture: A Fiber is a JavaScript object representing a unit of work with `child`, `sibling`, and `return` pointers. This transforms the component tree into a singly linked list that can be traversed iteratively and paused at any node. 3. Concurrent Scheduling: React's Scheduler assigns priority levels (Immediate, User-Blocking, Normal, Low). Using `requestHostCallback` with a MessageChannel, React yields control to the browser every 5ms. 4. Dual Buffering: React maintains a `current` tree (rendered DOM) and builds a `workInProgress` tree in memory. If a high-priority user click arrives while building a low-priority transition, React abandons the work-in-progress tree, processes the click immediately, and restarts low-priority work.",
      },
      {
        q: "You are tasked with building an accessible, responsive Design System component for a nested multi-select Combobox / Autocomplete from scratch without external libraries. How do you guarantee WCAG 2.1 AA compliance, keyboard navigation (Escape, ArrowDown/Up, Enter, Home/End), and ARIA 1.2 combobox role patterns?",
        cat: "Accessibility & Design Systems",
        skills: ["WCAG 2.1 AA", "ARIA 1.2 Combobox", "Keyboard Traps", "Focus Management", "Screen Readers"],
        criteria: "Covers `role='combobox'`, `aria-expanded`, `aria-autocomplete='list'`, `aria-controls`, `aria-activedescendant` for virtual focus, handling focus-visible, and preventing screen reader announcements from cluttering.",
        hints: "Focus on virtual focus using `aria-activedescendant` versus moving actual DOM focus to each option.",
        keyConcepts: ["wcag", "aria", "combobox", "activedescendant", "keyboard", "accessibility", "focus", "screen reader"],
        sampleModelAnswer: "1. Semantic Structure: The input element receives `role='combobox'`, `aria-expanded={isOpen}`, `aria-haspopup='listbox'`, `aria-autocomplete='list'`, and `aria-controls='options-list'`. 2. Focus Management: To avoid disrupting the typing flow, keep physical DOM focus inside the `<input>` and use `aria-activedescendant='option-{id}'` to indicate virtual focus to screen readers as the user presses ArrowDown and ArrowUp. 3. Keyboard Interactions: Escape closes the menu and clears selection; Enter selects the active descendant; Home and End jump to the first and last options. 4. Visual Accessibility: Ensure minimum 4.5:1 text contrast, explicit `:focus-visible` outlines with high-contrast rings, and support for high contrast mode.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "Describe a situation where UX designers gave you high-fidelity Figma mockups featuring heavy animations and micro-interactions that would severely degrade performance on low-end Android mobile devices. How did you negotiate and implement a high-performance alternative?",
        cat: "Design & Engineering Collaboration",
        skills: ["STAR Method", "Performance Empathy", "Negotiation", "CSS Transforms/Opacity"],
        criteria: "Uses STAR: demonstrates understanding of composite-only animations (transform, opacity), presents data from low-end device benchmarks, and negotiates graceful degradation / prefers-reduced-motion.",
        hints: "Focus on presenting performance data constructively to designers rather than saying 'that's impossible'.",
        keyConcepts: ["star", "figma", "designer", "animation", "performance", "transform", "opacity", "low-end", "compromise"],
        sampleModelAnswer: "Situation: Our design team delivered an interactive 3D particle hero section with backdrop-blur cards for our mobile homepage. Task: Implement the brand vision without tanking our 60fps budget on budget Android smartphones. Action: I benchmarked the prototype on a Moto G device, recording a 14fps frame rate and 850ms input delay due to GPU fill-rate limits. I invited the lead designer to test the device firsthand. Together, we agreed on an adaptive solution: desktop and high-end GPUs render the WebGL particles, while mobile devices render a lightweight CSS radial gradient using hardware-accelerated transforms and opacity. Result: Maintained 60fps across 99% of mobile devices and achieved a 98 Mobile Lighthouse Performance score.",
      },
    ],
    HR: [
      {
        q: "Frontend technologies evolve rapidly (React 19, Turbopack, Tailwind, Astro). How do you critically evaluate whether a shiny new library is ready for production adoption versus being an unnecessary distraction for your team?",
        cat: "Technology Pragmatism",
        skills: ["Evaluation Framework", "Tech Debt Management", "Ecosystem Longevity"],
        criteria: "Articulates a clear rubric: bundle size, community maintenance, security vulnerabilities, migration cost, team learning curve, and measurable business ROI.",
        hints: "Show that you are a pragmatic software engineer, not a framework chaser.",
        keyConcepts: ["pragmatism", "bundle size", "roi", "maintenance", "stability", "security", "learning curve"],
        sampleModelAnswer: "I evaluate new libraries against a 5-pillar rubric: 1. Business ROI: Does this solve a concrete bottleneck (e.g. bundle size reduction, faster build times) or is it cosmetic? 2. Ecosystem Health: Inspect GitHub commit cadence, open issues ratio, CVE security history, and backing organizations. 3. Maintenance Cost: How steep is the team learning curve, and what is the risk of abandonment? 4. Proof of Concept: Isolate the tool in a spike branch and test with end-to-end integration tests. 5. Reversibility: If the library fails in production, how hard is it to roll back?",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Pick a complex web application you built. Walk me through your state management architecture. Why did you choose that particular state model (e.g. Zustand, Redux Toolkit, Context, Server State) and how did you prevent unnecessary component re-renders?",
        cat: "State Architecture Defense",
        skills: ["State Management", "Selectors", "Re-render Optimization", "Context API vs Store"],
        criteria: "Defends separation between Server Cache (React Query/SWR) and Client UI State (Zustand/Jotai), explains selector memoization, and profiles re-renders with React Profiler.",
        hints: "Demonstrate why putting everything into React Context causes global re-render cascades.",
        keyConcepts: ["zustand", "redux", "context", "re-render", "selector", "server state", "memoization", "profiler"],
        sampleModelAnswer: "In our analytics dashboard, we separated state into two distinct tiers: Server Cache and Ephemeral Client UI State. For server state, we used TanStack Query, which handles background refetching, deduplication, and garbage collection. For local UI state (such as active filters, drawer toggles, and multi-chart brushing), we used Zustand with atomic selectors (`useStore(state => state.activeFilter)`). By avoiding React Context for high-frequency updates, only the specific consumer components re-render when filters change, reducing dashboard re-render cycles by 70%.",
      },
    ],
  },

  "Backend Developer": {
    TECHNICAL: [
      {
        q: "You are designing an idempotent financial ledger API where clients issue debit requests. If a network timeout occurs while the client awaits a response, the client will retry up to 3 times. Design the database schema, transaction boundary, and distributed locking mechanism that guarantees zero duplicate debits and zero balance inconsistencies.",
        cat: "Financial Systems & Distributed Concurrency",
        skills: ["Idempotency Keys", "Two-Phase Commit / Sagas", "Double-Entry Bookkeeping", "Distributed Locks", "PostgreSQL Isolation"],
        criteria: "Covers: 1) Double-entry bookkeeping (never mutable `balance` column, always credit/debit entries); 2) Idempotency table with unique key constraint; 3) `SELECT ... FOR UPDATE` on account row or Redis distributed lock; 4) Transaction atomicity.",
        hints: "Remember the core rule of financial systems: balances are derived from immutable append-only ledger entries, never overwritten.",
        keyConcepts: ["idempotency", "ledger", "double-entry", "lock", "redis", "transaction", "serializable", "retry", "timeout"],
        sampleModelAnswer: "1. Double-Entry Model: Never store a mutable balance column that is directly updated. Create an append-only `ledger_entries` table with debit and credit rows. 2. Idempotency Guard: Create an `idempotency_keys` table with columns `(idempotency_key, request_hash, response_body, status, created_at)`. 3. Transaction Execution: Within a `READ COMMITTED` or `REPEATABLE READ` transaction, attempt to insert the idempotency key with status `PENDING`. If a unique key collision occurs, return the cached response or wait if pending. 4. Account Locking: Lock the account record using `SELECT id FROM accounts WHERE id = :id FOR UPDATE` to serialize concurrent requests. Verify sufficient balance, insert the corresponding debit and credit entries, update idempotency status to `COMPLETED`, and commit.",
      },
      {
        q: "Compare PostgreSQL B-Tree indexes, BRIN indexes, and GiST/GIN indexes. In a multi-tenant database table with 100 million rows, when does a multi-column compound index fail to be used by the query planner, and how does index column ordering dictate index scan efficiency?",
        cat: "Database Internals & Query Optimization",
        skills: ["PostgreSQL Query Planner", "Compound Indexing", "B-Tree vs BRIN", "EXPLAIN ANALYZE", "Index Skip Scans"],
        criteria: "Explains B-Tree left-prefix rule, high-cardinality leading column strategy, BRIN index efficiency for append-only time-series data, and identifying sequential scans caused by functions or leading wildcards.",
        hints: "Think about the index key ordering: an index on (A, B) cannot satisfy a query filtering only on WHERE B = 5 without an index skip scan.",
        keyConcepts: ["b-tree", "brin", "gin", "compound index", "left prefix", "cardinality", "explain analyze", "planner", "index scan"],
        sampleModelAnswer: "1. B-Tree Mechanics: B-Trees are balanced search trees storing sorted keys. Multi-column indexes `(col_a, col_b)` strictly follow the leftmost-prefix rule: queries filtering on `col_a` or `col_a AND col_b` use the index efficiently, but queries filtering solely on `col_b` cannot perform a B-Tree search and trigger an index scan or table scan. 2. Column Ordering: Place high-cardinality equality columns first, followed by range/sorting columns. 3. BRIN Indexes: Block Range Indexes store minimum and maximum values per physical disk page block. For massive append-only tables (e.g. 100M audit logs ordered by `created_at`), BRIN indexes consume less than 1% of the RAM of a B-Tree while delivering fast range scans.",
      },
      {
        q: "Explain how Apache Kafka manages consumer group partition rebalancing. What are the engineering differences between eager rebalancing and cooperative sticky rebalancing, and how do you prevent consumer group flapping during prolonged garbage collection pauses?",
        cat: "Distributed Streaming & Message Queues",
        skills: ["Kafka Architecture", "Consumer Group Rebalance", "Cooperative Sticky", "Heartbeats & GC Pauses", "Partition Offsets"],
        criteria: "Contrasts stop-the-world eager rebalance with incremental cooperative rebalance. Explains `max.poll.interval.ms`, `session.timeout.ms`, and JVM GC tuning to avoid false heart-beat failures.",
        hints: "Focus on why eager rebalancing temporarily halts consumption across all consumers in the group.",
        keyConcepts: ["kafka", "partition", "consumer group", "rebalance", "cooperative", "sticky", "heartbeat", "gc pause", "offsets"],
        sampleModelAnswer: "1. Eager vs. Cooperative: In classic Eager Rebalancing, all consumers in the group must stop processing and revoke all assigned partitions before the group coordinator reassigns partitions, causing cluster-wide stop-the-world pauses. Cooperative Sticky Rebalancing incrementally revokes only partitions that need to migrate to other workers, allowing unaffected consumers to continue reading in real time. 2. Flapping Prevention: Consumer group flapping often occurs when a long JVM garbage collection stop-the-world pause exceeds `session.timeout.ms` or when batch processing exceeds `max.poll.interval.ms`. To remediate, tune `max.poll.records` to a smaller batch, increase `max.poll.interval.ms`, run heartbeats on a dedicated background thread, and tune GC using G1GC or ZGC.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "Tell me about a high-severity production outage you personally caused or triaged. Walk through the moment you realized things were down, how you kept calm, your rollback decision tree, and the blameless postmortem actions you led.",
        cat: "Production Incident Response",
        skills: ["STAR Method", "Incident Command", "Blameless Postmortem", "Root Cause Analysis"],
        criteria: "Follows STAR: transparently describes outage trigger, prioritizes mitigating user impact over assigning blame, rolls back immediately, and authors a thorough postmortem with preventative corrective actions.",
        hints: "Top engineering companies look for ownership, blameless communication, and systematic prevention.",
        keyConcepts: ["star", "outage", "postmortem", "rollback", "incident", "mitigation", "monitoring", "root cause", "ownership"],
        sampleModelAnswer: "Situation: After deploying an automated database migration, an unindexed foreign key lock cascaded, exhausting our connection pool and taking down customer checkout for 18 minutes. Task: As lead backend engineer, restore traffic immediately and prevent data corruption. Action: I assumed incident command, notified customer success, and executed an immediate blue/green traffic switch to our standby read replica cluster while rolling back the migration. I avoided finger-pointing and scheduled a blameless postmortem. Result: We identified that the migration tool bypassed our staging database lock linter. We implemented automated zero-downtime migration linting in CI/CD using pg-anonymizer and strong_migrations, ensuring no unindexed foreign keys could ever reach production.",
      },
    ],
    HR: [
      {
        q: "How do you approach on-call rotations and technical debt? What concrete steps do you take to avoid developer burnout when pager alerts fire frequently?",
        cat: "Engineering Sustainability & Reliability",
        skills: ["On-call Hygiene", "SLOs and Error Budgets", "PagerDuty Alert Tuning", "Burnout Prevention"],
        criteria: "Proposes Error Budgets, turning recurring alerts into automated remediation tickets, ensuring alerts are actionable, and giving engineers compensatory time off after arduous shifts.",
        hints: "If an alert doesn't require immediate human action, it shouldn't wake an engineer up at 3:00 AM.",
        keyConcepts: ["on-call", "alert", "error budget", "burnout", "slo", "actionable", "pagerduty", "automation"],
        sampleModelAnswer: "My philosophy is that alerts must be actionable; if an alert does not require an immediate human decision, it should be an asynchronous email or dashboard metric, not a 3 AM pager wake-up. When on-call alert noise increases, our team implements an Error Budget policy: if recurring alerts fire more than 5 times a week, feature development pauses to allocate engineering bandwidth toward reliability engineering and automated self-healing. Furthermore, engineers completing on-call shifts are given recovery time and lead blameless retrospective handovers.",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Describe an API service you authored that handled significant scale or strict latency SLAs. What caching strategy did you employ, how did you handle cache invalidation and the 'thundering herd' problem, and how did you measure cache hit ratio?",
        cat: "Caching & System Scalability",
        skills: ["Redis Caching", "Cache Invalidation", "Thundering Herd / Cache Stampede", "Probabilistic Early Expiration"],
        criteria: "Covers cache-aside vs write-through, cache stampede prevention (mutex locks or XFetch probabilistic early expiration), and metrics tracking (hit/miss ratios).",
        hints: "Explain what happens the exact microsecond a high-traffic cache key expires.",
        keyConcepts: ["cache", "redis", "invalidation", "thundering herd", "stampede", "mutex", "ttl", "hit ratio"],
        sampleModelAnswer: "In our product catalog service handling 40,000 requests per minute, we implemented a Cache-Aside pattern using Redis clusters. When popular item keys expired, hundreds of concurrent requests simultaneously queried the primary PostgreSQL database, causing CPU spikes known as the 'thundering herd' problem. To fix this, we implemented the XFetch probabilistic early expiration algorithm: worker threads probabilistically refresh the cache entry in the background seconds before actual expiration based on compute delta. Additionally, we placed a distributed Redis lock on the query fallback so only one worker queries the database on a true miss while other callers wait 50ms for the cache to populate.",
      },
    ],
  },

  "AI / Machine Learning Engineer": {
    TECHNICAL: [
      {
        q: "You are building an enterprise Retrieval-Augmented Generation (RAG) system over 5 million unstructured enterprise PDF documents. Users report high hallucination rates and p95 query latency exceeding 6 seconds. Walk me through your chunking strategy, dense vs. sparse hybrid search, vector index tuning (HNSW vs. IVF-PQ), and re-ranking pipeline to achieve <800ms latency and high retrieval precision.",
        cat: "LLM Architecture & RAG Optimization",
        skills: ["RAG Systems", "HNSW Vector Indexing", "BM25 Hybrid Search", "Cross-Encoder Re-ranking", "Semantic Chunking"],
        criteria: "Details hierarchical/semantic chunking, hybrid BM25 + dense embeddings with Reciprocal Rank Fusion (RRF), cross-encoder re-ranking, and vector index quantization (IVF-PQ) to cut latency.",
        hints: "Explain why naive fixed-size chunking (e.g. 500 tokens) loses semantic context and why re-ranking improves precision.",
        keyConcepts: ["rag", "embedding", "hnsw", "ivf-pq", "hybrid search", "bm25", "re-ranking", "chunking", "hallucination", "latency"],
        sampleModelAnswer: "1. Chunking: Replace naive fixed character splits with semantic chunking that respects document headers, markdown tables, and paragraph boundaries, retaining small 256-token chunks with 50-token overlaps linked to parent document context. 2. Hybrid Retrieval: Combine dense vector embeddings with sparse BM25 keyword search using Reciprocal Rank Fusion (RRF) to capture both semantic similarity and exact entity identifiers (e.g., product part numbers). 3. Index Tuning: Use an HNSW index with M=16, efConstruction=200, and scalar quantization (SQ8) to keep vectors in RAM with sub-20ms search times. 4. Re-ranking: Pass the top 30 candidates to a lightweight cross-encoder (e.g., bge-reranker-large), trimming down to the top 5 most relevant passages before prompt injection. This reduces hallucination by 40% and keeps end-to-end latency under 750ms.",
      },
      {
        q: "Explain the mathematical differences between LoRA (Low-Rank Adaptation) and full parameter fine-tuning of an LLM. How do low-rank decomposition matrices (A and B) preserve expressive capacity while drastically reducing VRAM requirements during backpropagation?",
        cat: "Deep Learning & Parameter-Efficient Fine-Tuning",
        skills: ["LoRA", "PEFT", "Singular Value Decomposition", "Backpropagation", "VRAM Optimization"],
        criteria: "Covers weight update decomposition W = W0 + (B * A) * (alpha / r), freezing original weights, reducing Adam optimizer state memory from 16 bytes/param to small fraction, and merging adapters back at inference.",
        hints: "Think about the rank 'r' of the matrix: if d=4096 and r=16, how many parameters are updated compared to full d*d?",
        keyConcepts: ["lora", "peft", "low-rank", "matrix decomposition", "vram", "fine-tuning", "adam optimizer", "backpropagation"],
        sampleModelAnswer: "1. Mathematical Formulation: Full fine-tuning computes a weight update delta W of shape (d x k), updating all original parameters and requiring 16 bytes of VRAM per parameter for Adam optimizer states (momentum and variance). LoRA decomposes this delta into two low-rank matrices: delta W = B * A, where A is of shape (r x d) initialized with Gaussian noise and B is of shape (k x r) initialized to zero. 2. Parameter Reduction: With model dimension d=4096 and rank r=16, full fine-tuning requires 16.7M weights per layer, whereas LoRA requires only 2 * 4096 * 16 = 131,072 parameters (a 99.2% reduction). 3. Inference Zero Overhead: During inference, adapter weights can be permanently folded back into the base model weights (W_new = W_base + B * A), resulting in zero additional latency overhead.",
      },
      {
        q: "How do you detect, diagnose, and remediate Covariate Shift and Concept Drift in a production machine learning scoring pipeline? What automated metrics (e.g. Population Stability Index, Wasserstein Distance, Kolmogorov-Smirnov test) would you integrate into your MLOps telemetry?",
        cat: "MLOps & Model Monitoring",
        skills: ["Covariate Shift", "Concept Drift", "Population Stability Index (PSI)", "Wasserstein Distance", "Model Monitoring"],
        criteria: "Distinguishes between covariate shift (P(X) changes while P(Y|X) holds) and concept drift (P(Y|X) changes). Explains PSI thresholds (<0.1 stable, >0.2 significant shift) and automated retraining triggers.",
        hints: "Distinguish between changes in the input feature distribution versus changes in the underlying ground truth relationship.",
        keyConcepts: ["covariate shift", "concept drift", "psi", "wasserstein", "ks-test", "mlops", "retraining", "monitoring"],
        sampleModelAnswer: "1. Definitions: Covariate shift occurs when the input distribution P(X) changes while the mapping P(Y|X) remains constant. Concept drift occurs when the statistical relationship between input features and target labels P(Y|X) fundamentally alters (e.g. consumer purchasing patterns shifting during an economic crisis). 2. Telemetry Metrics: Compute the Population Stability Index (PSI) daily across categorical and binned numerical features against baseline training data. PSI < 0.1 indicates stability, 0.1 - 0.2 indicates moderate shift, and > 0.2 flags a critical alert. For continuous distributions, evaluate the two-sample Kolmogorov-Smirnov (KS) test or Wasserstein Distance. 3. Remediation: Automatically trigger shadow-model retraining pipelines on recent sliding-window data and run champion/challenger A/B testing before production promotion.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "Describe a project where your machine learning model performed exceptionally well during offline cross-validation (96% ROC-AUC), but failed significantly after deployment to real production users. How did you diagnose the discrepancy and what was the root cause?",
        cat: "Data Leakage & Real-World Failure",
        skills: ["STAR Method", "Data Leakage", "Offline vs Online Discrepancy", "Model Validation"],
        criteria: "Uses STAR: identifies target data leakage (e.g. future timestamp information, proxy identifiers, or train/test split contamination), reproduces the failure, and implements rigorous feature stores.",
        hints: "Think about temporal data leakage or features that only exist after the target event occurs.",
        keyConcepts: ["star", "data leakage", "offline", "online", "roc-auc", "validation", "temporal", "feature store"],
        sampleModelAnswer: "Situation: In our credit risk scoring model, offline testing achieved a 96% ROC-AUC, but post-launch default prediction accuracy plunged below random baseline. Task: Identify why offline validation failed so dramatically. Action: I investigated feature generation pipelines and discovered temporal target leakage: an engineer had included an `account_closure_date` feature that was populated retroactively only after loan defaults occurred. In production, this field was always null for active applicants. I removed the leaked feature, implemented point-in-time joins in Feast Feature Store, and established strict time-based split validation. Result: The corrected model achieved a realistic 83% AUC and accurately flagged high-risk loans without leakage.",
      },
    ],
    HR: [
      {
        q: "AI ethics, safety, and model hallucination are intense areas of scrutiny. How do you balance the pressure to rapidly deploy generative AI features with the responsibility to ensure safety, alignment, and privacy?",
        cat: "AI Safety & Ethics",
        skills: ["AI Alignment", "PII Redaction", "Guardrails", "Responsible AI"],
        criteria: "Discusses red-teaming, PII masking (Presidio), NeMo/Llama Guardrails, hallucination evaluation benchmarks (RAGAS), and refusal boundaries for harmful prompts.",
        hints: "Frame safety as a product enabler and brand protector, not an obstacle to velocity.",
        keyConcepts: ["ethics", "safety", "guardrails", "pii", "red-teaming", "hallucination", "alignment"],
        sampleModelAnswer: "I view safety and alignment as fundamental prerequisites for enterprise trust, not afterthoughts. In practice, this means implementing defense-in-depth: 1. Input Sanitization: Automated PII redaction using tools like Microsoft Presidio before prompts ever reach an LLM. 2. Guardrails: NeMo Guardrails or Llama Guard to detect prompt injection and toxic output. 3. Grounded Verification: Measuring faithfulness and answer relevance using automated evaluation suites like RAGAS. 4. Red-teaming: Conducting structured adversarial stress testing before any model release.",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Walk through an end-to-end ML or AI system you engineered from scratch. How did you collect and clean your training data, what model architecture trade-offs did you make, and how did you serve inference (batch vs real-time API)?",
        cat: "ML System Design Defense",
        skills: ["End-to-End Pipeline", "Model Serving", "Triton / vLLM", "Latency Optimization"],
        criteria: "Details data collection/cleaning, architecture selection rationale, serving framework (vLLM, Triton, ONNX Runtime), and quantifiable business impact.",
        hints: "Highlight quantization, batching (continuous batching), and hardware utilization.",
        keyConcepts: ["end-to-end", "pipeline", "serving", "vllm", "triton", "onnx", "batching", "inference"],
        sampleModelAnswer: "I engineered an automated document summarization and entity extraction platform processing 200,000 corporate filings daily. For model selection, we evaluated proprietary APIs versus fine-tuning an open-source Mistral-7B model with QLoRA. We chose Mistral-7B because it eliminated data-leakage compliance risks and reduced inference costs by 80%. We quantized the model to 4-bit AWQ and served it using vLLM on Nvidia A10G GPUs with PagedAttention and continuous batching. This achieved an average inference latency of 45ms per token and supported 120 concurrent request streams per GPU.",
      },
    ],
  },

  "DevOps / Cloud Engineer": {
    TECHNICAL: [
      {
        q: "A Kubernetes microservice cluster running on AWS EKS experiences cascading `CrashLoopBackOff` and `OOMKilled` events across multiple nodes following a morning traffic spike. Walk me through your triage: kubectl diagnostic commands, resource requests vs limits tuning, HPA metrics, and cgroup memory throttling.",
        cat: "Kubernetes & Cloud Infrastructure",
        skills: ["Kubernetes Diagnostics", "OOMKilled Triage", "Resource Requests & Limits", "HPA Scaling", "cgroups"],
        criteria: "Uses `kubectl describe pod`, `kubectl logs --previous`, explains Linux kernel OOM Killer invoking exit code 137, sets accurate memory requests=limits to prevent overcommit, and configures Horizontal Pod Autoscaler based on custom metrics.",
        hints: "Recall exit code 137 and the critical difference between CPU throttling vs Memory termination.",
        keyConcepts: ["kubernetes", "crashloopbackoff", "oomkilled", "kubectl", "limits", "requests", "hpa", "cgroup", "exit code 137", "eks"],
        sampleModelAnswer: "1. Immediate Triage: Run `kubectl get pods -A | grep -E 'CrashLoop|OOM'` to identify failing pods. Inspect pod metadata using `kubectl describe pod <pod-name>` to confirm termination Reason: OOMKilled (Exit Code 137). Check previous logs via `kubectl logs <pod-name> --previous`. 2. Root Cause Analysis: CPU overutilization causes CPU throttling, but memory exceeding its limit triggers immediate kernel termination. If memory requests were set significantly lower than limits, the Kubernetes scheduler overcommitted nodes, leading to node memory exhaustion. 3. Remediation: Set memory requests equal to memory limits to enforce Guaranteed QoS class. Tune Horizontal Pod Autoscaler (HPA) to scale at 70% CPU/Memory utilization and add Prometheus custom metrics (e.g. HTTP request queue depth). Configure PodDisruptionBudgets (PDB) to prevent cluster cascading failures during node drains.",
      },
      {
        q: "Design a zero-downtime multi-region disaster recovery (DR) architecture for a mission-critical web application. Compare Active-Active with Active-Passive (Warm Standby), detailing DNS routing (Route53 / Cloudflare), asynchronous cross-region database replication, and how you resolve data split-brain scenarios.",
        cat: "High Availability & Disaster Recovery",
        skills: ["Disaster Recovery (RTO/RPO)", "Active-Active vs Active-Passive", "Aurora Global Database", "Split-Brain Resolution", "DNS Failover"],
        criteria: "Defines RTO (Recovery Time Objective) and RPO (Recovery Point Objective). Explains Aurora Global Database or Spanner replication, Route53 latency-based routing with health checks, and quorum-based split-brain prevention.",
        hints: "Differentiate between Recovery Time Objective (how fast you recover) and Recovery Point Objective (how much data you can afford to lose).",
        keyConcepts: ["disaster recovery", "rto", "rpo", "active-active", "active-passive", "replication", "split-brain", "route53", "aurora global"],
        sampleModelAnswer: "1. Strategy & SLAs: For an RPO < 1 second and RTO < 60 seconds, architect an Active-Passive (Warm Standby) model using AWS Aurora Global Database across us-east-1 (Primary) and us-west-2 (Secondary) with storage-level replication latency under 1 second. 2. Traffic Management: Route 53 Application Recovery Controller (ARC) with health-checked DNS routing. 3. Failover Execution: If the primary region fails health checks, promote the secondary Aurora replica to standalone writer cluster via automated Lambda orchestrator. 4. Split-Brain Mitigation: Utilize fencing tokens and ensure the old primary is isolated from write operations before the standby is promoted, preventing divergent state.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "Tell me about a time when a bad Terraform or infrastructure-as-code change accidentally destroyed or broke an active environment. How did you handle the emergency, restore services, and make your CI/CD pipeline immune to similar mistakes?",
        cat: "Infrastructure Incident & Automation Guardrails",
        skills: ["STAR Method", "Terraform Drift", "CI/CD Guardrails", "Blameless Accountability"],
        criteria: "Uses STAR: describes blast radius, executes state rollback, implements `terraform plan` PR comments, OPA (Open Policy Agent) Conftest checks, and state locking.",
        hints: "Focus on automated guardrails like policy-as-code and preventing direct `terraform apply` from local laptops.",
        keyConcepts: ["star", "terraform", "iac", "rollback", "opa", "guardrails", "state lock", "conftest", "ci/cd"],
        sampleModelAnswer: "Situation: During a routine resource refactoring, an improperly scoped Terraform module attempted to recreate our production Redis cluster, causing cache downtime. Task: Restore caching and prevent unreviewed destructive operations from ever applying. Action: I immediately cancelled the apply, recreated the cluster from our latest automated snapshot, and restored production traffic within 12 minutes. To prevent recurrence, I removed all developer IAM permissions to run `terraform apply` locally. I migrated our workflow to Atlantis in GitHub Actions with mandatory peer review, automated `terraform plan` diff visibility, and integrated Open Policy Agent (OPA) rules that strictly block any plan containing destructive `destroy` actions without VP approval. Result: Zero infrastructure accidental deletions across the subsequent 2 years.",
      },
    ],
    HR: [
      {
        q: "Developers often complain that DevOps and security teams are 'blockers' who slow down release cadence. How do you champion a culture of Developer Self-Service and collaborative DevSecOps?",
        cat: "DevOps Culture & Empathy",
        skills: ["DevSecOps", "Developer Velocity", "Internal Developer Platforms", "Self-Service"],
        criteria: "Advocates for paved roads / golden paths, automated security feedback directly in PR comments, and enabling feature teams rather than policing them.",
        hints: "Frame DevOps as building 'golden paths' that make the right way the easiest way.",
        keyConcepts: ["self-service", "golden path", "devsecops", "culture", "frictionless", "shift-left", "collaboration"],
        sampleModelAnswer: "I believe the role of a modern platform engineer is not to be a gatekeeper, but to build 'Golden Paths' that make the secure, reliable way the easiest and fastest path for developers. Instead of requiring manual ticketing approvals for infrastructure, we create reusable, vetted Terraform and Helm modules that developers can deploy via self-service PRs. Security scanning (SonarQube, Trivy, Snyk) runs directly inside their pull request checks with inline code suggestions. This shifts security left, empowers developers, and accelerates release velocity while preserving governance.",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Walk through a CI/CD pipeline you designed from the ground up. What steps did you take to optimize build and test times from, say, 45 minutes down to under 8 minutes, while maintaining comprehensive automated testing?",
        cat: "CI/CD Pipeline Optimization",
        skills: ["GitHub Actions / GitLab CI", "Docker Multi-Stage Caching", "Test Parallelization", "BuildKit", "Artifact Storage"],
        criteria: "Covers multi-stage Docker builds, BuildKit remote cache mounts, matrix test sharding/parallelization, and dependency caching (pnpm/npm/go).",
        hints: "Explain how you eliminated redundant work between pipeline jobs.",
        keyConcepts: ["ci/cd", "pipeline", "docker", "cache", "buildkit", "parallel", "matrix", "optimization"],
        sampleModelAnswer: "In our monorepo, our GitHub Actions build pipeline initially took 38 minutes, stalling developer feedback loops. I optimized it down to 6.5 minutes through four interventions: 1. Docker Multi-Stage & BuildKit: We enabled BuildKit with GitHub Actions cache backend (`type=gha`), preventing rebuilds of unchanged layers. 2. Dependency Caching: Cached pnpm virtual store keyed by lockfile hash. 3. Test Sharding: Used Vitest/Jest matrix sharding to distribute 2,500 integration tests across 8 parallel runners. 4. Affected Analysis: Integrated Turborepo to run builds and linters exclusively on packages affected by the current git commit diff.",
      },
    ],
  },

  "Data Engineer": {
    TECHNICAL: [
      {
        q: "In an Apache Spark ETL pipeline processing 10 Terabytes of daily clickstream data, a key aggregation job fails due to severe Data Skew (90% of traffic belongs to a single viral merchant ID), causing individual executor tasks to crash with OutOfMemoryError. Detail your step-by-step remediation strategy using Spark Salting, Broadcast Joins, and Adaptive Query Execution (AQE).",
        cat: "Big Data & Distributed Computing",
        skills: ["Apache Spark", "Data Skew Remediation", "Salting Technique", "Adaptive Query Execution", "Broadcast Joins"],
        criteria: "Explains identifying skewed keys using Spark UI Event Timelines, applying salting (appending random integer 0-N to skewed key) to distribute records across partitions, and enabling `spark.sql.adaptive.skewJoin.enabled`.",
        hints: "Think about breaking a single massive key into N smaller sub-keys, performing partial aggregations, and aggregating again.",
        keyConcepts: ["spark", "skew", "salting", "aqe", "broadcast join", "executor", "oom", "partition", "shuffle"],
        sampleModelAnswer: "1. Diagnosis: Inspect the Spark UI Task Metrics timeline. If 199 tasks finish in 20 seconds while one final task runs for 45 minutes before failing with OOM, this confirms severe data skew on a join or groupBy key. 2. Spark Salting: For the skewed key, append a random salt integer `(key + '_' + floor(rand() * 10))` in the skewed dataset, and explode the lookup table by the same factor. This distributes the viral merchant across 10 distinct shuffle partitions, allowing executors to process partitions in parallel. 3. Adaptive Query Execution: Enable `spark.sql.adaptive.enabled = true` and `spark.sql.adaptive.skewJoin.enabled = true`, allowing Spark 3.x to automatically split skewed partitions at runtime. 4. Broadcast Joins: If joining against a smaller dimension table (<100MB), force a `broadcast(dimension_table)` join to eliminate the expensive shuffle entirely.",
      },
      {
        q: "Compare the Lakehouse Medallion Architecture (Bronze -> Silver -> Gold) with classic Kimball dimensional modeling (Star Schema). How do Delta Lake / Apache Iceberg ACID transactions, time travel, and schema enforcement change warehouse data governance?",
        cat: "Lakehouse Architecture & Data Modeling",
        skills: ["Medallion Architecture", "Delta Lake / Iceberg", "ACID Transactions", "Time Travel", "Slowly Changing Dimensions (SCD)"],
        criteria: "Explains raw append-only Bronze, cleaned/deduplicated Silver, business-aggregated Gold, parquet metadata catalogs, and implementing Slowly Changing Dimensions (SCD Type 2) with Delta MERGE.",
        hints: "Explain how parquet files plus a transaction log (Delta Log / Iceberg metadata JSON) provide ACID guarantees.",
        keyConcepts: ["lakehouse", "medallion", "bronze", "silver", "gold", "delta lake", "iceberg", "acid", "time travel", "star schema"],
        sampleModelAnswer: "1. Medallion Architecture: Bronze stores raw, unparsed append-only events directly from sources (JSON/Kafka). Silver validates schema, deduplicates records, and cleans nulls. Gold creates aggregated business datamarts (star schemas with fact and dimension tables) optimized for BI queries. 2. ACID Storage: Formats like Apache Iceberg and Delta Lake introduce an immutable JSON transaction log atop columnar Parquet files. This allows atomic writes, preventing partial dirty reads during pipeline execution. 3. Time Travel & Governance: Iceberg snapshot manifests enable time travel (`VERSION AS OF`) for data auditability and instant rollback of corrupt pipeline runs, while schema enforcement strictly rejects unexpected upstream schema drift.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "A high-priority business KPI report sent directly to executive leadership was found to have incorrect revenue numbers due to an upstream pipeline silent failure. How did you triage the data defect, communicate the incident, and implement automated data quality gates?",
        cat: "Data Quality & Accountability",
        skills: ["STAR Method", "Data Quality Governance", "Executive Communication", "Great Expectations / Soda"],
        criteria: "Uses STAR: handles stakeholder transparency immediately, traces lineage to corrupted source, corrects backfill, and implements automated data contracts and Soda/Great Expectations tests.",
        hints: "Focus on establishing automated data quality gates so broken data never reaches the Gold reporting layer.",
        keyConcepts: ["star", "data quality", "executive", "backfill", "great expectations", "data contract", "lineage", "transparency"],
        sampleModelAnswer: "Situation: Our executive dashboard displayed a 25% revenue dip due to an upstream third-party payment provider silently changing their timestamp timezone format from UTC to EST, dropping transactions. Task: Communicate the discrepancy transparently, backfill correct numbers, and build permanent preventative validation. Action: I notified our VP of Finance with a clear timeline and corrected the metrics via an idempotent backfill script within 3 hours. Next, I integrated Great Expectations and Monte Carlo into our Silver pipeline to enforce automated data contracts: null checks, anomaly volume checks, and schema validation. If data quality tests fail, the pipeline halts immediately and alerts the on-call engineer before Gold tables are refreshed. Result: Zero silent data corruptions reached executive reports thereafter.",
      },
    ],
    HR: [
      {
        q: "How do you balance requests from non-technical business teams who demand quick ad-hoc SQL extracts with your primary objective of engineering long-term scalable data infrastructure?",
        cat: "Data Team Prioritization",
        skills: ["Stakeholder Management", "Self-Service BI", "Ad-hoc vs Strategic Work", "Semantic Layer"],
        criteria: "Advocates for building self-service semantic models (dbt, Looker) so business users can slice data independently, rather than treating data engineers as SQL report generators.",
        hints: "Explain how self-service BI frees up engineering time for core pipeline architecture.",
        keyConcepts: ["self-service", "semantic layer", "dbt", "prioritization", "ad-hoc", "stakeholder", "governance"],
        sampleModelAnswer: "If a data team only responds to ad-hoc query requests, they become an unsustainable human query bottleneck. My approach is to invest in a unified semantic layer using dbt and self-service BI tools like Metabase or Looker. When ad-hoc requests arrive, I fulfill the immediate need while abstracting the underlying metrics into a reusable dimension or mart. I also host monthly office hours to train analysts and business partners on self-service exploratory querying, freeing up 70% of engineering bandwidth for robust ETL pipeline architecture.",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Walk through the most complex data pipeline you've built. Detail the source data ingestion, transformations, storage tier, partition strategy, and how you managed backfills without duplicating records.",
        cat: "Pipeline Architecture Defense",
        skills: ["Pipeline Architecture", "Partitioning & Compaction", "Idempotent Backfills", "dbt / Airflow"],
        criteria: "Explains ingestion (Kafka/Debezium CDC), Airflow orchestration, dbt transformations, date/tenant partitioning, and idempotent `MERGE INTO` backfill logic.",
        hints: "Explain why using `INSERT OVERWRITE` or `MERGE` is essential for safe backfills.",
        keyConcepts: ["pipeline", "ingestion", "cdc", "airflow", "dbt", "partitioning", "backfill", "idempotent", "merge"],
        sampleModelAnswer: "I engineered a Change Data Capture (CDC) pipeline streaming 50 million database mutations daily from MySQL into our Snowflake warehouse. We used Debezium and Kafka Connect to capture row-level changes into Kafka topics. An Airflow DAG scheduled micro-batching into Snowflake Bronze tables every 15 minutes. Transformations were orchestrated in dbt, using incremental models with `unique_key` and `merge` strategies. We partitioned tables by `event_date` and clustered by `customer_id`. For backfills, our dbt models supported `insert_overwrite` partitions, allowing us to safely re-run historical dates without duplicating ledger records.",
      },
    ],
  },

  "Mobile Developer (iOS/Android)": {
    TECHNICAL: [
      {
        q: "Your mobile application suffers from poor cold start launch times (exceeding 4.5 seconds on mid-range devices). Walk me through how you profile app initialization, defer third-party SDK initialization, optimize dependency injection graphs, and utilize baseline profiles (Android) or pre-main dyld optimization (iOS).",
        cat: "Mobile Performance & Startup Optimization",
        skills: ["Cold Start Optimization", "Android Baseline Profiles", "iOS dyld / Pre-main", "Lazy Initialization", "Memory Profiling"],
        criteria: "Covers measuring Time To Initial Display (TTID) vs Time To Full Display (TTFD), lazy initialization using App Startup library or Swift Task, compiling Android Baseline Profiles with ART, and minimizing dynamic frameworks on iOS.",
        hints: "Distinguish between cold start, warm start, and hot start.",
        keyConcepts: ["cold start", "ttid", "ttfd", "baseline profile", "dyld", "profiling", "dependency injection", "lazy", "startup"],
        sampleModelAnswer: "1. Metrics & Profiling: Measure Time to Initial Display (TTID) and Time to Full Display (TTFD) using Android Studio Profiler or Xcode Instruments (App Launch template). 2. Defer Non-Critical SDKs: Move heavy third-party SDKs (analytics, crashlytics, marketing trackers) out of `Application.onCreate()` or `didFinishLaunchingWithOptions` and initialize them asynchronously on background coroutines or using the Android App Startup library. 3. Baseline Profiles (Android): Generate ART Baseline Profiles to pre-compile critical execution paths into native AOT code during installation, eliminating runtime JIT compilation overhead on first launch. 4. iOS Optimizations: Reduce dynamic framework count to minimize dyld3 pre-main linking time, and convert large singletons to lazy Swift initializers.",
      },
      {
        q: "Design an offline-first mobile sync architecture for a field inspection app where workers enter complex form data, photos, and signatures in remote locations with zero network connectivity for hours at a time. How do you manage local SQLite persistence, background upload synchronization, and conflict resolution?",
        cat: "Offline-First Mobile Architecture",
        skills: ["Offline-First Architecture", "Room / CoreData / SQLite", "WorkManager / BGTaskScheduler", "Conflict Resolution", "Image Compression"],
        criteria: "Covers local database as single source of truth, queuing sync mutations with exponential backoff via WorkManager/BGTaskScheduler, client-side thumbnail downsampling, and conflict resolution (LWW vs CRDTs).",
        hints: "The UI must always read from local DB; network calls only sync the local DB with the remote server.",
        keyConcepts: ["offline-first", "room", "sqlite", "coredata", "workmanager", "sync", "conflict", "queue", "background"],
        sampleModelAnswer: "1. Single Source of Truth: The UI never talks to the network directly; it observes reactive local SQLite streams (Room Flow on Android or CoreData/SwiftData on iOS). 2. Mutation Queue: When a user creates an inspection, it is written to the local DB with status `PENDING_SYNC`. A persistent `WorkManager` (Android) or `BGTaskScheduler` (iOS) task is enqueued with network constraints. 3. Media Handling: Photos are immediately compressed to WebP locally to preserve storage and reduce upload bandwidth. 4. Conflict Resolution: Use Last-Write-Wins (LWW) with server-assigned monotonic version counters for metadata, and field-level merges to avoid overwriting unrelated user changes.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "Tell me about a time when a critical mobile app update introduced a crash-on-launch bug affecting thousands of users, but Apple App Store or Google Play Store review delays prevented an immediate rollback. How did you handle the situation?",
        cat: "Mobile Emergency & Release Management",
        skills: ["STAR Method", "Emergency App Hotfix", "Feature Flags", "Firebase Remote Config"],
        criteria: "Uses STAR: disables buggy feature via Firebase Remote Config/feature flag without requiring app update, contacts Apple for expedited review, and implements staged rollouts for all future releases.",
        hints: "Highlight why client-side feature flags are essential for mobile release safety.",
        keyConcepts: ["star", "crash", "hotfix", "remote config", "feature flag", "staged rollout", "app store", "expedited review"],
        sampleModelAnswer: "Situation: Following a minor version release, our iOS app experienced a 12% crash-on-launch rate on iOS 16 due to a nil-coalescing regression in our push notification parser. Task: Stop user crashes immediately when Apple review takes up to 24 hours. Action: Because we instrumented our app with Firebase Remote Config, I flipped the `enable_new_push_parser` feature flag to `false`. Within 8 minutes, active client devices fetched the cached remote config and gracefully bypassed the crashing code path without needing an app store update. Simultaneously, I submitted an emergency patch with an Apple Expedited Review request. Result: Crash rate dropped below 0.1% within an hour, and we instituted mandatory 7-day phased rollouts on Google Play and Apple TestFlight internal testing for all future releases.",
      },
    ],
    HR: [
      {
        q: "Mobile engineering involves diverse device fragmentations (thousands of screen sizes, OS versions, custom OEM skins). How do you prioritize testing and support across older devices versus adopting modern OS features?",
        cat: "Device Fragmentation & Strategy",
        skills: ["Fragmentation Strategy", "Minimum SDK Target", "Device Analytics", "Empathy"],
        criteria: "Analyzes telemetry on active device share, defines a clear minSDK deprecation policy (supporting 95%+ of active users), and tests on physical low-end hardware.",
        hints: "Base decisions on actual analytics data from your user base, not developer preferences.",
        keyConcepts: ["fragmentation", "minsdk", "analytics", "testing", "device matrix", "deprecation", "budget phones"],
        sampleModelAnswer: "I rely on real user telemetry from Firebase and Google Play Console rather than industry generalizations. We establish a policy supporting OS versions that represent at least 96% of our active monthly user base. For UI responsiveness, we maintain a dedicated device testing rack featuring low-memory Android devices (e.g. 2GB RAM budget devices) and older iPhones. When adopting bleeding-edge OS APIs, we implement graceful runtime version checks (`if #available` in Swift or `Build.VERSION.SDK_INT` in Android) so legacy users enjoy stability while modern device owners benefit from new capabilities.",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Walk through the architectural design of a mobile application you authored. Detail your presentation layer pattern (MVVM, MVI, or Clean Architecture) and how you handled configuration changes (e.g. screen rotation, system dark mode toggle) without leaking memory or duplicating API requests.",
        cat: "Mobile Architecture Defense",
        skills: ["MVI / MVVM", "Clean Architecture", "Configuration Changes", "Memory Leaks", "Coroutines / Combine"],
        criteria: "Explains ViewModels surviving configuration changes, unidirectional data flow (UDF) in MVI, and cleaning up lifecycle observers to prevent memory leaks.",
        hints: "Explain why MVI with immutable state prevents race conditions during rapid user taps.",
        keyConcepts: ["mvvm", "mvi", "clean architecture", "configuration change", "viewmodel", "memory leak", "unidirectional data flow"],
        sampleModelAnswer: "In our fintech mobile app, we adopted an MVI (Model-View-Intent) pattern with Clean Architecture. The UI layer emits user Intents (e.g. `FilterTransactions`), which an immutable ViewModel processes into a single reactive `UiState` stream. By utilizing Android Jetpack `ViewModel` or Swift `ObservableObject` held by navigation coordinators, state survives screen rotations and process death without re-executing API requests. To prevent memory leaks, all asynchronous coroutines and Combine subscriptions are bound to `viewModelScope` and automatically cancelled when the screen is permanently popped from the navigation backstack.",
      },
    ],
  },

  "Product Manager": {
    TECHNICAL: [
      {
        q: "Your flagship SaaS platform is experiencing a 35% user drop-off between account signup and first value delivery (the 'Aha!' moment). Walk through your quantitative and qualitative diagnostic framework, how you define leading vs. lagging indicators, and the A/B testing experiment roadmap you would execute to recover conversion.",
        cat: "Product Analytics & Growth Experiments",
        skills: ["Funnel Analysis", "Aha! Moment Discovery", "A/B Testing & p-values", "Leading vs Lagging Indicators", "User Cohorts"],
        criteria: "Distinguishes leading indicators (time to setup first interview) from lagging indicators (30-day retention). Details Mixpanel/Amplitude funnel analysis, user session recordings, and formulating hypothesis-driven A/B tests with sample size power calculations.",
        hints: "Define what the exact 'Aha!' moment is for this product before proposing solutions.",
        keyConcepts: ["funnel", "aha moment", "drop-off", "leading indicator", "lagging indicator", "a/b testing", "sample size", "retention"],
        sampleModelAnswer: "1. Diagnostic Framework: Use Amplitude or Mixpanel to analyze the onboarding funnel step-by-step. Pinpoint the exact drop-off step (e.g., uploading a resume vs selecting target role). Segment by acquisition source and device type. 2. Qualitative Insights: Watch 50 Hotjar session replays and conduct 10 user interviews with candidates who abandoned the funnel to identify friction points. 3. Leading vs Lagging: The lagging metric is 30-day retention and subscription conversion. The leading indicator is 'Time to First Question Answered' (TTFQA). 4. Experimentation Roadmap: Formulate an A/B test hypothesis: 'Allowing users to preview a 1-click sample interview before creating an account will increase funnel completion by 20%'. Calculate required sample size with 95% statistical significance and 80% statistical power before rollout.",
      },
      {
        q: "How do you evaluate and prioritize technical debt versus customer-facing revenue features when engineering leads demand a full architectural rewrite of a critical service? Detail your prioritization framework (e.g. RICE, Cost of Delay, WSJF).",
        cat: "Technical Debt & Roadmap Prioritization",
        skills: ["RICE Scoring", "Cost of Delay", "Technical Debt Negotiation", "WSJF"],
        criteria: "Explains quantifying technical debt in terms of business impact (developer velocity, incident downtime cost, security vulnerability risk), rejecting big-bang rewrites in favor of the Strangler Fig pattern, and allocating a fixed capacity (e.g. 20%) to tech debt.",
        hints: "Translate technical debt into revenue risk, churn risk, and engineering velocity slowdown.",
        keyConcepts: ["rice", "technical debt", "prioritization", "rewrite", "strangler fig", "velocity", "cost of delay", "trade-off"],
        sampleModelAnswer: "1. Quantifying Tech Debt: I never accept 'we need to rewrite because the code is messy'. I partner with the tech lead to quantify the debt: How many hours per sprint are lost to build issues? What is our customer churn due to P1 latency? What is the Cost of Delay? 2. Strangler Fig over Big-Bang: I strictly avoid multi-month 'big-bang' rewrites because they freeze product velocity and rarely deliver on time. Instead, we break the rewrite into modular micro-releases using the Strangler Fig pattern. 3. Capacity Allocation: We institute an agreed-upon 70/20/10 roadmap split: 70% customer-facing growth features, 20% platform reliability and architectural debt, and 10% exploratory innovation.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "Tell me about a time when you launched a product or major feature that completely failed to meet business expectations or customer adoption targets. How did you handle stakeholder feedback, identify the root cause, and pivot or sunset the feature?",
        cat: "Product Failure & Humility",
        skills: ["STAR Method", "Product Retrospective", "Sunsetting Features", "Intellectual Honesty"],
        criteria: "Uses STAR: shows intellectual honesty in acknowledging failure, analyzes customer feedback to understand why adoption lagged, and decisively pivots or sunsets the feature rather than succumbing to sunk cost fallacy.",
        hints: "Avoid defensiveness; great PMs celebrate rapid learning from failed experiments.",
        keyConcepts: ["star", "failure", "adoption", "pivot", "sunset", "sunk cost", "customer feedback", "humility"],
        sampleModelAnswer: "Situation: We invested a full quarter building an AI-powered automated video analysis tool for candidates to critique their facial expressions during mock interviews. Post-launch, only 4% of users completed a video interview, far below our 25% target. Task: Determine whether to iterate or sunset, and communicate findings to leadership. Action: I conducted user interviews and learned that candidates felt self-conscious, intimidated, and concerned about facial privacy; they wanted text-based feedback on their actual answers, not facial critiques. Instead of falling into the sunk cost fallacy, I presented the data to executive stakeholders and recommended sunsetting the video feature immediately. We pivoted engineering resources toward text-based rubric evaluation. Result: The text rubric feature achieved a 68% completion rate and became our highest-rated feature.",
      },
    ],
    HR: [
      {
        q: "As a Product Manager, you have all of the responsibility but none of the direct authority over engineers, designers, and marketers. How do you lead by influence, build trust, and align a cross-functional team?",
        cat: "Influence Without Authority",
        skills: ["Influence Without Authority", "Empathy", "Shared Vision", "Servant Leadership"],
        criteria: "Focuses on transparent context sharing ('the why'), bringing engineers into discovery calls, acknowledging peer expertise, and removing daily blockers.",
        hints: "Engineers respect PMs who bring clear customer data, define problems clearly, and let engineers own the solution.",
        keyConcepts: ["influence", "authority", "trust", "context", "customer data", "empathy", "alignment"],
        sampleModelAnswer: "Leading by influence requires three pillars: 1. Deep Context Over Dictation: Engineers don't want task orders; they want to understand the customer problem and business goal. I share user interview clips, metric dashboards, and the strategic 'why'. 2. Respect Technical Ownership: I define the 'what' and 'why', and empower the engineering team to own the 'how'. 3. Active Block-Clearing: I build trust by taking on the administrative, cross-functional friction so engineers can focus on deep work. When a team sees that their PM shields them from politics and grounds decisions in objective data, alignment follows naturally.",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Walk me through an end-to-end product feature you spearheaded from initial discovery to general availability. What customer problem did it solve, what friction did you overcome during execution, and what was the measurable business outcome?",
        cat: "Product Case Study Defense",
        skills: ["Product Discovery", "PRD Authoring", "Go-To-Market (GTM)", "Outcome Metrics"],
        criteria: "Details user discovery interviews, PRD scope definition, overcoming engineering or design bottlenecks, GTM launch, and quantitative business metric success.",
        hints: "Quantify the outcome: revenue increase, retention lift, or cost reduction.",
        keyConcepts: ["discovery", "prd", "launch", "gtm", "metrics", "retention", "conversion", "outcome"],
        sampleModelAnswer: "At my previous EdTech startup, we observed that 60% of placement candidates dropped out of practice sessions after answering just one question because they felt overwhelmed by lengthy 45-minute tests. I spearheaded 'Micro-Drills': 5-minute targeted question sessions focusing on a single weakness. During execution, engineering pushed back on the complexity of dynamic session generation, so we compromised on an initial MVP utilizing pre-compiled question tags. We launched with in-app onboarding banners and email nudges. Within 60 days, daily active users increased by 38%, session completion jumped from 40% to 78%, and free-to-paid subscription conversions rose by 22%.",
      },
    ],
  },

  "QA / Test Automation Engineer": {
    TECHNICAL: [
      {
        q: "In an end-to-end test automation suite with 800 Playwright / Cypress tests running in CI/CD, 7% of tests fail intermittently due to flakiness (network latency, race conditions, hydration mismatches), causing developer distrust. How do you systematically isolate, quarantine, and eliminate test flakiness?",
        cat: "Test Automation & Flakiness Remediation",
        skills: ["Playwright / Cypress", "Flaky Test Elimination", "Auto-waiting vs Hardcoded Sleeps", "Test Quarantining", "Parallelization"],
        criteria: "Identifies root causes of flakiness (hardcoded sleeps, shared state, animation delays), implements auto-retries with quarantine pipelines, replaces `sleep()` with explicit locators (`toBeVisible()`), and isolates state with dedicated database seeding per test worker.",
        hints: "Never use arbitrary `page.waitForTimeout(3000)`. Explain locator auto-waiting.",
        keyConcepts: ["playwright", "cypress", "flakiness", "quarantine", "auto-waiting", "ci/cd", "race condition", "sleep", "isolation"],
        sampleModelAnswer: "1. Quarantine & Visibility: Immediately move flaky tests to a separate quarantined pipeline that runs asynchronously without blocking PR merges. Track flaky test frequency using Playwright trace viewer and Datadog CI visibility. 2. Eliminate Root Causes: Audit the codebase to remove all arbitrary `page.waitForTimeout()` sleeps. Replace them with Playwright web-first assertions (`expect(locator).toBeVisible()`) that automatically poll the DOM. 3. Test Isolation: Ensure tests never depend on shared mutable database state. Each parallel test worker creates and destroys its own ephemeral test user using API fixtures before launching the browser. 4. Network Mocking: Mock external third-party dependencies (e.g. payment gateways or SMS APIs) using `page.route()` to eliminate external network instability.",
      },
      {
        q: "Explain how you design a multi-tiered Test Pyramid for a microservices architecture. When do you choose Contract Testing (Pact) over End-to-End integration tests, and how do you execute non-functional load testing using tools like k6 or Gatling?",
        cat: "Test Strategy & Performance Testing",
        skills: ["Test Pyramid", "Contract Testing (Pact)", "Load Testing (k6)", "API Testing", "Non-functional Requirements"],
        criteria: "Defines Unit (70%), Service/Integration/Contract (20%), and E2E UI (10%). Explains consumer-driven contract testing preventing breaking API schema changes, and writing k6 load test scripts with thresholds (p95 < 200ms).",
        hints: "Explain why relying heavily on UI E2E tests is expensive, slow, and fragile compared to contract testing.",
        keyConcepts: ["test pyramid", "contract testing", "pact", "k6", "gatling", "load testing", "e2e", "integration", "thresholds"],
        sampleModelAnswer: "1. The Test Pyramid: Maintain 70% Unit Tests (fast, in-memory logic), 20% Service/Integration/Contract Tests, and 10% End-to-End UI Tests. 2. Contract Testing: In microservices, end-to-end tests are slow and prone to environment failures. We implement Consumer-Driven Contract Testing using Pact: the frontend or consumer defines expected JSON schemas and responses. These contracts are verified by the backend producer in CI, preventing breaking API changes without deploying full environments. 3. Load Testing: We script user scenarios in k6 (written in JavaScript), defining strict SLA thresholds: `http_req_duration: ['p(95)<300']`. We run stress tests simulating 10,000 virtual users (VUs) during nightly staging builds to catch memory leaks and DB connection pool exhaustion before production releases.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "Describe a high-stakes scenario where developers pushed an urgent release to staging, claiming it was 'fully tested', but your exploratory testing uncovered a show-stopping P0 defect an hour before production deployment. How did you handle the conversation?",
        cat: "Release Quality & Professional Poise",
        skills: ["STAR Method", "Exploratory Testing", "P0 Defect Triage", "Defect Communication"],
        criteria: "Uses STAR: stays calm, reproduces bug with clear network logs and video recording, holds the release diplomatically based on data, and collaborates with developers on an immediate fix.",
        hints: "Frame the delay as protecting customer experience and the engineering team's reputation.",
        keyConcepts: ["star", "p0 bug", "exploratory", "release gate", "triage", "evidence", "reproduction", "diplomacy"],
        sampleModelAnswer: "Situation: One hour before a major campus placement partner launch, development completed a fast-track hotfix and requested immediate production deployment. Task: Verify the release under realistic edge cases without being a needless blocker. Action: Performing exploratory testing, I tested input boundary limits and discovered that entering non-Latin Unicode characters in the resume name crashed the parsing worker, completely locking the student out. I recorded a 30-second screen capture with browser network payload logs and immediately alerted the release manager and lead engineer. I explained the business risk of 5,000 students being locked out during the drive. Result: The team agreed to hold deployment for 45 minutes while the lead applied an input sanitization fix. I verified the patch, and the release succeeded with zero production errors.",
      },
    ],
    HR: [
      {
        q: "Why did you specialize in Quality Engineering, and how do you advocate for quality as a shared team responsibility rather than a siloed QA gatekeeper role?",
        cat: "Quality Philosophy",
        skills: ["Whole-Team Quality", "Quality Coaching", "Shift-Left Testing", "Advocacy"],
        criteria: "Articulates that QA is not a police force catching bugs at the end of the conveyor belt, but a culture of building quality in from day one (Shift-Left) and coaching developers.",
        hints: "Quality is built in, not tested in.",
        keyConcepts: ["quality culture", "shift-left", "coaching", "ownership", "gatekeeper", "advocacy"],
        sampleModelAnswer: "I specialized in Quality Engineering because software reliability directly determines user trust and business viability. However, I reject the antiquated view of QA as a siloed gatekeeper that catches bugs at the very end of a sprint. My philosophy is 'Whole-Team Quality' and Shift-Left testing: quality begins during initial product requirement reviews, where QA challenges ambiguous user stories. I coach developers on writing effective integration and component tests, author test utilities, and provide automated CI/CD guardrails so the entire team shares ownership of software excellence.",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Walk through an automated testing framework you architected from scratch. What language and runner did you choose, how did you handle test reporting and screenshots on failure, and how was it integrated into the CI/CD pipeline?",
        cat: "Test Framework Defense",
        skills: ["Test Framework Architecture", "Playwright / TypeScript", "Allure Reporting", "CI/CD Integration", "Dockerized Runners"],
        criteria: "Details framework architecture (Page Object Model or Component Model), TypeScript/Playwright selection, automated Allure/HTML reports with trace artifacts on failure, and running in GitHub Actions with Docker containers.",
        hints: "Highlight Page Object Model (POM), parallel execution, and artifact capture.",
        keyConcepts: ["framework", "playwright", "typescript", "page object model", "allure", "ci/cd", "docker", "reporting"],
        sampleModelAnswer: "I architected an enterprise end-to-end test automation framework using TypeScript and Playwright. We structured tests using the Page Object Model (POM) with component-level abstractions for reusable widgets like modals and navigation bars. The framework executes against headless Chromium and Firefox browsers in parallel across 4 Dockerized GitHub Actions runners. On test failure, Playwright automatically attaches DOM snapshots, console logs, network HAR files, and video recordings to the Allure test report, posting an annotated summary directly into the developer's pull request. This reduced our regression testing cycle from 6 hours of manual testing to 7 minutes of automated validation.",
      },
    ],
  },

  "Cybersecurity Analyst": {
    TECHNICAL: [
      {
        q: "Your SIEM (Security Information and Event Management) platform triggers a high-severity alert indicating anomalous lateral movement and unusual outbound DNS tunneling from an internal API server. Walk me through your Incident Response containment playbook: initial triage, forensic memory capture, network isolation, and threat hunting.",
        cat: "Security Operations & Incident Response",
        skills: ["Incident Response Lifecycle (NIST)", "DNS Tunneling", "Memory Forensics (Volatility)", "Network Isolation", "Threat Hunting"],
        criteria: "Follows NIST/SANS Incident Response phases: Identification, Containment, Eradication, Recovery, Lessons Learned. Explains isolating the host at the firewall/VPC level without rebooting (to preserve volatile RAM), capturing memory dumps with LiME/Volatility, analyzing DNS query frequency/entropy, and hunting for persistence mechanisms.",
        hints: "Never reboot a compromised machine immediately, as you will destroy volatile RAM forensic evidence.",
        keyConcepts: ["siem", "incident response", "nist", "containment", "dns tunneling", "forensics", "volatility", "memory dump", "isolation"],
        sampleModelAnswer: "1. Identification & Triage: Validate the SIEM alert. Inspect the DNS query log: high-frequency lookups with high entropy subdomains (e.g., base64 encoded text in TXT/A records) confirm DNS exfiltration or C2 tunneling. 2. Containment: Do NOT power off or reboot the server, as rebooting purges volatile RAM evidence. Instead, execute network containment by updating the AWS Security Group or host firewall to sever all outbound internet traffic while preserving an isolated management session for the SOC team. 3. Forensics: Capture volatile system memory using LiME or FTK Imager. Run Volatility to inspect active network sockets, injected DLLs, and rogue parent-child processes (e.g. `cmd.exe` spawned by `w3wp.exe`). 4. Eradication & Recovery: Identify the initial access vector (e.g. unpatched vulnerability), revoke all credentials, rebuild the server from a known clean AMI, and deploy endpoint detection and response (EDR) telemetry.",
      },
      {
        q: "Deep dive into securing modern JWT (JSON Web Token) authentication in a distributed microservices environment. Explain how attackers exploit the 'None' algorithm attack, signature confusion (RS256 vs HS256), and replay attacks, and detail the defense architecture you would mandate.",
        cat: "Application Security & Cryptography",
        skills: ["JWT Security", "Algorithm Confusion Attack", "RS256 vs HS256", "Replay Attacks", "Token Revocation"],
        criteria: "Covers: 1) Explicit algorithm whitelisting to reject `alg: none`; 2) Avoiding asymmetric public key reuse as symmetric HMAC secret; 3) Short-lived access tokens (15m) + secure HTTP-only refresh tokens with rotation; 4) Redis token blocklist for immediate revocation.",
        hints: "Explain what happens when an attacker signs a token using the server's public key while setting the algorithm header to HS256.",
        keyConcepts: ["jwt", "security", "rs256", "hs256", "none algorithm", "replay attack", "revocation", "http-only", "refresh token"],
        sampleModelAnswer: "1. Algorithm Confusion Attack: In asymmetric RS256, the server signs tokens with a private key and verifies with a public key. If the verification library improperly trusts the header's `alg` field, an attacker can change `alg` to symmetric `HS256` and sign the token using the publicly available RSA public key. The vulnerable server verifies the signature using the public key as an HMAC secret, granting unauthorized access. 2. Defense: Hardcode the allowed verification algorithm (`algorithms: ['RS256']`) and reject untrusted algorithms. Explicitly forbid `alg: none`. 3. Replay & Revocation: Issue short-lived access tokens (5–15 minutes) and store refresh tokens in secure, HTTP-only, SameSite=Strict cookies. Implement Refresh Token Rotation (RTR): whenever a refresh token is used, invalidate it and issue a new pair. If a revoked refresh token is re-submitted, immediately invalidate all sessions for that user.",
      },
    ],
    BEHAVIORAL: [
      {
        q: "Describe a situation where you had to mandate an immediate security patch or configuration change that broke an existing user workflow or required engineers to rewrite code under a tight deadline. How did you navigate the executive pushback and drive compliance?",
        cat: "Security Leadership & Stakeholder Management",
        skills: ["STAR Method", "Risk Communication", "Executive Buy-in", "Security Compliance"],
        criteria: "Uses STAR: translates technical CVE/vulnerability into financial/regulatory liability (GDPR, PCI-DSS, brand loss), provides engineers with clear code snippets/guidance, and establishes a safe rollout timeline.",
        hints: "Speak the language of business risk and liability rather than technical jargon when presenting to leadership.",
        keyConcepts: ["star", "security patch", "vulnerability", "executive", "pushback", "risk", "pci-dss", "compliance", "collaboration"],
        sampleModelAnswer: "Situation: Our application security scanning identified an active Remote Code Execution (RCE) vulnerability in an unpatched third-party logging dependency (similar to Log4j). Engineering resisted pausing their sprint, arguing the patch required updating breaking major versions across 12 services. Task: Secure executive authorization to freeze sprint work and patch the vulnerability within 24 hours. Action: I met with the CTO and VP of Engineering. Instead of discussing library dependencies, I framed the risk in terms of breach likelihood, potential loss of customer PII, and multi-million dollar regulatory penalties. I provided a pre-tested Hotfix pull request and paired directly with the infrastructure team on rollout. Result: All 12 services were patched and verified within 18 hours with zero production downtime or customer impact.",
      },
    ],
    HR: [
      {
        q: "Security teams are often perceived as saying 'No' to every new initiative. How do you foster a collaborative culture where security is viewed as an enabler of business velocity and customer trust?",
        cat: "Security Culture & Business Enablement",
        skills: ["Security Enablement", "Culture of Security", "Champion Networks", "Pragmatism"],
        criteria: "Advocates for a 'Yes, and here is how we do it safely' mindset, launching Security Champions programs, and rewarding engineers who report vulnerabilities.",
        hints: "Position security as a competitive differentiator that wins enterprise deals.",
        keyConcepts: ["enablement", "culture", "champions", "collaboration", "trust", "competitive advantage", "pragmatism"],
        sampleModelAnswer: "My philosophy is that security should never be the 'Department of No'; it should be the 'Department of Yes, And Here Is How We Do It Safely'. When engineering or sales wants to integrate an innovative AI tool or third-party service, our job is to map out the threat model and provide safe architectural guardrails. We establish a Security Champions program, embedding interested engineers in each squad and providing security training. By treating developers as partners and celebrating engineers who proactively report vulnerabilities, security becomes a competitive advantage that wins enterprise deals.",
      },
    ],
    PROJECT_BASED: [
      {
        q: "Walk through a penetration test, threat model (STRIDE), or security posture overhaul you conducted on an existing web application. What high-risk vulnerabilities did you discover (e.g. SSRF, Broken Object Level Authorization, CORS misconfiguration), and how did you verify their remediation?",
        cat: "Threat Modeling & Application Security Defense",
        skills: ["STRIDE Threat Modeling", "SSRF / BOLA Mitigation", "Penetration Testing", "Security Verification"],
        criteria: "Walks through STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege), details specific vulnerability exploitation and fix (e.g. BOLA parameterized query, SSRF private IP blocklist).",
        hints: "Use concrete examples: Server-Side Request Forgery (SSRF) hitting cloud metadata `169.254.169.254` or BOLA IDOR.",
        keyConcepts: ["stride", "threat modeling", "ssrf", "bola", "idor", "penetration testing", "remediation", "verification"],
        sampleModelAnswer: "During a STRIDE threat model on our resume-parsing webhook service, I identified an Information Disclosure and Elevation of Privilege threat via Server-Side Request Forgery (SSRF). The service accepted a user-supplied URL to download CVs from cloud drives. An attacker could provide `http://169.254.169.254/latest/meta-data/` to extract IAM instance profile credentials. To remediate, I implemented a defense-in-depth policy: 1. Resolved domain names to IP addresses prior to request execution; 2. Enforced a strict firewall blocklist preventing outbound traffic to non-routable private IP ranges (RFC 1918 and link-local 169.254.0.0/16); 3. Disabled HTTP redirects in the HTTP client. I re-tested the endpoint with automated Burp Suite regression scans, confirming 100% remediation.",
      },
    ],
  },
};

// Fallback role generator for custom roles or unspecified categories
function getCustomRoleBank(targetRole: string, focusArea?: string): Record<string, QuestionTemplate[]> {
  const effectiveFocus = focusArea || "System Architecture & Problem Solving";
  return {
    TECHNICAL: [
      {
        q: `As a ${targetRole}, walk through how you would architect a mission-critical, scalable solution with strict reliability requirements, specifically focusing on ${effectiveFocus}. What trade-offs between performance, maintainability, and operational complexity would you make?`,
        cat: `${effectiveFocus} Architecture`,
        skills: ["System Design", "Scalability", "Architectural Trade-offs", "Reliability"],
        criteria: "Candidate should clearly decompose the architecture, identify potential bottlenecks, justify tool/pattern choices, and address fault tolerance.",
        hints: "Structure your answer: 1) Requirements & Constraints, 2) High-Level Design, 3) Component Deep-Dive, 4) Failure Scenarios.",
        keyConcepts: ["architecture", "scale", "trade-off", "bottleneck", "latency", "reliability", "failover", "monitoring"],
        sampleModelAnswer: `1. Requirements: Define functional requirements and non-functional constraints (latency, throughput, availability). 2. Architecture: Decompose into modular components with clean boundaries. 3. ${effectiveFocus}: Apply targeted design patterns (caching, asynchronous queuing, or connection pooling) to isolate heavy workloads. 4. Trade-offs: Contrast the chosen architecture against alternatives and defend the final design based on operational maintainability.`,
      },
      {
        q: `Describe a complex technical debugging or optimization challenge you would anticipate facing as a ${targetRole} when handling ${effectiveFocus}. What telemetry, diagnostic steps, and root cause analysis methodologies would you employ?`,
        cat: "Diagnostics & Engineering Ownership",
        skills: ["Root Cause Analysis", "Telemetry & Observability", "Performance Tuning"],
        criteria: "Candidate should explain observability tooling, isolating variables, reproducing the issue, and implementing permanent automated regression tests.",
        hints: "Discuss metrics, logs, traces (the three pillars of observability) and systematic isolation.",
        keyConcepts: ["debug", "telemetry", "metrics", "logs", "traces", "root cause", "isolation", "reproduce"],
        sampleModelAnswer: "1. Triage: Inspect telemetry (metrics, distributed traces, and error logs) to quantify failure rates and blast radius. 2. Isolation: Reproduce the defect in an isolated environment with synthetic load. 3. Remediation: Implement targeted refactoring or optimization. 4. Verification: Deploy with canary verification and add automated regression tests to prevent future regressions.",
      },
    ],
    BEHAVIORAL: [
      {
        q: `As a ${targetRole}, describe a project where you had to push back on unrealistic deadlines or ambiguous specifications from cross-functional stakeholders. How did you negotiate a high-quality outcome using the STAR framework?`,
        cat: "Stakeholder Negotiation & Alignment",
        skills: ["STAR Method", "Stakeholder Communication", "Prioritization", "Negotiation"],
        criteria: "Follows STAR framework: details Situation, Task, Action (phased trade-off compromise), and Result (on-time quality delivery).",
        hints: "Frame the conversation around protecting business quality, customer trust, and long-term maintainability.",
        keyConcepts: ["star", "situation", "task", "action", "result", "stakeholder", "deadline", "trade-off"],
        sampleModelAnswer: "Situation: Stakeholders requested premature delivery of a complex feature. Task: Balance business urgency with engineering quality. Action: I quantified technical risks, proposed a phased MVP delivery plan with core functionality first, and scheduled fast-follow releases. Result: The team delivered on schedule with high reliability and zero customer-impacting defects.",
      },
    ],
    HR: [
      {
        q: `What draws you to the role of ${targetRole}, and how do your technical background and career goals align with high-performing production engineering environments?`,
        cat: "Career Vision & Alignment",
        skills: ["Career Goals", "Self-Awareness", "Cultural Alignment"],
        criteria: "Demonstrates clear self-awareness, authentic passion for the domain, concrete technical milestones, and team-oriented collaboration.",
        hints: "Connect past hands-on projects to your future technical trajectory.",
        keyConcepts: ["career", "vision", "trajectory", "collaboration", "growth", "mentorship"],
        sampleModelAnswer: `I am deeply energized by the challenges inherent in ${targetRole}, particularly solving complex domain problems with high engineering rigor. Over the next 2-3 years, I aim to deepen my architectural expertise, take end-to-end feature ownership, and contribute actively to engineering mentorship.`,
      },
    ],
    PROJECT_BASED: [
      {
        q: `Select the most significant project you have built relevant to a ${targetRole}. What was the most critical architectural decision you made, what metrics did you monitor, and what would you re-architect if building it again today?`,
        cat: "Project Defense & Retrospective",
        skills: ["Project Architecture", "Metrics & KPIs", "Engineering Retrospective"],
        criteria: "Demonstrates deep ownership, architectural justification, concrete metrics, and mature retrospective self-critique.",
        hints: "Highlight measurable outcomes (latency, throughput, test coverage, user adoption).",
        keyConcepts: ["project", "architecture", "decision", "metrics", "retrospective", "trade-off"],
        sampleModelAnswer: "Walk through project purpose, justify why the core tech stack was chosen over alternatives, highlight quantifiable performance improvements, and reflect honestly on technical debt or design decisions you would improve in a v2.",
      },
    ],
  };
}

export class DeterministicDemoProvider implements AIProvider {
  name = "Deterministic High-Fidelity Simulation Provider";

  async generateQuestions(params: GenerateQuestionsInput): Promise<GeneratedQuestion[]> {
    const isTechnicalRound = params.interviewType === "TECHNICAL";
    const count = Math.min(Math.max(params.questionCount, 1), 10);
    const questions: GeneratedQuestion[] = [];

    if (isTechnicalRound) {
      // Find matching MCQ bank
      let mcqPool: McqQuestionTemplate[] = ROLE_MCQ_BANKS[params.targetRole];
      if (!mcqPool) {
        const matchingKey = Object.keys(ROLE_MCQ_BANKS).find((k) =>
          params.targetRole.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(params.targetRole.toLowerCase())
        );
        mcqPool = matchingKey ? ROLE_MCQ_BANKS[matchingKey] : GENERAL_TECHNICAL_MCQ_BANK;
      }

      // If focus area provided, prioritize questions that match
      let pool = [...mcqPool];
      if (params.focusArea) {
        const lowerFocus = params.focusArea.toLowerCase();
        pool.sort((a, b) => {
          const aMatch = a.cat.toLowerCase().includes(lowerFocus) || a.q.toLowerCase().includes(lowerFocus);
          const bMatch = b.cat.toLowerCase().includes(lowerFocus) || b.q.toLowerCase().includes(lowerFocus);
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
      }

      for (let i = 0; i < count; i++) {
        const template = pool[i % pool.length];
        let questionText = template.q;
        let category = template.cat;

        if (params.focusArea && i === 0) {
          if (!questionText.toLowerCase().includes(params.focusArea.toLowerCase()) && !category.toLowerCase().includes(params.focusArea.toLowerCase())) {
            questionText = `[Focus: ${params.focusArea}] ${questionText}`;
          }
        }

        const criteriaJson = JSON.stringify({
          isMcq: true,
          options: template.options,
          correctOptionIndex: template.correctOptionIndex,
          explanation: template.explanation,
          criteriaText: template.criteria,
        });

        questions.push({
          orderIndex: i + 1,
          questionText,
          category,
          difficulty: params.difficulty,
          relevantSkills: template.skills,
          expectedCriteria: criteriaJson,
          hints: template.hints,
          isMcq: true,
          options: template.options,
          correctOptionIndex: template.correctOptionIndex,
          explanation: template.explanation,
        });
      }

      return questions;
    }

    // 1. Locate appropriate question bank for non-technical rounds (Behavioral, HR, Project-based)
    let roleBank = ROLE_QUESTION_BANKS[params.targetRole];
    if (!roleBank) {
      const matchingKey = Object.keys(ROLE_QUESTION_BANKS).find((k) =>
        params.targetRole.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(params.targetRole.toLowerCase())
      );
      roleBank = matchingKey ? ROLE_QUESTION_BANKS[matchingKey] : getCustomRoleBank(params.targetRole, params.focusArea);
    }

    const typeQuestions = roleBank[params.interviewType] || roleBank["BEHAVIORAL"] || ROLE_QUESTION_BANKS["Full-Stack Developer"]["BEHAVIORAL"];

    for (let i = 0; i < count; i++) {
      const template = typeQuestions[i % typeQuestions.length];

      let questionText = template.q;
      if (params.focusArea && i === 0 && !questionText.toLowerCase().includes(params.focusArea.toLowerCase())) {
        questionText = `[Focus: ${params.focusArea}] ${questionText}`;
      }

      questions.push({
        orderIndex: i + 1,
        questionText,
        category: template.cat,
        difficulty: params.difficulty,
        relevantSkills: template.skills,
        expectedCriteria: template.criteria,
        hints: template.hints,
        isMcq: false,
      });
    }

    return questions;
  }

  async evaluateAnswer(params: EvaluateAnswerInput): Promise<EvaluationResult> {
    const answer = params.answerText.trim();
    const isSkipped = !answer || answer.startsWith("[Candidate skipped");

    // Check if this question is an MCQ question
    let mcqData: {
      isMcq?: boolean;
      options?: string[];
      correctOptionIndex?: number;
      explanation?: string;
    } | null = null;

    if (params.expectedCriteria && params.expectedCriteria.startsWith("{")) {
      try {
        const parsed = JSON.parse(params.expectedCriteria);
        if (parsed.isMcq) {
          mcqData = parsed;
        }
      } catch {}
    }

    // If candidate provided a selectedOptionIndex OR question is an MCQ and not a detailed text answer
    const isMcqEvaluation =
      params.selectedOptionIndex !== undefined ||
      (mcqData !== null && (isSkipped || answer.startsWith("Option ") || answer.startsWith("{")));

    if (isMcqEvaluation) {
      if (isSkipped && params.selectedOptionIndex === undefined) {
        return {
          relevanceScore: 0,
          technicalScore: 0,
          completenessScore: 0,
          communicationScore: 0,
          reasoningScore: 0,
          overallScore: 0,
          strengths: ["Candidate chose to skip this multiple-choice question."],
          weaknesses: ["Question was left unanswered. Zero technical or problem-solving points awarded."],
          missingConcepts: ["Core fundamental concept: " + (params.category || "Technical Concept")],
          improvementSuggestions: [
            "Even when uncertain, eliminate improbable distractors and select the most plausible engineering choice.",
          ],
          modelAnswerOutline: mcqData?.explanation || "Review the technical rationale behind the four options.",
          recommendedTopics: [params.category || "General Technical Practice"],
          isSimulated: true,
        };
      }

      let selectedIndex = params.selectedOptionIndex;
      if (selectedIndex === undefined) {
        if (answer.startsWith("Option ")) {
          selectedIndex = answer.charCodeAt(7) - 65;
        } else if (answer.startsWith("{")) {
          try {
            selectedIndex = JSON.parse(answer).selectedOptionIndex;
          } catch {}
        }
      }

      const correctIndex = mcqData?.correctOptionIndex ?? 0;
      const isCorrect = selectedIndex === correctIndex;
      const selectedLetter = selectedIndex !== undefined ? String.fromCharCode(65 + selectedIndex) : "Unknown";
      const correctLetter = String.fromCharCode(65 + correctIndex);
      const explanation = mcqData?.explanation || `Option ${correctLetter} is the optimal industry-standard solution.`;

      const relevanceScore = isCorrect ? 100 : 35;
      const technicalScore = isCorrect ? 100 : 25;
      const completenessScore = isCorrect ? 100 : 30;
      const communicationScore = isCorrect ? 100 : 40;
      const reasoningScore = isCorrect ? 100 : 25;
      const overallScore = isCorrect ? 100 : 28;

      return {
        relevanceScore,
        technicalScore,
        completenessScore,
        communicationScore,
        reasoningScore,
        overallScore,
        strengths: isCorrect
          ? [
              `Correctly identified the optimal engineering approach: Option ${correctLetter}.`,
              `Demonstrated accurate technical knowledge of ${params.category}.`,
            ]
          : [
              `Attempted the question and engaged with ${params.category} concepts.`,
            ],
        weaknesses: isCorrect
          ? []
          : [
              `Selected Option ${selectedLetter} instead of the optimal Option ${correctLetter}.`,
            ],
        missingConcepts: isCorrect
          ? []
          : [
              `Core concept: ${params.category}`,
              "Comparative trade-off analysis between alternatives",
            ],
        improvementSuggestions: isCorrect
          ? [
              "Continue reinforcing edge cases and practical implementations in high-scale systems.",
            ]
          : [
              `Review the technical explanation: ${explanation.slice(0, 160)}...`,
            ],
        modelAnswerOutline: `Correct Answer: Option ${correctLetter}\n\nExplanation:\n${explanation}`,
        recommendedTopics: [params.category || "Core System Engineering"],
        isSimulated: true,
      };
    }

    if (isSkipped) {
      return {
        relevanceScore: 0,
        technicalScore: 0,
        completenessScore: 0,
        communicationScore: 0,
        reasoningScore: 0,
        overallScore: 0,
        strengths: ["Candidate chose to skip this question to manage session time."],
        weaknesses: ["Question was left unanswered. Zero technical or communication signal demonstrated."],
        missingConcepts: ["Core definition", "System design details", "Trade-off analysis", "Practical real-world examples"],
        improvementSuggestions: [
          "Even if uncertain, attempt a partial answer by outlining your thought process and initial principles.",
          "State your assumptions clearly and propose a simplified baseline before addressing edge cases.",
        ],
        modelAnswerOutline: "Structure your response in 4 steps: 1. Core Principle Definition. 2. Step-by-Step Architecture / Mechanism. 3. Failure Scenarios & Edge Cases. 4. Real-world Project Example.",
        recommendedTopics: [params.category || "General Technical Practice"],
        isSimulated: true,
      };
    }

    const words = answer.split(/\s+/);
    const wordCount = words.length;
    const lowerAnswer = answer.toLowerCase();

    // 1. Check for expected technical concepts from question keywords
    const engineeringKeywords = [
      "architecture", "scale", "concurrency", "latency", "throughput", "index", "trade-off",
      "cache", "redis", "database", "transaction", "acid", "lock", "queue", "kafka", "event",
      "star", "situation", "task", "action", "result", "security", "metric", "p95", "p99",
      "memory", "leak", "component", "state", "async", "await", "promise", "distributed",
      "worker", "cpu", "network", "failure", "rollback", "remediation", "monitoring", "postmortem"
    ];

    const matchedKeywords = engineeringKeywords.filter((kw) => lowerAnswer.includes(kw));

    // 2. Multi-axis scoring calibration based on depth, terminology density, and structure
    let relevanceScore = 60;
    let technicalScore = 55;
    let completenessScore = 50;
    let communicationScore = 60;
    let reasoningScore = 55;

    // Word count depth tiers
    if (wordCount < 25) {
      relevanceScore = 45;
      technicalScore = 40;
      completenessScore = 35;
      communicationScore = 45;
      reasoningScore = 35;
    } else if (wordCount < 60) {
      relevanceScore = 68;
      technicalScore = 65;
      completenessScore = 60;
      communicationScore = 70;
      reasoningScore = 62;
    } else if (wordCount < 120) {
      relevanceScore = 80;
      technicalScore = 78;
      completenessScore = 76;
      communicationScore = 82;
      reasoningScore = 77;
    } else {
      // Deep response (>120 words)
      relevanceScore = 88;
      technicalScore = 86;
      completenessScore = 85;
      communicationScore = 89;
      reasoningScore = 86;
    }

    // Keyword density bonuses
    if (matchedKeywords.length >= 2) {
      technicalScore = Math.min(technicalScore + 5, 96);
      reasoningScore = Math.min(reasoningScore + 4, 95);
    }
    if (matchedKeywords.length >= 5) {
      technicalScore = Math.min(technicalScore + 6, 98);
      completenessScore = Math.min(completenessScore + 6, 96);
    }

    // Structured formatting bonus (bullets, numbers, paragraphs)
    const hasStructure = answer.includes("\n") || /\d\.\s/.test(answer) || /[-*]\s/.test(answer);
    if (hasStructure) {
      communicationScore = Math.min(communicationScore + 6, 98);
      reasoningScore = Math.min(reasoningScore + 4, 96);
    }

    // STAR method bonus for Behavioral / HR rounds
    const hasStarKeywords =
      lowerAnswer.includes("situation") ||
      lowerAnswer.includes("task") ||
      lowerAnswer.includes("action") ||
      lowerAnswer.includes("result");

    if ((params.interviewType === "BEHAVIORAL" || params.interviewType === "HR") && hasStarKeywords) {
      communicationScore = Math.min(communicationScore + 8, 98);
      reasoningScore = Math.min(reasoningScore + 7, 98);
      relevanceScore = Math.min(relevanceScore + 5, 98);
    }

    // Calculate composite weighted overall score
    const overallScore = calculateWeightedOverallScore(
      {
        relevance: relevanceScore,
        technical: technicalScore,
        completeness: completenessScore,
        communication: communicationScore,
        reasoning: reasoningScore,
      },
      params.interviewType
    );

    // Contextual qualitative feedback
    const strengths: string[] = [];
    if (wordCount >= 60) {
      strengths.push("Provided a detailed explanation with logical progression and clear problem breakdown.");
    } else {
      strengths.push("Directly tackled the fundamental premise of the question without wandering off-topic.");
    }

    if (matchedKeywords.length >= 3) {
      strengths.push(
        `Demonstrated professional technical vocabulary (effectively applied concepts: ${matchedKeywords.slice(0, 4).join(", ")}).`
      );
    }

    if (hasStructure) {
      strengths.push("Structured formatting (enumeration/paragraphs) made the technical argument highly readable and compelling.");
    }

    if (hasStarKeywords && (params.interviewType === "BEHAVIORAL" || params.interviewType === "HR")) {
      strengths.push("Effectively structured the narrative using STAR (Situation, Task, Action, Result) principles.");
    }

    const weaknesses: string[] = [];
    const missingConcepts: string[] = [];
    const improvementSuggestions: string[] = [];

    if (wordCount < 50) {
      weaknesses.push("Response is relatively brief; fails to address system edge cases, computational constraints, or operational failure states.");
      missingConcepts.push("Edge case and failure mode recovery", "Concrete performance metrics (latency, SLA, throughput)");
      improvementSuggestions.push("Elaborate on what happens when things go wrong (e.g. database timeout, network partition, or concurrent race condition).");
    } else {
      weaknesses.push("Could articulate deeper quantitative benchmarks (e.g. specific p99 latency targets, Big-O complexity, or memory ceilings).");
      missingConcepts.push("Concrete Big-O complexity or SLA targets");
      improvementSuggestions.push("Always state the computational time and space complexity or operational latency budget upfront.");
    }

    if (!lowerAnswer.includes("trade-off") && !lowerAnswer.includes("alternative")) {
      weaknesses.push("Did not explicitly justify why the chosen solution is superior to competing architectural alternatives.");
      missingConcepts.push("Architectural trade-off analysis");
      improvementSuggestions.push("Conclude your answer with a 1-sentence trade-off defense explaining why your solution was chosen over alternatives.");
    }

    const modelAnswerOutline = `1. Core Definition & Principle: Explicitly define the primary concept and state your operational constraints upfront. 
2. Architecture / Mechanism: Decompose the end-to-end flow step-by-step (data flow, storage, protocol). 
3. Failure Scenarios & Edge Cases: Address concurrency race conditions, scale bottlenecks, or network recovery. 
4. Retrospective Defense: Conclude with a concrete real-world engineering trade-off comparison.`;

    const recommendedTopics: string[] = [
      params.category || "Core System Engineering",
      "System Scalability & Trade-offs",
    ];

    return {
      relevanceScore,
      technicalScore,
      completenessScore,
      communicationScore,
      reasoningScore,
      overallScore,
      strengths,
      weaknesses,
      missingConcepts,
      improvementSuggestions,
      modelAnswerOutline,
      recommendedTopics,
      isSimulated: true,
    };
  }

  async generateSessionReport(params: GenerateReportInput): Promise<SessionReportResult> {
    const evals = params.evaluations;
    if (evals.length === 0) {
      return {
        overallScore: 0,
        technicalScore: 0,
        communicationScore: 0,
        relevanceScore: 0,
        completenessScore: 0,
        readinessLevel: "Incomplete",
        readinessSummary: "No answers evaluated for this session.",
        topStrengths: [],
        criticalWeaknesses: [],
        keyRecommendations: [],
        isSimulated: true,
      };
    }

    const avgOverall = Math.round(evals.reduce((acc, e) => acc + e.overallScore, 0) / evals.length);
    const avgTech = Math.round(evals.reduce((acc, e) => acc + e.technicalScore, 0) / evals.length);
    const avgComm = Math.round(evals.reduce((acc, e) => acc + e.communicationScore, 0) / evals.length);
    const avgRel = Math.round(evals.reduce((acc, e) => acc + e.relevanceScore, 0) / evals.length);
    const avgComp = Math.round(evals.reduce((acc, e) => acc + e.completenessScore, 0) / evals.length);

    const readiness = determineReadinessLevel(avgOverall);

    const topStrengths = Array.from(new Set(evals.flatMap((e) => e.strengths))).slice(0, 3);
    const criticalWeaknesses = Array.from(new Set(evals.flatMap((e) => e.weaknesses))).slice(0, 3);
    const keyRecommendations = Array.from(new Set(evals.flatMap((e) => e.improvementSuggestions))).slice(0, 3);

    return {
      overallScore: avgOverall,
      technicalScore: avgTech,
      communicationScore: avgComm,
      relevanceScore: avgRel,
      completenessScore: avgComp,
      readinessLevel: readiness.level,
      readinessSummary: readiness.summary,
      topStrengths,
      criticalWeaknesses,
      keyRecommendations,
      suggestedNextRole: params.targetRole,
      isSimulated: true,
    };
  }
}
