import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      expiresAt: null,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile: {
        include: { skills: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      expiresAt: null,
    });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      fullName: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
    expiresAt,
  });
}
