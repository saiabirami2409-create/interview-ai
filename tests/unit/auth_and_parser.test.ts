import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../../server/auth/session";
import { extractSkillsFromText } from "../../server/resume/parser";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function run() {
  console.log("Running Unit Tests: Authentication & Resume Parser...");

  // 1. Password Hash & Verify
  const plain = "StudentSecret123!";
  const hash = await hashPassword(plain);
  assert(hash !== plain, "Hash must not equal plain password");
  assert(hash.startsWith("$2"), "Hash must be valid bcrypt format");

  const valid = await verifyPassword(plain, hash);
  assert(valid === true, "Password verification must succeed for correct password");

  const invalid = await verifyPassword("WrongPassword", hash);
  assert(invalid === false, "Password verification must fail for incorrect password");

  // 2. JWT Session Token
  const testUser = {
    id: "user_test_123",
    email: "test.student@college.edu",
    name: "Test Candidate",
    role: "STUDENT",
  };
  const token = signSessionToken(testUser);
  assert(typeof token === "string" && token.length > 20, "JWT token must be a non-empty string");

  const decoded = verifySessionToken(token);
  assert(decoded !== null, "Decoded token must not be null");
  assert(decoded?.id === testUser.id, "Decoded user ID must match");
  assert(decoded?.email === testUser.email, "Decoded email must match");

  const badToken = verifySessionToken("invalid.jwt.token");
  assert(badToken === null, "Malformed token must return null");

  // 3. Resume Skill Extraction
  const sampleResume = `
    Aarya Kumar - Software Engineering Student
    Proficient in TypeScript, React, Next.js, and Node.js.
    Experience working with PostgreSQL databases and Docker containers.
    Built scalable REST APIs and implemented Redis caching.
  `;
  const skills = extractSkillsFromText(sampleResume);
  assert(skills.includes("TypeScript"), "Must extract TypeScript");
  assert(skills.includes("React"), "Must extract React");
  assert(skills.includes("PostgreSQL"), "Must extract PostgreSQL");
  assert(skills.includes("Docker"), "Must extract Docker");
  assert(skills.includes("REST APIs"), "Must extract REST APIs");
  assert(!skills.includes("Ruby"), "Must not extract unmentioned skill (Ruby)");

  console.log("\nAll Auth and Parser Unit Tests Passed Successfully!");
}

run().catch((e) => {
  console.error("Test failure:", e);
  process.exit(1);
});
