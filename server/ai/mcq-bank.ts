export interface McqQuestionTemplate {
  q: string;
  cat: string;
  skills: string[];
  options: [string, string, string, string];
  correctOptionIndex: 0 | 1 | 2 | 3;
  explanation: string;
  hints: string;
  criteria: string;
  keyConcepts: string[];
}

export const ROLE_MCQ_BANKS: Record<string, McqQuestionTemplate[]> = {
  "Full-Stack Developer": [
    {
      q: "You are designing a high-traffic flash sale checkout flow where 50,000 concurrent users attempt to purchase 500 limited-edition sneakers simultaneously. What is the most effective concurrency strategy to prevent overselling while maintaining sub-5ms latency without bottlenecking the relational database?",
      cat: "High-Concurrency System Design",
      skills: ["Redis Atomic Operations", "PostgreSQL MVCC", "Distributed Locking", "Queue Buffering"],
      options: [
        "Wrap the checkout query in SERIALIZABLE isolation level and let all 50,000 requests retry automatically on serialization failure.",
        "Decrement inventory in-memory using an atomic Redis Lua script or DECR, and publish an order creation event to a message queue for asynchronous database persistence.",
        "Perform 'SELECT stock FROM inventory WHERE id = ?' in application code and issue 'UPDATE inventory SET stock = stock - 1' if stock > 0.",
        "Rely on HTTP ETag headers and client-side browser caching to reject duplicate requests."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct because Redis is single-threaded and executes Lua scripts atomically in memory in <2ms. Checking stock and decrementing within an atomic Lua script guarantees that at most 500 orders are approved, completely bypassing database lock contention. Order creation is then offloaded asynchronously via a message queue (e.g. Kafka/RabbitMQ). Option A causes severe lock contention, thread pool exhaustion, and cascading database crashes. Option C has a classic Check-Then-Act race condition that causes catastrophic overselling. Option D is a client-side caching header that offers zero server-side concurrency guarantees.",
      hints: "Decouple the fast in-memory inventory reservation from the slow relational database write persistence.",
      criteria: "Candidate recognizes atomic in-memory stock reservation (Redis Lua) combined with asynchronous event queuing for database writes.",
      keyConcepts: ["redis", "atomic", "lua", "concurrency", "queue", "kafka", "lock"]
    },
    {
      q: "In Next.js (App Router) and React Server Components (RSC), how do Server Components differ from Client Components regarding JavaScript bundle size and client-side execution?",
      cat: "Modern Full-Stack Architecture",
      skills: ["React Server Components", "Next.js App Router", "Bundle Optimization", "Streaming SSR"],
      options: [
        "Server Components are pre-compiled into WebAssembly binaries that execute on the client browser.",
        "Server Components execute exclusively on the server; their third-party npm dependencies are never included in the client JavaScript bundle.",
        "Server Components are shipped as minified client JavaScript and hydrate automatically during the browser's requestIdleCallback.",
        "Server Components require all child components to be declared with the 'use server' directive at the top of the file."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. React Server Components execute exclusively on the Node.js/Edge server runtime and render into a specialized React Server Component payload (JSON-like stream). Their npm dependencies (such as heavy markdown parsers, syntax highlighters, or database clients) are never bundled or sent to the browser, drastically shrinking client bundle size and improving First Input Delay / INP. Option A is false (they do not use Wasm). Option C describes traditional client hydration. Option D confuses 'use server' (which denotes Server Actions) with Server Components (which are the default in the App Router without any directive).",
      hints: "Think about what code actually gets sent over the network to the user's browser.",
      criteria: "Understands zero-bundle impact of Server Components and server-side execution.",
      keyConcepts: ["rsc", "server component", "bundle size", "hydration", "next.js"]
    },
    {
      q: "A Node.js backend API route generating complex PDF reports is causing CPU spikes to 100% and 504 Gateway Timeouts for all other API endpoints. What is the fundamental cause and the architectural fix?",
      cat: "Node.js Internals & Event Loop",
      skills: ["Event Loop", "Worker Threads", "CPU-bound Processing", "Asynchronous Architecture"],
      options: [
        "Node.js runs out of file descriptors; increase the ulimit ceiling on the host operating system.",
        "Synchronous CPU-bound PDF rendering blocks the single-threaded V8 Event Loop; offload rendering to Node.js Worker Threads or a background job queue.",
        "V8 garbage collection is trapped in an infinite mark-and-sweep loop; restart the Node process with --max-old-space-size=8192.",
        "The HTTP keep-alive timeout is too short; increase keepAliveTimeout to 120 seconds."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Node.js executes JavaScript code on a single main event loop thread. When heavy CPU-bound computation (such as synchronous PDF rendering, image manipulation, or cryptography) runs on the main thread, it blocks the event loop, preventing all incoming HTTP connections, timers, and I/O callbacks from executing. The correct architectural remediation is offloading CPU-intensive tasks to Node.js Worker Threads or a dedicated background job queue (e.g. BullMQ/Redis) running on separate worker processes. Options A, C, and D address unrelated resource limits.",
      hints: "Remember that Node.js runs JavaScript on a single thread; heavy calculations block all other requests.",
      criteria: "Identifies event loop blocking caused by CPU-bound tasks and prescribes worker threads or background job queues.",
      keyConcepts: ["event loop", "worker threads", "cpu-bound", "blocking", "bullmq"]
    },
    {
      q: "When architecting a real-time collaborative document editor (like Google Docs or Notion) supporting simultaneous edits, why are Conflict-Free Replicated Data Types (CRDTs) frequently preferred over classic Operational Transformation (OT)?",
      cat: "Distributed Systems & Real-time State",
      skills: ["CRDTs (Yjs/Automerge)", "Operational Transformation", "WebSockets", "Eventual Consistency"],
      options: [
        "CRDTs mathematically guarantee eventual convergence across peers without requiring a centralized serialization server to order every operation.",
        "CRDTs compress WebSocket payloads using Brotli algorithms to reduce network traffic by 90%.",
        "Operational Transformation only works over HTTP/2, whereas CRDTs support legacy HTTP/1.1 connections.",
        "CRDTs store all document history in browser LocalStorage, eliminating the need for server-side persistence."
      ],
      correctOptionIndex: 0,
      explanation: "Option A is correct. Classic Operational Transformation (OT) relies on a centralized server that acts as a single source of truth to serialize, transform, and sequence every concurrent keystroke. In contrast, Conflict-Free Replicated Data Types (CRDTs, e.g. Yjs, Automerge) use mathematically proven merge rules (semi-lattices) where operations are commutative and associative, enabling decentralized convergence without central lockstep coordination. Options B, C, and D are factually inaccurate.",
      hints: "Consider how concurrent edits converge when two users type at the exact same millisecond.",
      criteria: "Compares centralized serialization requirement of OT with decentralized mathematical convergence of CRDTs.",
      keyConcepts: ["crdt", "ot", "distributed", "convergence", "websocket", "yjs"]
    },
    {
      q: "In PostgreSQL, a query with 'WHERE department_id = 4 AND created_at >= '2026-01-01'' on a 50-million row table is running slowly via a Sequential Scan despite an index on '(created_at, department_id)'. Why is the index underutilized, and how should it be modified?",
      cat: "Database Internals & Index Optimization",
      skills: ["PostgreSQL B-Tree", "Compound Indexing", "Leftmost Prefix Rule", "Query Optimization"],
      options: [
        "B-Tree indexes cannot index timestamp columns; convert the column to epoch integers.",
        "The index orders by 'created_at' first; place the high-cardinality equality column first '(department_id, created_at)' so the engine can seek directly to the department.",
        "PostgreSQL requires an explicit 'FORCE INDEX' hint in the SELECT statement to use composite indexes.",
        "Change the index to a BRIN index because B-Trees do not support multi-column composite filtering."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Composite B-Tree indexes follow the leftmost-prefix rule. When the index is created as '(created_at, department_id)', the leading column is filtered with a range condition ('>='). Once a range condition is evaluated on a leading B-Tree column, subsequent columns cannot be sought efficiently via binary search; the database must scan all index entries within the date range. Indexing as '(department_id, created_at)' allows PostgreSQL to seek in O(log N) directly to 'department_id = 4' and then scan only the matching range of dates. PostgreSQL does not have a 'FORCE INDEX' syntax (Option C).",
      hints: "In composite indexes, place equality filter columns before range filter columns.",
      criteria: "Explains leftmost prefix traversal and the rule of placing equality columns before range columns.",
      keyConcepts: ["index", "b-tree", "composite", "leftmost prefix", "query plan", "postgresql"]
    },
    {
      q: "Which HTTP response header configuration is the modern standard for mitigating Cross-Site Request Forgery (CSRF) on session cookies in web applications?",
      cat: "Web Application Security",
      skills: ["CSRF Defense", "SameSite Cookies", "HTTP Headers", "Web Security"],
      options: [
        "Set-Cookie: sessionId=xyz; Secure; HttpOnly; SameSite=Lax (or SameSite=Strict)",
        "Access-Control-Allow-Origin: *; Access-Control-Allow-Methods: GET, POST",
        "X-Frame-Options: DENY; Content-Security-Policy: default-src 'self'",
        "Cache-Control: no-cache, no-store, must-revalidate"
      ],
      correctOptionIndex: 0,
      explanation: "Option A is correct. Setting cookies with 'SameSite=Lax' or 'SameSite=Strict' instructs the browser never to send the cookie on cross-site requests initiated by third-party origins (such as malicious forms or scripts on external sites), effectively mitigating CSRF attacks. Combining it with 'HttpOnly' prevents client-side JavaScript access (mitigating XSS theft) and 'Secure' ensures transmission only over HTTPS. Option B (CORS wildcard) actually widens access. Option C protects against Clickjacking. Option D governs HTTP caching.",
      hints: "Focus on cookie attributes that control cross-site transmission behavior.",
      criteria: "Identifies SameSite cookie attribute (Strict/Lax) alongside Secure and HttpOnly flags.",
      keyConcepts: ["csrf", "samesite", "cookie", "security", "httponly", "secure"]
    }
  ],

  "Frontend Developer": [
    {
      q: "Core Web Vitals replaced First Input Delay (FID) with Interaction to Next Paint (INP) as a stable metric. What does INP measure that FID missed?",
      cat: "Core Web Vitals & Performance",
      skills: ["INP Optimization", "Core Web Vitals", "Event Loop", "Main Thread Latency"],
      options: [
        "INP measures the time to download the initial HTML document from the server.",
        "INP measures the worst latency of all user interactions (clicks, taps, key presses) throughout the entire page lifecycle, including event processing and rendering presentation delay.",
        "INP measures the size in kilobytes of all CSS and font resources loaded in the viewport.",
        "INP measures only the first click on the page and ignores subsequent user interactions."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. First Input Delay (FID) only measured the input delay of the very *first* interaction on a page, ignoring all subsequent interactions as well as the event processing time and presentation delay (the time the browser takes to recalculate styles, layout, and composite the frame). INP measures the latency of all qualifying user interactions throughout the entire page lifecycle and reports the 98th percentile, capturing input delay, event processing duration, and presentation delay. Option D was the limitation of FID.",
      hints: "Think about the full page lifecycle and the three phases: input delay, processing time, and presentation delay.",
      criteria: "Explains INP capturing input delay, event handler processing, and browser render/paint presentation delay across all lifecycle interactions.",
      keyConcepts: ["inp", "core web vitals", "presentation delay", "long tasks", "event loop"]
    },
    {
      q: "Under React's Fiber architecture, how does React pause rendering a low-priority component tree to handle an urgent user keystroke without freezing the browser?",
      cat: "React Engine & Fiber Internals",
      skills: ["React Fiber", "Concurrent Rendering", "Time Slicing", "Scheduler"],
      options: [
        "React uses synchronous recursion on the call stack and kills the worker thread using TerminateProcess.",
        "Fiber transforms the component tree into a singly linked list of fiber nodes; React's Scheduler yields execution back to the browser event loop every ~5ms and discards incomplete work-in-progress if higher priority updates arrive.",
        "React compiles all JSX into raw WebGL shaders that execute concurrently on the user's GPU.",
        "React intercepts browser DOM events at the window capture phase and blocks the native OS keyboard buffer."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. In React 15, reconciliation was a synchronous recursive walk over the Virtual DOM that could not be paused. Fiber reimagined the component tree as a singly linked list with 'child', 'sibling', and 'return' pointers. This enables React's Scheduler to process units of work iteratively. Every ~5ms, React checks if the frame deadline has passed and yields control to the browser. If a high-priority user interaction arrives (like typing), React can pause or discard the current low-priority work-in-progress tree, process the urgent update, and resume low-priority work later.",
      hints: "Contrast recursive stack reconciliation with linked-list iterative units of work.",
      criteria: "Understands linked list Fiber structure, cooperative scheduling via MessageChannel, and interruptible work-in-progress trees.",
      keyConcepts: ["fiber", "scheduler", "time slicing", "concurrent", "linked list"]
    },
    {
      q: "Which CSS property combination creates a new Stacking Context and promotes an element to its own GPU compositing layer without altering its visual layout?",
      cat: "Browser Rendering & CSS Performance",
      skills: ["CSS Compositing", "Stacking Context", "GPU Acceleration", "Layout Thrashing"],
      options: [
        "display: inline; float: left;",
        "will-change: transform; (or transform: translateZ(0);)",
        "margin: 0 auto; text-align: center;",
        "box-sizing: border-box; overflow: visible;"
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Properties like 'will-change: transform' or 3D transforms like 'transform: translateZ(0)' inform the browser rendering engine that the element will undergo transformation. The browser promotes the element to its own compositing layer (RenderLayer -> GraphicsLayer). During animations, the GPU handles position, opacity, or transform changes directly without triggering expensive CPU Layout (reflow) or Paint passes. Option A, C, and D do not create compositing layers.",
      hints: "Think about GPU hardware acceleration triggers in modern browsers.",
      criteria: "Identifies will-change and transform: translateZ(0) as compositing layer triggers.",
      keyConcepts: ["gpu", "compositing", "will-change", "transform", "stacking context"]
    },
    {
      q: "What is a common cause of memory leaks in Single Page Applications (SPAs) built with modern frameworks like React, Vue, or Angular?",
      cat: "JavaScript Memory & Garbage Collection",
      skills: ["Memory Leaks", "Garbage Collection", "Event Listeners", "Detached DOM"],
      options: [
        "Using const and let instead of var for variable declarations.",
        "Attaching event listeners to the global 'window' or 'document' inside a component lifecycle/effect without removing them in the cleanup function.",
        "Storing JSON data inside component state instead of a relational SQL database.",
        "Rendering more than 10 SVG icons on a single page."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. In Single Page Applications, the page does not reload between navigation routes. If a component registers an event listener on the global 'window' or 'document' object (e.g. 'window.addEventListener('resize', handler)') or initiates a 'setInterval', and fails to detach it when the component unmounts, the global object retains a reference to the handler closure, preventing the component and all its captured scope variables and DOM nodes from being garbage collected. This leads to detached DOM nodes and continuous memory consumption.",
      hints: "Consider what happens to event listeners attached to global objects when a component disappears from the screen.",
      criteria: "Identifies uncleared global event listeners and timers preventing garbage collection of unmounted component closures.",
      keyConcepts: ["memory leak", "event listener", "cleanup", "garbage collection", "detached dom"]
    }
  ],

  "Backend Developer": [
    {
      q: "In distributed microservice architectures, how should an API service implement Idempotency for POST mutation requests (e.g. payment debits or order placements)?",
      cat: "Distributed Systems & Idempotency",
      skills: ["Idempotency Keys", "Distributed Transactions", "PostgreSQL Unique Constraints", "API Reliability"],
      options: [
        "Return an HTTP 301 redirect whenever the client submits duplicate query parameters.",
        "Require an 'Idempotency-Key' header from the client; record the key atomically in a database table with a unique constraint, and return the cached original response on retried requests.",
        "Generate a random timestamp on the server and sleep for 100ms before processing.",
        "Rely on TCP packet sequence numbers to deduplicate application layer HTTP requests."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is the industry standard (used by Stripe, AWS, and PayPal). The client sends a unique UUID in an 'Idempotency-Key' HTTP header. Within a database transaction, the server attempts to insert this key. If the key already exists and has completed, the server immediately returns the cached HTTP status code and response body without re-executing the payment or debit. If a duplicate arrives while the first is in-flight, it returns 409 Conflict or waits. This guarantees exactly-once business semantics over at-least-once network transports.",
      hints: "Consider how payment gateways like Stripe guarantee a customer is never billed twice when their network drops.",
      criteria: "Details Idempotency-Key header, atomic persistence with unique constraints, and cached response replaying.",
      keyConcepts: ["idempotency", "unique constraint", "retry", "stripe", "transaction"]
    },
    {
      q: "In database systems adhering to ANSI SQL isolation levels, what is the key difference between a Non-Repeatable Read and a Phantom Read?",
      cat: "Database ACID & Isolation Levels",
      skills: ["ACID Isolation Levels", "PostgreSQL MVCC", "Phantom Reads", "Transaction Concurrency"],
      options: [
        "A Non-Repeatable Read occurs when a row's column data is modified by another committed transaction between two reads; a Phantom Read occurs when a range query sees new rows inserted or deleted by another committed transaction.",
        "Non-Repeatable Reads only happen in NoSQL databases, whereas Phantom Reads only happen in SQLite.",
        "A Phantom Read is when an uncommitted transaction's changes are visible (dirty read), while Non-Repeatable Reads only apply to indexes.",
        "There is no difference; they are synonymous terms for dirty reads."
      ],
      correctOptionIndex: 0,
      explanation: "Option A is correct. In a Non-Repeatable Read, Transaction A reads row 1. Transaction B updates row 1 and commits. Transaction A reads row 1 again and sees modified values. In a Phantom Read, Transaction A runs a range query: 'SELECT * FROM users WHERE age > 30' (returns 5 rows). Transaction B inserts a new user with age 35 and commits. Transaction A re-executes the exact same query and discovers a 6th 'phantom' row that did not exist previously. Repeatable Read prevents non-repeatable reads; Serializable prevents phantom reads.",
      hints: "Think about modifying existing rows versus inserting new rows matching a range predicate.",
      criteria: "Distinguishes row modification (non-repeatable read) from range predicate insertion/deletion (phantom read).",
      keyConcepts: ["isolation", "non-repeatable read", "phantom read", "acid", "mvcc"]
    },
    {
      q: "In an Apache Kafka cluster, what mechanism does Kafka use to ensure messages with the exact same partition key are always processed in strict sequential order?",
      cat: "Message Streaming & Kafka Architecture",
      skills: ["Apache Kafka", "Partition Key Hashing", "Message Ordering", "Consumer Groups"],
      options: [
        "Kafka merges all topic partitions into a single global sorted priority queue on the broker.",
        "Kafka hashes the message key and assigns all records with the same key to the exact same partition, where records are appended to an immutable sequential log.",
        "Kafka delays message delivery by 5 seconds to sort messages alphabetically by client ID.",
        "Kafka delegates sequential ordering to the client's browser WebSocket connection."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Kafka provides ordering guarantees strictly at the *partition* level, not across an entire topic. When a producer sends a record with a partition key (e.g. 'account_id_123'), Kafka's default partitioner hashes the key (using murmur2) to determine the partition. All records with that key are appended to the same partition log in chronological order. Because a partition is consumed by only one consumer within a consumer group at any given time, message processing is strictly sequential for that key.",
      hints: "Remember that Kafka guarantees ordering within a partition, not across the entire topic.",
      criteria: "Understands partition key hashing and intra-partition sequential log append guarantees.",
      keyConcepts: ["kafka", "partition", "key", "ordering", "consumer group"]
    },
    {
      q: "What is the 'Cache Stampede' (or Thundering Herd) problem, and how is it most effectively prevented in high-throughput backend services?",
      cat: "Distributed Caching & High Availability",
      skills: ["Cache Stampede", "Redis Caching", "Mutex Locking", "XFetch Probabilistic Early Expiration"],
      options: [
        "When cache servers run out of hard drive space and delete all saved session keys.",
        "When a heavily requested cached key expires, causing thousands of concurrent client requests to simultaneously miss the cache and overwhelm the underlying database; mitigated using distributed mutex locks or probabilistic early expiration (XFetch).",
        "When users submit invalid passwords multiple times in a row, causing bcrypt to exhaust CPU threads.",
        "When an API route sends HTTP 429 Too Many Requests to search engine web crawlers."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. A cache stampede occurs when a high-traffic key (e.g. homepage featured items) expires. At that exact millisecond, hundreds or thousands of concurrent incoming requests experience a cache miss simultaneously. Each thread queries the database and attempts to recompute the value, causing database connection pool exhaustion and CPU spikes. Mitigations include: 1) Distributed mutex locks (only one thread computes while others wait); 2) Probabilistic early expiration (XFetch algorithm, where threads probabilistically refresh before actual expiry); 3) Background worker pre-warming.",
      hints: "Consider what happens the exact millisecond a popular cache key reaches its TTL under heavy traffic.",
      criteria: "Defines cache stampede and identifies distributed locks or probabilistic early expiration as mitigations.",
      keyConcepts: ["cache stampede", "thundering herd", "redis", "mutex", "xfetch", "ttl"]
    }
  ],

  "AI / Machine Learning Engineer": [
    {
      q: "In an enterprise Retrieval-Augmented Generation (RAG) system, users complain that responses contain irrelevant context or miss specific product model numbers despite high semantic vector similarity. What architectural improvement directly resolves this failure mode?",
      cat: "RAG Systems & Vector Search",
      skills: ["RAG Architecture", "Hybrid Search", "BM25 / Sparse Retrieval", "Cross-Encoder Reranking"],
      options: [
        "Increase the LLM sampling temperature to 1.8 to encourage creative guessing of missing information.",
        "Implement a Hybrid Search pipeline combining dense vector embeddings with sparse lexical search (BM25 / SPLADE), followed by a Cross-Encoder Reranker.",
        "Double the text chunk size from 500 tokens to 4,000 tokens while keeping vector cosine distance.",
        "Disable vector search completely and perform client-side regex matching across raw documents."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Dense vector embeddings excel at semantic concepts but frequently fail on exact lexical matches like alphanumeric model numbers, SKU codes, and acronyms where embeddings are diffuse. Hybrid Search combines dense vector retrieval (for semantic meaning) with sparse keyword retrieval like BM25 (for exact token hits). A Cross-Encoder Reranker then jointly scores the query and candidate passages together (attending across all query-document token interactions), eliminating false-positive vector candidates before passing the top passages to the LLM.",
      hints: "Combine semantic understanding with exact keyword precision, then score candidate relevance.",
      criteria: "Identifies Hybrid Search (dense + sparse BM25) and Cross-Encoder reranking as the solution for lexical/semantic gaps.",
      keyConcepts: ["rag", "hybrid search", "bm25", "reranker", "cross-encoder"]
    },
    {
      q: "Why does LoRA (Low-Rank Adaptation) require drastically less GPU VRAM during fine-tuning compared to full parameter fine-tuning of an LLM?",
      cat: "Parameter-Efficient Fine-Tuning (PEFT)",
      skills: ["LoRA", "PEFT", "VRAM Optimization", "Backpropagation"],
      options: [
        "LoRA converts the model weights from float32 to 1-bit binary numbers.",
        "LoRA freezes the pre-trained model weights and injects trainable rank decomposition matrices (A and B) into transformer layers, drastically reducing the number of optimizer states stored in memory.",
        "LoRA offloads all backpropagation calculations to the host CPU RAM via PCIe bus.",
        "LoRA removes all attention layers from the model during training."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. In full fine-tuning of an LLM, the Adam optimizer maintains 2 additional states (momentum and variance) for *every* parameter in the model (requiring 8 to 16 bytes per parameter just for optimizer states). LoRA freezes the original weights W0 and decomposes the weight update into two low-rank matrices: delta W = B * A, where A is (r x d) and B is (d x r) with rank r << d. Because only matrices A and B are updated, the number of trainable parameters and optimizer states drops by over 99%, allowing large models to be fine-tuned on single consumer GPUs.",
      hints: "Consider what the Adam optimizer has to store in memory during backpropagation.",
      criteria: "Explains freezing base weights, low-rank decomposition matrices (A and B), and eliminating 99%+ of optimizer states.",
      keyConcepts: ["lora", "peft", "vram", "adam optimizer", "low-rank", "fine-tuning"]
    },
    {
      q: "How does the computational complexity of the standard self-attention mechanism in Transformers scale with input sequence length N, and why does this impact long-context processing?",
      cat: "Transformer Internals & Attention",
      skills: ["Self-Attention", "Computational Complexity", "FlashAttention", "Context Window"],
      options: [
        "O(N) linear complexity; doubling sequence length doubles computation time.",
        "O(N^2) quadratic complexity in both computation time and memory because every token attends to every other token in the sequence.",
        "O(log N) logarithmic complexity; sequence length has negligible impact on GPU compute.",
        "O(1) constant complexity because GPUs parallelize all tokens simultaneously."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. In standard scaled dot-product self-attention, the Query (Q) matrix of shape (N x d) is multiplied by the Key (K) matrix of shape (d x N) to form the attention score matrix of shape (N x N). Computing and storing this N x N attention matrix requires O(N^2) operations and memory. When input sequence length doubles (e.g. from 4k to 8k tokens), attention computation increases 4x. Optimizations like FlashAttention (tiling in GPU SRAM) and linear attention mechanisms are designed specifically to mitigate this bottleneck.",
      hints: "Think about the shape of the attention score matrix when every token attends to all N tokens.",
      criteria: "Identifies O(N^2) quadratic scaling in time and memory due to the N x N attention matrix.",
      keyConcepts: ["self-attention", "quadratic", "O(N^2)", "transformer", "flashattention"]
    }
  ],

  "DevOps / Cloud Engineer": [
    {
      q: "A Kubernetes pod running in your production cluster terminates abruptly with exit code 137 and status 'OOMKilled'. What does this indicate, and what is the remediation?",
      cat: "Kubernetes & Cloud Infrastructure",
      skills: ["Kubernetes Diagnostics", "cgroups", "OOMKilled", "Resource Limits"],
      options: [
        "The application experienced an unhandled null pointer exception in user code; rewrite the application in Rust.",
        "The container exceeded its configured memory limit in the pod specification, causing the Linux kernel cgroup OOM Killer to send SIGKILL (128 + 9 = 137); increase memory limits or fix in-app memory leaks.",
        "The pod failed its liveness probe 3 times in a row, causing the kubelet to restart it with a network timeout.",
        "The worker node's root EBS volume ran out of inode storage space."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Exit code 137 represents a fatal termination by SIGKILL (signal 9, so 128 + 9 = 137). When a container's memory usage reaches the 'resources.limits.memory' threshold defined in its pod spec, the Linux kernel cgroup subsystem triggers the Out-Of-Memory (OOM) Killer to terminate the process immediately to protect the host node. Unlike CPU throttling (which merely slows down processing), memory limit violations result in immediate process termination. Remediation requires inspecting heap dumps, fixing leaks, or right-sizing memory limits.",
      hints: "Remember exit code 137 = 128 + signal 9 (SIGKILL).",
      criteria: "Explains Linux kernel cgroup OOM killer invoking SIGKILL when container memory exceeds limit threshold.",
      keyConcepts: ["oomkilled", "exit code 137", "cgroup", "kubernetes", "sigkill", "memory limits"]
    },
    {
      q: "When architecting an Active-Passive Disaster Recovery (DR) plan across two cloud regions, how do you differentiate between RTO (Recovery Time Objective) and RPO (Recovery Point Objective)?",
      cat: "Disaster Recovery & High Availability",
      skills: ["RTO and RPO", "Disaster Recovery", "Cloud Architecture", "Business Continuity"],
      options: [
        "RTO is the maximum acceptable data loss measured in time (e.g. 5 minutes of data lost); RPO is how quickly services must be restored (e.g. back online in 15 minutes).",
        "RTO is the maximum acceptable duration of downtime until the system is restored; RPO is the maximum acceptable age of data that can be lost due to the incident.",
        "RTO and RPO are identical metrics measuring total financial cost per hour of downtime.",
        "RTO measures CPU utilization during failover; RPO measures network packet loss percentage."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Recovery Time Objective (RTO) answers: 'How long can we afford to be down before systems are operational again?' (measures downtime duration). Recovery Point Objective (RPO) answers: 'How much data can we afford to lose?' (measured as the time delta between the disaster and the latest valid backup or replicated transaction). For example, an RTO of 30 minutes with an RPO of 1 minute means systems must be back online in 30 minutes, and no more than 60 seconds of transactions may be lost.",
      hints: "RTO is time to recover (downtime); RPO is point in time of data loss (data currency).",
      criteria: "Accurately defines RTO as downtime duration and RPO as data loss threshold measured in time.",
      keyConcepts: ["rto", "rpo", "disaster recovery", "failover", "sla"]
    }
  ],

  "Cybersecurity Engineer": [
    {
      q: "In JSON Web Token (JWT) verification, what is an 'Algorithm Confusion Attack' (or RS256 vs HS256 mismatch), and how is it prevented?",
      cat: "Authentication & Cryptographic Security",
      skills: ["JWT Security", "Algorithm Confusion", "Public-Key Cryptography", "HMAC"],
      options: [
        "When an attacker changes the token expiration date to year 2099.",
        "When an attacker modifies the token header to symmetric 'alg: HS256' and signs the token with the server's public RSA key; the vulnerable server verifies the signature using the public key as an HMAC secret. Prevent by explicitly whitelisting allowed verification algorithms.",
        "When a user signs in from two different browsers at the same time.",
        "When the token size exceeds 4KB, forcing the server to fall back to plain text cookies."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. In RS256, tokens are signed with a private key and verified with a public key. The public key is widely known and distributed. If the server's JWT library blindly trusts the algorithm specified in the token's unverified header ('alg: HS256'), the library treats the server's public key as the HMAC symmetric secret. The attacker crafts any token payload, signs it locally with the public key using HS256, and the server verifies it successfully! The defense is hardcoding the expected algorithm (e.g. 'algorithms: [\"RS256\"]') and strictly rejecting 'none' or mismatched algorithms.",
      hints: "Consider what happens when a public key is used as a symmetric HMAC secret key.",
      criteria: "Explains RS256 to HS256 algorithm confusion using public keys as HMAC secrets, and whitelisting verification algorithms.",
      keyConcepts: ["jwt", "rs256", "hs256", "algorithm confusion", "cryptography", "security"]
    },
    {
      q: "Which defense provides the strongest, most comprehensive protection against SQL Injection attacks across all database engines?",
      cat: "Application Security & Injection Defense",
      skills: ["SQL Injection", "Parameterized Queries", "Prepared Statements", "OWASP Top 10"],
      options: [
        "Escaping single quote characters on the client side using JavaScript replace(/\\'/g, \"''\").",
        "Using Parameterized Queries (Prepared Statements) or an ORM that separates SQL query structure from untrusted user input parameters.",
        "Restricting input field lengths in HTML to 20 characters.",
        "Encrypting the database connection string with AES-256."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Parameterized queries (prepared statements) ensure the database engine compiles the SQL code and Abstract Syntax Tree (AST) *before* inserting user parameters. The user input is treated strictly as literal data, never executable code, rendering SQL injection mathematically impossible regardless of what quotes or SQL commands are supplied. Client-side escaping (Option A) is easily bypassed by attackers using API tools like curl or Postman.",
      hints: "Separate the code structure from the user data parameters.",
      criteria: "Identifies parameterized queries/prepared statements as the definitive defense against SQL injection.",
      keyConcepts: ["sql injection", "parameterized queries", "prepared statements", "owasp"]
    }
  ],

  "QA / Test Automation Engineer": [
    {
      q: "In modern end-to-end testing with Playwright or Cypress, what is the primary technical cause of test flakiness, and how is it resolved?",
      cat: "Test Automation & Flakiness",
      skills: ["Playwright", "Test Flakiness", "Auto-waiting", "Async Assertions"],
      options: [
        "Using TypeScript instead of JavaScript for test files.",
        "Relying on arbitrary hardcoded sleeps (e.g. sleep(3000)) and unisolated shared database state; resolved by using web-first auto-waiting assertions and isolated test database fixtures per worker.",
        "Running tests on Chrome instead of Firefox.",
        "Using CSS selectors instead of XPath expressions."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Hardcoded timeouts ('sleep(3000)') cause tests to fail whenever CI servers experience load spikes or network delays. Web-first assertions (e.g. 'expect(locator).toBeVisible()') continuously poll the DOM until the condition is met or a timeout expires, adapting to dynamic rendering. Furthermore, parallel test workers sharing mutable database records cause race conditions; each test worker should generate isolated test data fixtures.",
      hints: "Replace hardcoded timeouts with reactive DOM polling.",
      criteria: "Identifies hardcoded sleeps and shared state as causes of flakiness, prescribing auto-waiting locators and test isolation.",
      keyConcepts: ["flakiness", "auto-waiting", "sleep", "playwright", "test isolation"]
    }
  ],

  "Data Engineer": [
    {
      q: "In an Apache Spark ETL pipeline processing terabytes of data, an aggregation job hangs at 99% completion because one executor task is processing 10x more data than the others and fails with OutOfMemoryError. What is this phenomenon and how is it fixed?",
      cat: "Distributed Big Data & Apache Spark",
      skills: ["Data Skew", "Apache Spark", "Salting Technique", "Adaptive Query Execution"],
      options: [
        "Cache thrashing; restart the Spark driver node with double the CPU cores.",
        "Data Skew on the join/groupBy key; resolved by 'salting' the skewed key with random integers to distribute records evenly across partitions, or enabling Spark Adaptive Query Execution (AQE).",
        "Network partition failure; upgrade network cards from 1Gbps to 10Gbps.",
        "Parquet compression error; switch from Snappy compression to Gzip."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. Data skew occurs when records with a specific key (e.g. a viral merchant or null values) cluster in an uneven distribution. When Spark partitions data by hash(key), 90% of rows end up on a single executor partition, creating a straggler task that runs for hours or crashes with OOM while all other 199 tasks finish in seconds. The remediation is 'Salting': appending a random integer (e.g. 0-9) to the key to break the single massive partition into 10 smaller parallel partitions, or enabling Spark 3.x Adaptive Query Execution (AQE) skew join.",
      hints: "Think about breaking a single massive key into multiple smaller sub-keys.",
      criteria: "Identifies Data Skew on join/groupBy keys and prescribes key salting or AQE.",
      keyConcepts: ["spark", "data skew", "salting", "aqe", "executor", "partition"]
    }
  ],

  "Product Manager": [
    {
      q: "In web applications, what is the difference between an idempotent HTTP method (like PUT or DELETE) and a non-idempotent HTTP method (like POST)?",
      cat: "RESTful API Standards",
      skills: ["HTTP Methods", "Idempotency", "REST API Design", "System Architecture"],
      options: [
        "Idempotent methods can only be executed by administrators; non-idempotent methods can be executed by anyone.",
        "An idempotent method can be called multiple times with the same parameters without changing the final server state beyond the initial call; a non-idempotent method alters server state on each subsequent execution.",
        "Idempotent methods use SSL certificates; non-idempotent methods do not.",
        "Idempotent methods return HTML, while non-idempotent methods return JSON."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. An HTTP method is idempotent if the side-effects of making N > 0 identical requests are the same as making a single request. For example, 'DELETE /users/42' or 'PUT /users/42 { name: \"Alice\" }' leaves the server in the exact same state whether called once or ten times. In contrast, 'POST /orders' is non-idempotent; calling it three times creates three distinct orders and charges the customer three times unless an explicit idempotency key is implemented.",
      hints: "Consider what happens to database state if a user clicks a button 5 times in rapid succession.",
      criteria: "Explains idempotency as producing identical server state regardless of the number of identical executions.",
      keyConcepts: ["idempotency", "rest", "http", "put", "post", "delete"]
    }
  ],

  "Mobile Developer (iOS/Android)": [
    {
      q: "In mobile development, why is cold start launch time significantly slower than warm start launch time, and how do Android Baseline Profiles improve cold start performance?",
      cat: "Mobile Performance & Startup",
      skills: ["Cold Start Optimization", "Android Baseline Profiles", "AOT vs JIT", "Mobile Architecture"],
      options: [
        "Cold starts download the entire APK file from the Google Play Store on every launch.",
        "In a cold start, the OS must create a new Linux process, initialize the application runtime, and load classes from scratch; Baseline Profiles pre-compile critical execution paths into native machine code (Ahead-Of-Time) during app installation.",
        "Cold starts run exclusively in battery-saver mode.",
        "Baseline Profiles compress all image assets inside the drawable directory into SVGs."
      ],
      correctOptionIndex: 1,
      explanation: "Option B is correct. In a cold start, the application process does not exist in memory. The OS must instantiate a new process, initialize Android runtime (ART) / iOS dyld dynamic linkers, run Application.onCreate(), and initialize the dependency injection graph before rendering the first frame. Baseline Profiles provide a list of critical classes and methods that the Android Runtime pre-compiles into native machine code during installation (AOT), avoiding slow Just-In-Time (JIT) interpretation and bytecode verification during launch.",
      hints: "Think about process creation and AOT vs JIT compilation during app launch.",
      criteria: "Explains process creation overhead in cold starts and Ahead-Of-Time (AOT) compilation via Baseline Profiles.",
      keyConcepts: ["cold start", "baseline profile", "android", "aot", "jit", "startup"]
    }
  ]
};

// General fallback bank for any custom technical role
export const GENERAL_TECHNICAL_MCQ_BANK: McqQuestionTemplate[] = [
  {
    q: "In computer science and web architecture, what is the difference between Process Concurrency and Parallelism?",
    cat: "Core Computer Science Fundamentals",
    skills: ["Concurrency vs Parallelism", "Multithreading", "CPU Schedulers", "System Design"],
    options: [
      "Concurrency and Parallelism are exact synonyms; there is no distinction.",
      "Concurrency is dealing with lots of things at once (structuring a program into independently executing tasks via time-slicing); Parallelism is doing lots of things at once (executing tasks simultaneously on multiple physical CPU cores).",
      "Concurrency only works in interpreted languages like Python; Parallelism only works in compiled languages like C++.",
      "Concurrency requires GPU hardware, while Parallelism runs on CPU cache."
    ],
    correctOptionIndex: 1,
    explanation: "Option B is correct (as famously articulated by Rob Pike). Concurrency is about *composition and structure*: breaking a program into independent tasks that can be interleaved on a single core or across many cores. Parallelism is about *simultaneous physical execution* requiring multiple hardware processors or cores. A single-core CPU can be concurrent via time-slicing, but cannot be parallel.",
    hints: "Concurrency is about structure; parallelism is about simultaneous execution.",
    criteria: "Distinguishes logical task interleaving (concurrency) from physical simultaneous multi-core execution (parallelism).",
    keyConcepts: ["concurrency", "parallelism", "cpu", "threads", "time-slicing"]
  },
  {
    q: "When an engineer executes 'git rebase main' on a feature branch instead of 'git merge main', what fundamentally happens to the branch's commit history?",
    cat: "Version Control & Engineering Workflows",
    skills: ["Git Internals", "Rebase vs Merge", "Commit DAG", "Engineering Hygiene"],
    options: [
      "Git creates a diamond-shaped merge commit that permanently records the point of integration.",
      "Git temporarily unwinds the feature branch commits, applies the new commits from main, and then re-applies each feature commit on top of main with new commit hashes, creating a linear history.",
      "Git deletes the remote repository and replaces it with a local snapshot.",
      "Git compiles the code and tests whether unit tests pass before modifying git logs."
    ],
    correctOptionIndex: 1,
    explanation: "Option B is correct. 'git merge' creates a 3-way merge commit with two parents, preserving the exact historical branching topology. 'git rebase' rewinds the branch to the common ancestor, fast-forwards the branch tip to the latest commit on main, and replays each of your feature branch commits one by one on top. Because the parent commit has changed, each rebased commit receives a brand-new SHA hash, producing a clean, linear commit history.",
    hints: "Think about replaying commits onto a new base commit to create a linear history.",
    criteria: "Explains unwinding and replaying commits on top of the target branch with new hashes to produce a linear history.",
    keyConcepts: ["git", "rebase", "merge", "linear history", "dag"]
  },
  {
    q: "Which caching strategy writes data directly to both the cache and the primary database simultaneously before returning a success response to the client?",
    cat: "Distributed Systems & Caching",
    skills: ["Caching Patterns", "Write-Through", "Cache-Aside", "Data Consistency"],
    options: [
      "Cache-Aside (Lazy Loading)",
      "Write-Through Caching",
      "Write-Behind (Write-Back) Caching",
      "Read-Through Caching"
    ],
    correctOptionIndex: 1,
    explanation: "Option B is correct. In Write-Through caching, the application writes data to the cache, and the cache synchronously writes to the primary database before acknowledging the write as successful. This ensures high read data consistency because the cache is always fresh. In Write-Behind (Option C), writes to the database are asynchronous (faster write latency, but risk of data loss on crash). In Cache-Aside (Option A), the application writes to the database directly and invalidates the cache.",
    hints: "Consider synchronous dual-writes to cache and database.",
    criteria: "Accurately identifies Write-Through caching and contrasts it with Cache-Aside and Write-Behind.",
    keyConcepts: ["caching", "write-through", "write-behind", "cache-aside", "database"]
  },
  {
    q: "What is the average time complexity of searching, inserting, and deleting a key in a well-balanced Hash Table, and what causes worst-case O(N) degradation?",
    cat: "Data Structures & Big-O Complexity",
    skills: ["Hash Tables", "Big-O Notation", "Hash Collisions", "Algorithm Analysis"],
    options: [
      "Average is O(log N); worst case is O(N^2) caused by memory allocation failures.",
      "Average is O(1) constant time; worst case is O(N) linear time caused by excessive hash collisions clustering into the same bucket (e.g. hash flooding or poor hash function).",
      "Average is O(N); worst case is O(1) when using separate chaining.",
      "Average is O(N log N); worst case is O(2^N) when array resizing occurs."
    ],
    correctOptionIndex: 1,
    explanation: "Option B is correct. Under a uniform hash distribution, calculating the hash and indexing into the bucket array takes O(1) constant time for search, insert, and delete. However, if multiple distinct keys produce the same hash code (hash collisions), they chain into a linked list or bucket. In the pathological worst-case (or under a deliberate HashDoS collision attack), all N keys hash to the exact same bucket, degrading lookup to a linear O(N) sequential search through the collision chain.",
    hints: "Average is constant time; worst case is when all keys collide into a single bucket.",
    criteria: "States average O(1) and explains O(N) degradation due to hash collisions.",
    keyConcepts: ["hash table", "big-o", "O(1)", "O(N)", "hash collision"]
  }
];
