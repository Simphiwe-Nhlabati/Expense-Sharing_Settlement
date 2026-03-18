import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/groups`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch groups" },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    )
  }
}
