"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { subscriptionApi } from "@/lib/api/subscription";
import { toast } from "sonner";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const reference = searchParams.get("reference");
    
    if (!reference) {
      setProcessing(false);
      return;
    }

    // Verify the payment with the backend
    subscriptionApi.verifyPayment(reference)
      .then(() => {
        setVerified(true);
        toast.success("Payment verified! Your subscription has been upgraded.");
      })
      .catch((error) => {
        console.error("Payment verification failed:", error);
        toast.error("Payment verification failed. Please contact support.");
      })
      .finally(() => {
        setProcessing(false);
      });
  }, [searchParams]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {processing ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <CardTitle>Verifying Payment...</CardTitle>
                <CardDescription>
                  Please wait while we confirm your payment with Paystack.
                </CardDescription>
              </>
            ) : verified ? (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <CardTitle>Payment Successful!</CardTitle>
                <CardDescription>
                  Your subscription has been upgraded. You can now enjoy all the premium features.
                </CardDescription>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <CardTitle>Payment Verification Failed</CardTitle>
                <CardDescription>
                  We couldn't verify your payment. Please contact support if you were charged.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push("/subscription")}
            >
              {verified ? "View Subscription" : "Back to Subscription"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
