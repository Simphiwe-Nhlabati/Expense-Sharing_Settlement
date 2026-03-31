import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import app from "@/server/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001"
const IS_PRODUCTION = process.env.NODE_ENV === "production"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in and try again." },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (IS_PRODUCTION) {
      // Production: Use Hono app directly (serverless)
      const honoRequest = new Request(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })

      const response = await app.fetch(honoRequest)
      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json(
          { error: data.error || "Failed to create group" },
          { status: response.status }
        )
      }

      return NextResponse.json({ success: true, data })
    } else {
      // Development: Forward to standalone backend server
      const backendResponse = await fetch(`${BACKEND_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })

      const data = await backendResponse.json()

      if (!backendResponse.ok) {
        return NextResponse.json(
          { error: data.error || "Failed to create group" },
          { status: backendResponse.status }
        )
      }

      return NextResponse.json({ success: true, data })
    }
  } catch (error) {
    console.error("[API GROUPS CREATE] Error:", error)
    return NextResponse.json(
      { error: "Failed to create group. Please try again." },
      { status: 500 }
    )
  }
}
