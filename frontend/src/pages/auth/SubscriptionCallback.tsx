import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useUser } from "@/hooks/useUser";
import { useTeam } from "@/hooks/useTeam";

export const SubscriptionCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { fetchUserProfile } = useUser();
  const { fetchAllTeamData } = useTeam();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Get message and type from URL query params
        const message = searchParams.get("message");
        const type = searchParams.get("type") || "user"; // "user" or "team"
        
        // Determine redirect path based on type
        const redirectPath = type === "team" ? "/client/teams" : "/client/billing";
        
        if (message === "success") {
          // Show success toast
          showToast(
            type === "team" 
              ? "Payment successful! Team member subscription is now active." 
              : "Payment successful! Your subscription is now active.",
            "success"
          );
          
          // Refresh data based on type
          try {
            if (type === "team") {
              await fetchAllTeamData();
            } else {
              await fetchUserProfile();
            }
          } catch (fetchError) {
            console.error("Error fetching data:", fetchError);
            // Continue even if fetch fails
          }
          
          // Small delay to ensure toast is visible, then redirect
          setTimeout(() => {
            navigate(redirectPath, { replace: true });
          }, 1500);
        } else {
          // Payment failed or no message
          if (message && message !== "success") {
            setError("Payment failed. Please try again.");
            showToast("Payment failed. Please try again.", "error");
          } else {
            // No message parameter, just redirect
            navigate(redirectPath, { replace: true });
            return;
          }
          
          // Redirect after showing error
          setTimeout(() => {
            navigate(redirectPath, { replace: true });
          }, 2000);
        }
      } catch (err) {
        console.error("Subscription callback error:", err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : "Failed to process subscription callback. Please try again.";
        setError(errorMessage);
        showToast(errorMessage, "error");
        
        // Redirect to billing page on error
        setTimeout(() => {
          navigate("/client/billing", { replace: true });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            Processing Payment
          </CardTitle>
          <CardDescription>
            Please wait while we process your subscription...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          {error ? (
            <>
              <p className="text-destructive text-center">{error}</p>
              <p className="text-sm text-muted-foreground text-center">
                Redirecting to billing page...
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                {isProcessing 
                  ? "Processing your payment..." 
                  : "Redirecting..."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

