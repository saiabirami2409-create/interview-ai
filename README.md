# InterviewAI — AI-Powered Mock Interview & Performance Evaluation Platform

> **Tagline:** Practice Smarter. Interview Better. Get Hired.  
> **Target Audience:** College placement candidates, fresh graduates, job seekers, and career changers.  
> **Platform Version:** 1.0.0 Production-Ready Architecture

---

## 1. Product Overview

**InterviewAI** is a venture-grade, AI-powered mock interview and performance evaluation SaaS platform engineered to replicate the rigor, cadence, and nuanced scrutiny of tier-1 corporate and technology hiring loops.

### Complete Five-Round Sequential Interview Architecture:
InterviewAI guides candidates through 5 sequential assessment rounds in strict, standardized order:
1. **Round 1 — Aptitude Round (`/aptitude/questions`)**:
   - Quantitative Aptitude, Logical Reasoning, and Verbal Ability MCQs.
   - Immediate verification with formulas, step-by-step arithmetic derivations, and speed-test shortcuts.
2. **Round 2 — Technical Assessment (`/technical/questions`)**:
   - Role-specific computer science MCQs, programming language internals, runtime complexity, and debugging scenarios.
   - Autosaved options with progress indicators and timed review.
3. **Round 3 — Project-Based Interview (`/project/interview`)**:
   - AI-generated multiple-choice questions grounded directly in the candidate's projects, architecture, and tech stack.
   - **Strictly MCQs only**: Answer selections with clear visual states and zero camera or microphone activation.
4. **Round 4 — Behavioral Interview (`/behavioral/meeting`)**:
   - Evaluated against the **STAR Method** (Situation, Task, Action, Result).
   - **Video and Audio Recording**: Permissions requested strictly upon entering Round 4; includes start, stop, replay controls, permission-denied fallbacks, and a "Continue without recording" bypass. Camera/microphone are never triggered in other rounds.
5. **Round 5 — HR Round (`/hr/meeting`)**:
   - Cultural alignment, career trajectory, strengths/weaknesses, and compensation communication.
6. **Unified Performance Report (`/report`)**:
   - Equal-weight arithmetic mean across completed rounds, Recharts competency radars, actionable recommendations, and PDF/print export.

---

## 2. Floating AI Assistant (InterviewAI Assistant)

InterviewAI includes a premium, movable floating assistant accessible across the site and inside active interview rooms:

### Key Chatbot Capabilities:
- **Smart Intent Routing**: Automatically classifies candidate input when taking an active interview:
  - `ANSWER_INTERVIEW_QUESTION`: User provides an MCQ option (e.g. "Option B") or substantive answer -> automatically captured and submitted to the active round.
  - `SIDE_QUESTION`: User asks for a concept, term, or definition (e.g., "What does ACID mean?", "Explain idempotency") -> thoroughly answered without altering interview state, followed by a clear return prompt to the exact pending question.
  - `CLARIFY_QUESTION`: User asks what the question is looking for -> explained without spoiling the correct answer key, repeating the question.
  - `AMBIGUOUS`: Asks 1 short clarification question without guessing.
- **Adaptive Explanation Depth**:
  - *Basic*: Direct definition + intuitive real-world analogy.
  - *Intermediate*: Architectural concept + practical code/framework example.
  - *Complex*: System design, scalability trade-offs, concurrency models, and edge-case implications.
- **Google Gemini API Integration**:
  - Powered by `@google/genai` (SDK 2.30.0) with model `gemini-2.5-flash`.
  - Google Search Grounding: Live web grounding with verifiable source links and citation pills when available.
  - Strict Server-Side Security: `GEMINI_API_KEY` is read strictly on the server (API route `/api/chatbot/message`). Never exposed to browser or client code.
  - Free-Tier Limits: Google AI Studio free tier supports 15 RPM (Requests Per Minute), 1,000,000 TPM, and 1,500 RPD.
  - Deterministic Offline Coach Fallback: If `GEMINI_API_KEY` is not provided or rate-limited, InterviewAI automatically switches to its comprehensive local offline coach with zero disruption.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | High-performance React Server Components (RSC) and Client Components. |
| **Language** | **TypeScript (Strict Mode)** | Strict static type checking across database models, APIs, and UI state. |
| **Styling** | **Tailwind CSS + Radix UI** | Accessible UI primitives styled with custom tokens and dark/light themes. |
| **3D Graphics** | **Three.js + Canvas** | Hero 3D Intelligence Core with WebGL detection and 60fps SVG fallback. |
| **Data Visualization** | **Recharts** | Interactive SVG-based 5-axis competency radars, trend areas, and bar charts. |
| **Database & ORM** | **Prisma ORM + SQLite / PostgreSQL** | Relational data integrity, cascade rules, and compound query indexing. |
| **Authentication** | **Custom JWT Engine + bcryptjs** | Secure HTTP-only cookies, password hashing, and BOLA/IDOR route guards. |
| **AI Intelligence** | **Multi-Provider Architecture** | Google Gemini API (`@google/genai`) + Deterministic High-Fidelity Demo Provider. |

---

## 3. Key Pages & Routes

