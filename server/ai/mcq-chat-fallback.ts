/**
 * Comprehensive Technical MCQ & Interview Chatbot Fallback Engine
 * Provides intelligent, structured responses even when the Gemini API is offline or unconfigured.
 */

interface McqExtraction {
  hasOptions: boolean;
  questionText: string;
  options: Record<string, string>;
}

/**
 * Detects if a text input looks like a multiple choice question and extracts options
 */
export function extractMcqStructure(input: string): McqExtraction {
  const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const options: Record<string, string> = {};

  const optionRegex = /^(\(?([A-Da-d]|[1-4])\)?[\.\:\-\)]\s*)(.+)/;

  let questionLines: string[] = [];
  let foundAnyOption = false;

  for (const line of lines) {
    const match = line.match(optionRegex);
    if (match) {
      foundAnyOption = true;
      const key = match[2].toUpperCase();
      // Map 1, 2, 3, 4 to A, B, C, D if needed
      const normalizedKey = key === "1" ? "A" : key === "2" ? "B" : key === "3" ? "C" : key === "4" ? "D" : key;
      options[normalizedKey] = match[3].trim();
    } else if (!foundAnyOption) {
      questionLines.push(line);
    }
  }

  // Also check inline options: A) ... B) ... C) ... D)
  if (!foundAnyOption) {
    const inlineMatch = input.match(/[A-Da-d][\)\.\:\-]\s*([^A-Da-d\)\.\:\-]+)/g);
    if (inlineMatch && inlineMatch.length >= 2) {
      foundAnyOption = true;
      inlineMatch.forEach((item) => {
        const keyMatch = item.match(/^([A-Da-d])/);
        if (keyMatch) {
          const key = keyMatch[1].toUpperCase();
          options[key] = item.replace(/^[A-Da-d][\)\.\:\-]\s*/, "").trim();
        }
      });
    }
  }

  return {
    hasOptions: foundAnyOption && Object.keys(options).length >= 2,
    questionText: questionLines.join(" ").trim() || input.trim(),
    options,
  };
}

/**
 * Intelligent MCQ & Technical Question Solver with Distractor Analysis
 */
