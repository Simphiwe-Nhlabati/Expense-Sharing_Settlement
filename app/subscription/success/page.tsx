"use client";

import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function SubscriptionSuccessPage() {
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
              Subscription payments are not available yet. 
              We&apos;re working on bringing you premium features soon!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push("/subscription")}
            >
              Back to Subscription
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
