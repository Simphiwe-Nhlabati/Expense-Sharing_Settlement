import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    })

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    )
  }
}
