"use client";

import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Subscription features are not available yet. 
              We&apos;re working on bringing you premium features soon!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => router.push("/subscription")}
            >
              View Plans
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push("/")}
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
