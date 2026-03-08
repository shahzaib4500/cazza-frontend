import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

import { SettingsSidebar } from "@/components/SettingsSidebar";
import { useToast } from "@/components/ToastProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitSupportTicketService } from "@/services/supportService";
import { supportTicketSchema, type SupportTicketData } from "@/validators/support-validator";

// Map form category values to API category values
const categoryMap: Record<string, string> = {
  technical: "TECHNICAL_ISSUE",
  billing: "BILLING_QUESTION",
  feature: "FEATURE_REQUEST",
  integration: "INTEGRATION_ISSUE",
  other: "OTHER"
};

// Map form priority values to API priority values
const priorityMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "URGENT"> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  urgent: "URGENT"
};

export const SupportSettings = () => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<SupportTicketData>({
    resolver: zodResolver(supportTicketSchema),
    mode: "onBlur",
    defaultValues: {
      subject: "",
      priority: "",
      category: "",
      description: ""
    }
  });

  const onSubmit = async (data: SupportTicketData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        subject: data.subject.trim(),
        priority: priorityMap[data.priority] || "MEDIUM",
        category: categoryMap[data.category] || data.category,
        description: data.description.trim()
      };

      const response = await submitSupportTicketService(payload);

      if (response && response.success) {
        showToast(response.message || "Support ticket submitted successfully", "success");
        reset();
      } else {
        showToast(response.message || "Failed to submit support ticket", "error");
      }
    } catch (error: unknown) {
      console.error("Submit support ticket error:", error);
      if (error instanceof AxiosError) {
        let errorMessage =
          error.response?.data?.message || error.response?.data?.error || "Failed to submit support ticket";

        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          const validationMessages = error.response.data.errors
            .map((err: any) => err.message || err.msg || err)
            .join(", ");
          errorMessage = validationMessages || errorMessage;
        }

        showToast(errorMessage, "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-hidden flex">
      <SettingsSidebar />
      <div className="flex-1 h-full overflow-y-auto">
        <div className="max-w-[1400px] w-full space-y-6 mx-auto my-4 px-6 md:px-8 lg:px-12 py-4 md:py-6">
          {/* Create Support Ticket */}
          <Card>
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
              <CardDescription>Submit a detailed support request for technical issues or questions</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      {...register("subject")}
                      aria-invalid={!!errors.subject}
                    />
                    {errors.subject && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.subject.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full" aria-invalid={!!errors.priority}>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.priority && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.priority.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing Question</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="integration">Integration Issue</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.category.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide detailed information about your issue..."
                    rows={6}
                    {...register("description")}
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.description.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Ticket"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
