import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "interviewai-default-fallback-dev-jwt-secret-min32chars";
const COOKIE_NAME = "interviewai_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = signSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
