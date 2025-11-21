import { cookies } from "next/headers"
import { prisma } from "./prisma"

const ADMIN_USER = {
  username: "admin",
  password: "admin",
}

export async function login(username: string, password: string) {
  if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
    let user = await prisma.user.findUnique({ where: { username: "admin" } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: "admin",
          password: "admin",
          name: "Admin",
        },
      })
    }
    return user
  }
  return null
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value
  if (!sessionId) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    })
    return user
  } catch {
    return null
  }
}

export async function setSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set("session", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
