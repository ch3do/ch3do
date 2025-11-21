import { NextRequest, NextResponse } from "next/server"
import { login, setSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    const user = await login(username, password)

    if (!user) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    await setSession(user.id)

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name } })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