### Public Marketing Surface:
- `/` — Premium Landing Page (Hero 3D Core, Problem/Solution, Features, How It Works, Round Types, Testimonials, Pricing, FAQ)
- `/features` — Detailed breakdown of question generation, rubrics, and analytics
- `/how-it-works` — Interactive 4-step preparation methodology
- `/pricing` — 3-tier transparent pricing table (Free ₹0, Pro ₹499, Career Plus ₹999) with demo checkout
- `/faq` — Searchable knowledge base addressing scoring rubrics and resume privacy
- `/contact` — Validated contact and institutional inquiry form
- `/privacy` — Production-grade data protection, resume encryption, and retention policy
- `/terms` — Terms of service with educational non-guarantee disclaimers
- `/accessibility` — WCAG 2.2 Level AA accessibility compliance statement

### Authentication Surface:
- `/login` — Student sign-in with 1-click **"Fill Demo Account"** button
- `/signup` — Student registration with target role pre-selection
- `/forgot-password` — Tokenized password recovery flow simulation
- `/onboarding` — Multi-step profile wizard (academic details, skills, target companies)

### Student Portal Surface (Authenticated):
- `/dashboard` — Overview with practice scores, weekly activity, score trend, and recent sessions
- `/dashboard/setup-interview` — 7-step configuration wizard (Role, Resume, JD, Round, Difficulty, Questions, Review)
- `/dashboard/interview/[sessionId]` — Distraction-free interview room with AI visualizer, timer, and autosave
- `/dashboard/report/[sessionId]` — Multi-axis evaluation report with Recharts radar, question review, and model answers
- `/dashboard/resume` — Resume Center with drag-and-drop PDF upload and automatic skill extraction
- `/dashboard/history` — Searchable, filterable archive of all previous interview loops
- `/dashboard/analytics` — Longitudinal competency tracking, score trajectory, and skill gap visualization
- `/dashboard/topics` — Weak topic practice curriculum with 1-click drill launcher
- `/dashboard/profile` — Student academic credentials and technical skills manager
- `/dashboard/settings` — Appearance preferences (dark/light), notifications, and data purging

---

## 4. Quickstart & Local Setup Guide

### Prerequisites:
- Node.js `v20.x` or higher
- npm `v10.x` or higher

### Step 1: Install Dependencies
```bash
cd interviewai
npm install --legacy-peer-deps
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` contents:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="interviewai-dev-jwt-secret-key-32chars-minimum-needed!"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="" # Optional: Deterministic Demo Provider works 100% offline out-of-the-box
NODE_ENV="development"
```

### Step 3: Initialize Database & Seed Demo Data
```bash
npx prisma db push
npm run db:seed
```
This populates the database with:
- Demo student: **Aarya Kumar** (`aarya.kumar@example.com` / `Password123!`)
- Role: Full-Stack Developer
- Pre-completed technical mock interview with detailed evaluations and radar analytics
- Preparation topics and mastery progress

### Step 4: Run Test Suites
```bash
npm test
```
Executes rubric scoring unit tests and authentication/parser verification.

### Step 5: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Build for Production
```bash
npm run build
npm start
```

---

## 5. Pre-Seeded Demo Account

For rapid evaluation and demonstration without manual registration:
- **Email:** `aarya.kumar@example.com`
- **Password:** `Password123!`
- *(Tip: Click the **"Fill Demo Account"** button on the `/login` page to auto-fill credentials instantly!)*

---

## 6. AI Provider Architecture & Scoring Rubrics

### Universal Provider Interface
InterviewAI connects through `server/ai/types.ts`:
- **Google Gemini Provider (`server/ai/gemini-provider.ts`):** Uses `@google/genai` with structured JSON schema outputs when `GEMINI_API_KEY` is configured.
- **Deterministic High-Fidelity Demo Provider (`server/ai/demo-provider.ts`):** Works offline with zero paid API keys. Employs natural language heuristics, vocabulary density analysis, and STAR structural detection to calculate realistic, reproducible 0–100 rubric scores.

### 5-Axis Rubric Weighting:
| Dimension | Technical Round | Behavioral (STAR) | HR Round |
| :--- | :--- | :--- | :--- |
| **Relevance** | 20% | 20% | 25% |
| **Technical Correctness** | 35% | 15% | 10% |
| **Completeness & Depth**| 20% | 20% | 20% |
| **Communication Quality**| 15% | 30% | 35% |
| **Logical Reasoning** | 10% | 15% | 10% |

---

## 7. Security, Privacy & Responsible AI

1. **Zero-Leak BOLA / IDOR Protection:** Every route handler and server action enforces `userId === session.user.id`. Students cannot inspect or tamper with another candidate's sessions or transcripts.
2. **Prompt Injection Neutralization:** Resumes and job descriptions are stripped of malicious prompt delimiters and isolated within strict markdown tags.
3. **Data Sovereignty:** Resumes and interview transcripts can be permanently deleted with a single click from dashboard settings.
4. **Educational Transparency:** Explicit disclaimers clarify that readiness scores are practice estimates and do not guarantee employment offers.

---

## 8. License & Attribution

InterviewAI is engineered for campus placement preparation and technical career mobility. Built with Next.js, Tailwind CSS, Prisma, and Three.js.
#   i n t e r v i e w - a i  
 #   i n t e r v i e w - a i  
 "# interview-ai" 
