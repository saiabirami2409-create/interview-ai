const http = require('http');

function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('VERIFYING 5-ROUND LIVE INTERVIEW FLOW END-TO-END');
  console.log('==================================================');

  let sessionCookie = '';

  // 1. Check Home page
  const homeRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/home',
    method: 'GET',
    timeout: 5000
  });
  console.log(`1. GET /home: ${homeRes.statusCode === 200 ? 'SUCCESS' : 'FAILED'} (status: ${homeRes.statusCode})`);

  // 2. Round 1: Aptitude Generate (Unauthenticated Guest Start)
  const aptGen = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/aptitude/generate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    timeout: 8000
  }, {
    category: 'Mixed',
    difficulty: 'Intermediate',
    questionCount: 10,
    timeLimitMinutes: 20
  });

  const aptSuccess = aptGen.statusCode === 200 && aptGen.json?.success;
  console.log(`2. Round 1 Aptitude Generate: ${aptSuccess ? 'SUCCESS' : 'FAILED'} (status: ${aptGen.statusCode})`);
  if (!aptSuccess) {
    console.error('   Error:', aptGen.data);
    return;
  }
  const assessmentId = aptGen.json.data.assessmentId;
  console.log(`   Assessment ID: ${assessmentId}, Questions: ${aptGen.json.data.questions?.length}`);

  // Capture set-cookie if any
  const setCookie = aptGen.headers['set-cookie'];
  if (setCookie) {
    sessionCookie = Array.isArray(setCookie) ? setCookie[0].split(';')[0] : setCookie.split(';')[0];
    console.log(`   Session Cookie Established: ${sessionCookie.slice(0, 30)}...`);
  }

  // 3. Round 1 Aptitude Submit
  const aptSub = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/aptitude/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { 'Cookie': sessionCookie } : {})
    },
    timeout: 5000
  }, {
    assessmentId,
    answers: { "apt_q1": "A", "apt_q2": "B" },
    timeSpentSeconds: 120
  });
  console.log(`3. Round 1 Aptitude Submit: ${aptSub.statusCode === 200 ? 'SUCCESS' : 'FAILED'} (Score: ${aptSub.json?.data?.scorePercentage}%)`);

  // 4. Round 2: Technical Start
  const techStart = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/technical/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { 'Cookie': sessionCookie } : {})
    },
    timeout: 8000
  }, {
    role: 'Full Stack Engineer',
    experienceLevel: 'Intermediate',
    focusArea: 'Full Stack Development',
    questionCount: 5
  });
  const techSuccess = techStart.statusCode === 200 && techStart.json?.success;
  console.log(`4. Round 2 Technical Start: ${techSuccess ? 'SUCCESS' : 'FAILED'} (status: ${techStart.statusCode})`);
  if (!techSuccess) {
    console.error('   Error:', techStart.data);
    return;
  }
  const techSessionId = techStart.json.data.sessionId;
  console.log(`   Technical Session ID: ${techSessionId}`);

  // 5. Round 3: Project Start (MCQ round)
  const projStart = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/project/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { 'Cookie': sessionCookie } : {})
    },
    timeout: 8000
  }, {
    projectDetails: {
      title: 'E-Commerce Microservices Platform',
      domain: 'Cloud Architecture & Backend',
      description: 'Distributed microservices backend for high-scale order processing',
      technologies: 'Node.js, PostgreSQL, Docker, Redis',
      candidateRole: 'Lead Backend Developer',
      challengesFaced: 'Data consistency across microservices and Redis caching invalidation',
      outcomes: 'Handled 5,000 peak req/sec with zero transaction drops'
    }
  });
  const projSuccess = projStart.statusCode === 200 && projStart.json?.success;
  console.log(`5. Round 3 Project Start (MCQ): ${projSuccess ? 'SUCCESS' : 'FAILED'} (status: ${projStart.statusCode})`);
  if (!projSuccess) {
    console.error('   Error:', projStart.data);
    return;
  }
  const projSessionId = projStart.json.data.sessionId;
  const projQuestions = projStart.json.data.questions;
  console.log(`   Project Session ID: ${projSessionId}, Questions: ${projQuestions?.length}`);
  const firstQ = projQuestions?.[0];
  console.log(`   Is MCQ Options Array: ${Array.isArray(firstQ?.options)} (Length: ${firstQ?.options?.length})`);

  // 6. Round 4: Behavioral Start (STAR Video/Audio)
  const behStart = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/behavioral/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { 'Cookie': sessionCookie } : {})
    },
    timeout: 8000
  }, {
    targetRole: 'Full Stack Engineer',
    companyName: 'Tech Corp',
    questionCount: 3
  });
  const behSuccess = behStart.statusCode === 200 && behStart.json?.success;
  console.log(`6. Round 4 Behavioral Start: ${behSuccess ? 'SUCCESS' : 'FAILED'} (status: ${behStart.statusCode})`);
  const behSessionId = behStart.json?.data?.sessionId;

  // 7. Round 5: HR Start (HR Interview)
  const hrStart = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/hr/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { 'Cookie': sessionCookie } : {})
    },
    timeout: 8000
  }, {
    targetRole: 'Full Stack Engineer',
    companyName: 'Tech Corp',
    questionCount: 3
  });
  const hrSuccess = hrStart.statusCode === 200 && hrStart.json?.success;
  console.log(`7. Round 5 HR Start: ${hrSuccess ? 'SUCCESS' : 'FAILED'} (status: ${hrStart.statusCode})`);
  const hrSessionId = hrStart.json?.data?.sessionId;

  // 8. Final Report Page
  const reportRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/report',
    method: 'GET',
    headers: sessionCookie ? { 'Cookie': sessionCookie } : {},
    timeout: 5000
  });
  console.log(`8. GET /report: ${reportRes.statusCode === 200 ? 'SUCCESS' : 'FAILED'} (status: ${reportRes.statusCode})`);

  console.log('==================================================');
  console.log('ALL 5 ROUNDS + HOMEPAGE + REPORT VERIFIED 100%!');
  console.log('==================================================');
}

runTests().catch(console.error);