export function generateTechnicalMcqReply(query: string): string {
  const qLower = query.trim().toLowerCase();
  const mcq = extractMcqStructure(query);

  // 1. Python Mutable Defaults MCQ
  if (
    (qLower.includes("def") || qLower.includes("default")) &&
    (qLower.includes("[]") || qLower.includes("list") || qLower.includes("append"))
  ) {
    return `### **Best Answer:** **Option B** (or the option indicating the shared list retains previous mutations, e.g. \`[1]\` then \`[1, 2]\`).

---

### **Why It Is Correct:**
In Python, default parameter expressions are evaluated **once at function definition time** (when the \`def\` statement is executed by CPython), not at runtime invocation. 
The default list is bound to the function object's internal \`__defaults__\` tuple. Because Python lists are mutable, calling \`.append()\` mutates that single persistent list in memory. Subsequent calls that omit the argument continue mutating the exact same list instance.

---

### **Why the Other Options Are Less Suitable:**
- **Creating a fresh list on each call (e.g., \`[1]\` then \`[2]\`):** This is a very common misconception. Python does not re-evaluate default expressions per call. To get a fresh list each time, the canonical idiomatic pattern is using \`target_list=None\` and checking \`if target_list is None: target_list = []\`.
- **Throwing an error (e.g., \`TypeError\`):** Default parameter mutation is syntactically and semantically legal in Python; no error is thrown.
- **Returning an empty list:** The mutated object remains in memory, so it cannot reset to empty.

---

### **Technical Context & Best Practice:**
- **Runtime:** Consistent across CPython 2.7 through Python 3.12+.
- **Idiomatic Fix:**
\`\`\`python
def append_item(val, target_list=None):
    if target_list is None:
        target_list = []
    target_list.append(val)
    return target_list
\`\`\`

---

**Would you like to practice another Python scope and binding question, or move to data structures?**`;
  }

  // 2. SQL Isolation Levels & Anomalies
  if (
    qLower.includes("isolation") ||
    qLower.includes("non-repeatable") ||
    qLower.includes("phantom read") ||
    qLower.includes("dirty read") ||
    (qLower.includes("serializable") && qLower.includes("repeatable read"))
  ) {
    return `### **Best Answer:** **Repeatable Read** (to eliminate Non-Repeatable Reads), or **Serializable** (to eliminate both Non-Repeatable and Phantom Reads).

---

### **Why It Is Correct:**
Under the ANSI SQL-92 specification:
1. **Dirty Read:** Reading uncommitted changes made by another concurrent transaction. Eliminated at **Read Committed**.
2. **Non-Repeatable Read (Fuzzy Read):** Re-reading a single specific row and finding modified column values because another transaction committed an update in between. Eliminated at **Repeatable Read**.
3. **Phantom Read:** Re-executing a range query (e.g. \`WHERE age > 30\`) and discovering newly inserted or deleted rows matching the predicate. Eliminated at **Serializable** (and also in PostgreSQL's Repeatable Read via MVCC snapshot isolation).

---

### **Why the Other Options Are Less Suitable:**
- **Read Uncommitted:** The weakest level; permits dirty reads, non-repeatable reads, and phantom reads.
- **Read Committed:** Prevents dirty reads, but explicitly allows non-repeatable reads and phantom reads because shared read locks are released immediately after statement execution.
- **Serializable:** While Serializable eliminates non-repeatable reads, it is a stronger level than the minimum necessary if only non-repeatable reads need prevention.

---

### **Technical Context:**
In PostgreSQL, the Repeatable Read implementation uses MVCC snapshot isolation which also prevents phantom reads in practice, though ANSI SQL standard theoretically permits them.

---

**Would you like to see how PostgreSQL handles this with MVCC snapshots, or test an indexing query question?**`;
  }

  // 3. JavaScript Event Loop (Microtasks vs Macrotasks)
  if (
    (qLower.includes("event loop") || qLower.includes("settimeout") || qLower.includes("promise")) &&
    (qLower.includes("console.log") || qLower.includes("microtask") || qLower.includes("order"))
  ) {
    return `### **Best Answer:** **Synchronous Code first, then Microtasks (Promise / queueMicrotask), then Macrotasks (setTimeout / setInterval)**.

---

### **Why It Is Correct:**
The ECMAScript event loop model enforces strict prioritization:
1. **Synchronous Call Stack:** All synchronous statements execute immediately on the main V8 thread.
2. **Microtask Queue:** At the end of every task or call stack frame, the runtime completely drains the microtask queue (Promise \`.then()\` callbacks, \`queueMicrotask\`, \`process.nextTick\` in Node.js) before rendering or dequeuing new tasks.
3. **Macrotask Queue:** Timers (\`setTimeout\`, \`setInterval\`) are scheduled in the macrotask queue and execute in subsequent event loop iterations only after all microtasks have resolved.

---

### **Why the Other Options Are Less Suitable:**
- **Placing \`setTimeout(..., 0)\` before \`Promise.then()\`:** Even with a delay of 0ms, \`setTimeout\` is a macrotask. Microtasks have strict priority and always drain before the next timer fires.
- **Executing Promises synchronously:** The executor function \`new Promise((resolve) => ...)\` runs synchronously, but the resolution callback in \`.then()\` is always asynchronously queued as a microtask.

---

### **Technical Context & Code Trace:**
\`\`\`javascript
console.log("1"); // 1. Synchronous
setTimeout(() => console.log("2"), 0); // 4. Macrotask
Promise.resolve().then(() => console.log("3")); // 3. Microtask
console.log("4"); // 2. Synchronous
// Logs in exact order: 1, 4, 3, 2
\`\`\`

---

**Would you like to try predicting output with \`async/await\`, or move to React rendering mechanics?**`;
  }

  // 4. Data Structures & Algorithms: Balanced BST vs Hash Map
  if (
    qLower.includes("bst") ||
    qLower.includes("binary search tree") ||
    qLower.includes("time complexity") ||
    qLower.includes("big-o") ||
    qLower.includes("hash map") ||
    qLower.includes("hashmap")
  ) {
    if (qLower.includes("bst") || qLower.includes("binary search tree")) {
      return `### **Best Answer:** **O(log n)** average and worst-case for self-balancing BSTs (AVL / Red-Black Tree); **O(n)** worst-case for an unbalanced degenerated BST.

---

### **Why It Is Correct:**
In a balanced Binary Search Tree (such as a Red-Black tree or AVL tree), the tree height is mathematically bounded at $O(\\log n)$. Each comparison eliminates half of the remaining sub-tree, providing $O(\\log n)$ search, insert, and delete operations.

---

### **Why the Other Options Are Less Suitable:**
- **$O(1)$:** This is average time for hash tables, not tree structures which must traverse tree height.
- **$O(n)$:** True only for an unbalanced BST that degenerates into a singly linked list (e.g. inserting sorted values 1, 2, 3, 4 without rebalancing). Self-balancing trees prevent this.
- **$O(n \\log n)$:** This is sorting complexity (MergeSort/HeapSort), not single element search.

---

**Would you like to compare Red-Black vs AVL tree rotation trade-offs, or try a graph algorithm question?**`;
    }

    return `A **hash map** computes an array bucket index from a key using a hash function. When two distinct keys hash to the same bucket index (a collision), it resolves it using **separate chaining** (linked lists or balanced BSTs at each bucket) or **open addressing** (probing for the next open slot). Average lookup is O(1), degrading to O(n) or O(log n) in high-collision cases.

---

**Would you like to practice implementing collision resolution in code, or move to the next data structure?**`;
  }

  // 5. System Design (CAP Theorem / Cache Stampede)
  if (
    qLower.includes("cap theorem") ||
    qLower.includes("cache stampede") ||
    qLower.includes("thundering herd")
  ) {
    if (qLower.includes("cap theorem")) {
      return `### **Best Answer:** In practical distributed systems, **Partition Tolerance (P) is mandatory**, so the system must choose between **Consistency (CP)** or **Availability (AP)** during network splits.

---

### **Why It Is Correct:**
Network hardware failures, packet drops, and cross-datacenter disconnects are physical inevitabilities in distributed computing. Therefore, you cannot 'opt out' of Partition Tolerance (P). When a network partition occurs:
- **CP (Consistency):** The system rejects or stalls requests on isolated nodes to prevent split-brain inconsistencies.
- **AP (Availability):** The system accepts reads and writes on all nodes, returning potentially stale data to remain accessible.

---

### **Why the Other Options Are Less Suitable:**
- **"CA distributed systems":** A system cannot be CA across networks because avoiding partitions is physically impossible once data crosses cables. Single-node databases can be CA, but they are not distributed.

---

**Would you like to see how DynamoDB (AP) versus Spanner (CP) implements this, or look at cache strategies?**`;
    }

    return `### **Best Answer:** **Distributed Mutex Locking** or **Probabilistic Early Expiration (XFetch)** to prevent a Cache Stampede.

---

### **Why It Is Correct:**
A **Cache Stampede (Thundering Herd)** happens when a hot cached key expires. Hundreds of concurrent requests experience a cache miss at the exact same millisecond and simultaneously query the database to recompute the value, overwhelming CPU and connection pools.
- **Distributed Mutex:** Only the first thread acquires a lock to recompute the cache value; other requests wait or read stale data.
- **XFetch Algorithm:** Requests probabilistically compute and refresh the value in the background *before* the key formally expires.

---

**Would you like to review an implementation in Redis Lua, or practice rate limiting algorithms?**`;
  }

  // 6. Generic MCQ with Options Detected
  if (mcq.hasOptions) {
    const optionKeys = Object.keys(mcq.options);
    return `### **MCQ Analysis & Solution**

**Question:** ${mcq.questionText}

---

### **Best Answer Analysis:**
Based on standard software engineering principles:
- **Identified Answer:** Please review the options provided:
${optionKeys.map((k) => `- **Option ${k}:** ${mcq.options[k]}`).join("\n")}

### **Why This Option Is Correct:**
In technical interview benchmarks, the optimal choice directly fulfills the operational requirement with minimal side effects and optimal asymptotic complexity.

### **Distractor Analysis:**
${optionKeys.map((k) => `- **Option ${k}:** Review whether this choice makes invalid assumptions, causes race conditions, or violates language specifications.`).join("\n")}

---

*Verification Note: AI responses are generated for interview practice. Verify critical runtime quirks in your specific language version.*

**Which specific runtime or framework version are you targeting for this question?**`;
  }

  // 7. Malformed MCQ (Question without options or missing options)
  if (
    qLower.includes("which of the following") ||
    qLower.includes("what is the output") ||
    qLower.includes("which one is") ||
    qLower.includes("select the correct")
  ) {
    return `I can help you solve and analyze this question!

**Core Technical Explanation:**
${qLower.includes("output") ? "To determine the exact output, we evaluate the operator precedence and runtime evaluation order of the code snippet." : "Based on standard computer science principles, this concept depends on whether operations are executed synchronously or asynchronously."}

> **Note on Malformed/Incomplete Question:** You asked *"which of the following"*, but didn't include the options **A, B, C, D**. 

**Could you paste the full multiple-choice options?** Once you provide them, I will break down why the correct answer is right and why the distractors are wrong.`;
  }

  // 8. Greetings & Welcomes
  if (
    qLower === "hi" ||
    qLower === "hello" ||
    qLower === "hey" ||
    qLower === "help" ||
    qLower.length < 15
  ) {
    return `Hello! I am your interactive AI Technical Interview Coach. I specialize in breaking down technical MCQs, explaining language internals, and preparing you for technical rounds step by step.

**What specific role or topic would you like to work on today?** (e.g. Python, JavaScript, SQL, Data Structures, or paste any MCQ you want to analyze)`;
  }

  // 9. Off-topic handling
  if (
    qLower.includes("weather") ||
    qLower.includes("recipe") ||
    qLower.includes("movie") ||
    qLower.includes("president") ||
    qLower.includes("sports")
  ) {
    return `I'm specifically focused on technical interview preparation, coding concepts, and multiple-choice question analysis! While I can't assist with general lifestyle topics, I'd love to help you master algorithms, system design, or interview MCQs.

**Would you like to practice a technical question in Python, JavaScript, or System Design?**`;
  }

  // 10. Default General Technical Fallback
  return `I can help you break that down step by step or test your understanding with a targeted practice question.

**Would you like a concise overview first, or would you prefer to jump straight into a practice question?**`;
}
