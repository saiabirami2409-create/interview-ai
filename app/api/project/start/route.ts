import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import { generateProjectQuestions, ProjectDetails } from "@/server/ai/project-service";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to start project round", 401);
  }

  try {
    const body = await req.json();
    const { projectDetails, fromSession } = body;

    if (!projectDetails || !projectDetails.title) {
      return apiError("INVALID_INPUT", "Project title and details are required", 400);
    }

    const details: ProjectDetails = {
      title: projectDetails.title,
      domain: projectDetails.domain || "Full-Stack Development",
      description: projectDetails.description || "Interactive software project",
      technologies: Array.isArray(projectDetails.technologies)
        ? projectDetails.technologies
        : typeof projectDetails.technologies === "string"
        ? projectDetails.technologies.split(",").map((s: string) => s.trim())
        : ["TypeScript", "React", "Node.js"],
      languages: projectDetails.languages || [],
      frameworks: projectDetails.frameworks || [],
      database: projectDetails.database || "PostgreSQL",
      candidateRole: projectDetails.candidateRole || "Full Stack Developer",
      challengesFaced: projectDetails.challengesFaced || "State management, performance tuning, and API latency",
      outcomes: projectDetails.outcomes || "Successfully deployed application with high responsiveness",
      isOngoingOrProposed: Boolean(projectDetails.isOngoingOrProposed),
    };

    const questions = await generateProjectQuestions(auth.user.id, details);

    const session = await prisma.projectInterview.create({
      data: {
        userId: auth.user.id,
        projectDetails: JSON.stringify(details),
        questions: JSON.stringify(questions),
        candidateAnswers: JSON.stringify({}),
        evaluations: JSON.stringify({}),
        score: 0,
        status: "IN_PROGRESS",
      },
    });

    return apiSuccess({
      sessionId: session.id,
      projectDetails: details,
      questions,
    });
  } catch (error: any) {
    console.error("Failed to start project interview:", error);
    return apiError("PROJECT_START_FAILED", error.message || "Failed to initialize project interview", 500);
  }
}
