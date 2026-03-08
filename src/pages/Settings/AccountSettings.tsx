import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Trash2, AlertCircle } from "lucide-react";
import React, { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { SettingsSidebar } from "@/components/SettingsSidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useauth } from "@/hooks/useauth";
import { useUser } from "@/hooks/useUser";
import {
  buildBusinessProfilePayload,
  fromApiEntityType,
  fromApiMarketplaces,
  fromApiRevenueBand,
  fromApiTools
} from "@/lib/businessProfileApiMap";
import { useUserStore } from "@/store/userStore";

const personalInfoSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .min(2, { message: "First name must be at least 2 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Only alphabets are allowed" }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name is required" })
    .min(2, { message: "Last name must be at least 2 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Only alphabets are allowed" })
});

const businessInfoSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(1, { message: "Business name is required" })
    .min(2, { message: "Business name must be at least 2 characters" })
    .max(100, { message: "Business name must not exceed 100 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Business name can only contain letters and spaces" })
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;
type BusinessInfoData = z.infer<typeof businessInfoSchema>;

export const AccountSettings = () => {
  const navigate = useNavigate();
  const {
    user,
    fetchUserProfile,
    updateUser,
    updateProfileImage,
    deleteProfileImage,
    updateBusinessProfile,
    deleteUser,
    isLoading
  } = useUser();
  const { user: storeUser } = useUserStore();
  const { logout } = useauth();

  // Use store user if available, otherwise use hook user
  const currentUser = storeUser || user;
  // User is a business client if they have a businessProfile
  const isClient = !!currentUser?.businessProfile;

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  // Form and saving state
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingMarketplaces, setSavingMarketplaces] = useState(false);
  const [savingTechStack, setSavingTechStack] = useState(false);

  const {
    register: registerPersonalInfo,
    handleSubmit: handleSubmitPersonalInfo,
    formState: { errors: personalInfoErrors },
    setValue: setPersonalInfoValue,
    watch: watchPersonalInfo
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: ""
    }
  });

  const {
    register: registerBusinessInfo,
    handleSubmit: handleSubmitBusinessInfo,
    formState: { errors: businessInfoErrors },
    setValue: setBusinessInfoValue,
    watch: watchBusinessInfo
  } = useForm<BusinessInfoData>({
    resolver: zodResolver(businessInfoSchema),
    mode: "onBlur",
    defaultValues: {
      businessName: ""
    }
  });

  type AccountFormData = {
    firstName: string;
    lastName: string;
    email: string;
    marketplaces: string[];
    accountingStack: {
      hasXero: boolean;
      multiCurrency: boolean;
      integrations: string[];
    };
    businessName?: string;
    entityType?: string;
    revenueBand?: string;
  };

  const [formData, setFormData] = useState<AccountFormData>({
    firstName: "",
    lastName: "",
    email: "",
    marketplaces: [],
    accountingStack: { hasXero: false, multiCurrency: false, integrations: [] },
    businessName: "",
    entityType: "",
    revenueBand: ""
  });

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser && !isLoading) {
        await fetchUserProfile();
      }
    };
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Populate form when user data is available
  useEffect(() => {
    if (currentUser) {
      const firstName = currentUser.firstName || "";
      const lastName = currentUser.lastName || "";

      // Populate form with user data
      setFormData({
        firstName: firstName,
        lastName: lastName,
        email: currentUser.email || "",
        marketplaces: fromApiMarketplaces(currentUser.businessProfile?.marketplaces || []),
        accountingStack: {
          hasXero: currentUser.businessProfile?.useXero || false,
          multiCurrency: currentUser.businessProfile?.useMultipleCurrencies || false,
          integrations: fromApiTools(currentUser.businessProfile?.tools || [])
        },
        businessName: currentUser.businessProfile?.businessName || "",
        entityType: fromApiEntityType(currentUser.businessProfile?.businessEntityType || ""),
        revenueBand: fromApiRevenueBand(currentUser.businessProfile?.annualRevenueBand || "")
      });

      // Set avatar preview if profile image exists
      if (currentUser.profileImage) {
        setAvatarPreview(currentUser.profileImage);
      }

      setPersonalInfoValue("firstName", firstName);
      setPersonalInfoValue("lastName", lastName);

      const businessName = currentUser.businessProfile?.businessName || "";
      setBusinessInfoValue("businessName", businessName);
    }
  }, [currentUser?.id, setPersonalInfoValue, setBusinessInfoValue]); // Only update when user ID changes

  // Update top-level keys on formData. For nested updates pass the full object (example used in file).
  const updateFormData = useCallback((key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const toggleMarketplace = useCallback((marketplace: string) => {
    setFormData((prev: any) => {
      const list: string[] = prev.marketplaces || [];
      const exists = list.includes(marketplace);
      return {
        ...prev,
        marketplaces: exists ? list.filter((m) => m !== marketplace) : [...list, marketplace]
      };
    });
  }, []);

  const toggleIntegration = useCallback((integration: string) => {
    setFormData((prev: any) => {
      const list: string[] = prev.accountingStack?.integrations || [];
      const exists = list.includes(integration);
      const newIntegrations = exists ? list.filter((i) => i !== integration) : [...list, integration];
      return {
        ...prev,
        accountingStack: {
          ...(prev.accountingStack || {}),
          integrations: newIntegrations
        }
      };
    });
  }, []);

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Create preview URL
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);

      // Upload immediately
      setUploadingImage(true);
      try {
        await updateProfileImage({ profileImage: file });
      } catch (error) {
        console.error("Profile image upload error:", error);
        // Reset preview on error
        setAvatarPreview(currentUser?.profileImage || null);
      } finally {
        setUploadingImage(false);
      }
    },
    [currentUser?.profileImage, updateProfileImage]
  );

  const handleRemoveAvatar = useCallback(async () => {
    if (!currentUser?.profileImage && !avatarPreview) return;

    setDeletingImage(true);
    try {
      await deleteProfileImage();
      setAvatarPreview(null);
    } catch (error) {
      console.error("Remove avatar error:", error);
    } finally {
      setDeletingImage(false);
    }
  }, [currentUser?.profileImage, avatarPreview, deleteProfileImage]);

  const handleSavePersonalInfo = useCallback(
    async (data?: PersonalInfoData) => {
      if (!currentUser) return;

      const firstName = data?.firstName || watchPersonalInfo("firstName") || formData.firstName;
      const lastName = data?.lastName || watchPersonalInfo("lastName") || formData.lastName;

      setSavingPersonal(true);
      try {
        // Update user profile (firstName, lastName, role)
        const userUpdatePayload: any = {
          firstName: firstName,
          lastName: lastName,
          role: currentUser.role // Include role from current user state
        };

        await updateUser(userUpdatePayload);

        // Update local form data
        setFormData((prev) => ({ ...prev, firstName, lastName }));
      } catch (error) {
        console.error("Save personal info error:", error);
        // Error is already handled in the hooks
      } finally {
        setSavingPersonal(false);
      }
    },
    [formData, currentUser, updateUser, watchPersonalInfo]
  );

  const handleSaveBusinessInfo = useCallback(
    async (data?: BusinessInfoData) => {
      if (!currentUser || !currentUser.businessProfile) return;

      const businessName = data?.businessName || watchBusinessInfo("businessName") || formData.businessName;

      setSavingBusiness(true);
      try {
        // Update business profile only
        const businessUpdatePayload = buildBusinessProfilePayload({
          businessName: businessName,
          businessEntityType:
            formData.entityType || fromApiEntityType(currentUser.businessProfile.businessEntityType || ""),
          annualRevenueBand:
            formData.revenueBand || fromApiRevenueBand(currentUser.businessProfile.annualRevenueBand || ""),
          marketplaces: fromApiMarketplaces(currentUser.businessProfile.marketplaces || []),
          tools: fromApiTools(currentUser.businessProfile.tools || [])
        });

        await updateBusinessProfile(businessUpdatePayload);

        // Update local form data
        setFormData((prev) => ({ ...prev, businessName }));
      } catch (error) {
        console.error("Save business info error:", error);
        // Error is already handled in the hooks
      } finally {
        setSavingBusiness(false);
      }
    },
    [formData, currentUser, updateBusinessProfile, watchBusinessInfo]
  );

  const handleSaveMarketplaces = useCallback(async () => {
    if (!currentUser || !currentUser.businessProfile) return;

    setSavingMarketplaces(true);
    try {
      const businessUpdatePayload = buildBusinessProfilePayload({
        businessName: currentUser.businessProfile.businessName || "",
        businessEntityType: fromApiEntityType(currentUser.businessProfile.businessEntityType || ""),
        annualRevenueBand: fromApiRevenueBand(currentUser.businessProfile.annualRevenueBand || ""),
        marketplaces: formData.marketplaces,
        tools: fromApiTools(currentUser.businessProfile.tools || [])
      });

      await updateBusinessProfile(businessUpdatePayload, "Marketplaces updated successfully");
    } catch (error) {
      console.error("Save marketplaces error:", error);
    } finally {
      setSavingMarketplaces(false);
    }
  }, [formData, currentUser, updateBusinessProfile]);

  const handleSaveTechStack = useCallback(async () => {
    if (!currentUser || !currentUser.businessProfile) return;

    setSavingTechStack(true);
    try {
      const businessUpdatePayload = buildBusinessProfilePayload({
        businessName: currentUser.businessProfile.businessName || "",
        businessEntityType: fromApiEntityType(currentUser.businessProfile.businessEntityType || ""),
        annualRevenueBand: fromApiRevenueBand(currentUser.businessProfile.annualRevenueBand || ""),
        marketplaces: fromApiMarketplaces(currentUser.businessProfile.marketplaces || []),
        tools: formData.accountingStack.integrations || []
      });

      await updateBusinessProfile(businessUpdatePayload, "Tech stack updated successfully");
    } catch (error) {
      console.error("Save tech stack error:", error);
    } finally {
      setSavingTechStack(false);
    }
  }, [formData, currentUser, updateBusinessProfile]);

  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = useCallback(async () => {
    try {
      setDeleting(true);
      await deleteUser();
      setTimeout(() => {
        logout(true);
      }, 1000);
    } catch (error) {
      console.error("Delete account error:", error);
    } finally {
      setDeleting(false);
    }
  }, [deleteUser, logout]);

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex">
      <SettingsSidebar />
      <div className="flex-1 h-full overflow-y-auto">
        <div className="max-w-[1400px] w-full space-y-6 mx-auto my-4 px-6 md:px-8 lg:px-12 py-4 md:py-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <h2>Profile Picture</h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate("/dashboard");
                    }}
                    className="gap-2 "
                  >
                    <svg className="w-4 h-4 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Go to Dashboard
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Update your profile picture to help others recognize you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || currentUser?.profileImage || undefined} alt="Profile" />
                  <AvatarFallback className="text-2xl">
                    {formData.firstName?.charAt(0) || currentUser?.firstName?.charAt(0) || ""}
                    {formData.lastName?.charAt(0) || currentUser?.lastName?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    <Button variant="outline" className="gap-2" disabled={uploadingImage}>
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4" />
                          Upload new picture
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingImage || deletingImage || (!avatarPreview && !currentUser?.profileImage)}
                    className="gap-2"
                  >
                    {deletingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmitPersonalInfo(handleSavePersonalInfo)}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...registerPersonalInfo("firstName", {
                        onChange: (e) => {
                          updateFormData("firstName", e.target.value);
                        }
                      })}
                      disabled={savingPersonal}
                    />
                    {personalInfoErrors.firstName && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{personalInfoErrors.firstName.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...registerPersonalInfo("lastName", {
                        onChange: (e) => {
                          updateFormData("lastName", e.target.value);
                        }
                      })}
                      disabled={savingPersonal}
                    />
                    {personalInfoErrors.lastName && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{personalInfoErrors.lastName.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || currentUser?.email || ""}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                {/* Save Personal Info Button */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={savingPersonal} className="px-8">
                    {savingPersonal ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Business/Firm Information - Only show if user has business profile */}
          {currentUser?.businessProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Tell us about your business</CardTitle>
                <CardDescription>Help us understand your business structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    {...registerBusinessInfo("businessName", {
                      onChange: (e) => {
                        updateFormData("businessName", e.target.value);
                      }
                    })}
                    placeholder="Your business or trading name"
                    disabled={savingBusiness}
                  />
                  {businessInfoErrors.businessName && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{businessInfoErrors.businessName.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entityType">Business Entity Type</Label>
                  <Select
                    value={formData.entityType}
                    onValueChange={(value) => updateFormData("entityType", value)}
                    disabled={savingBusiness}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole-trader">Sole Trader</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="limited-company">Limited Company</SelectItem>
                      <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                      <SelectItem value="charity">Charity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenueBand">Annual Revenue Band</Label>
                  <Select
                    value={formData.revenueBand}
                    onValueChange={(value) => updateFormData("revenueBand", value)}
                    disabled={savingBusiness}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select revenue band" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-90k">£0 to £90,000 (Below VAT threshold)</SelectItem>
                      <SelectItem value="90k-750k">£90,000 - £750,000</SelectItem>
                      <SelectItem value="750k-2m">£750,000 - £2m</SelectItem>
                      <SelectItem value="2m-5m">£2-5m</SelectItem>
                      <SelectItem value="5m-10m">£5-10m</SelectItem>
                      <SelectItem value="10m+">£10m+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Save Business Info Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSubmitBusinessInfo(handleSaveBusinessInfo)}
                    disabled={savingBusiness}
                    className="px-8"
                  >
                    {savingBusiness ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Online Marketplaces - Only for Clients with business profile */}
          {isClient && currentUser?.businessProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Online Marketplaces</CardTitle>
                <CardDescription>Select which online marketplaces you use for your business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Amazon",
                    "eBay",
                    "TikTok Shop",
                    "Shopify",
                    "WooCommerce",
                    "Etsy",
                    "Facebook Marketplace",
                    "Instagram Shopping",
                    "Other"
                  ].map((marketplace: string) => (
                    <div key={marketplace} className="flex items-center space-x-2">
                      <Checkbox
                        id={marketplace}
                        checked={formData.marketplaces.includes(marketplace)}
                        onCheckedChange={() => toggleMarketplace(marketplace)}
                      />
                      <Label htmlFor={marketplace}>{marketplace}</Label>
                    </div>
                  ))}
                </div>
                {(currentUser?.businessProfile?.marketplaces?.length ?? 0) > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Selected marketplaces:</p>
                    <div className="flex flex-wrap gap-2">
                      {(currentUser?.businessProfile?.marketplaces ?? []).map((marketplace) => (
                        <Badge key={marketplace} variant="secondary">
                          {marketplace}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Marketplaces Button */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveMarketplaces} disabled={savingMarketplaces} className="px-8">
                    {savingMarketplaces ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accounting Stack - Only for Clients with business profile */}
          {isClient && currentUser?.businessProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Tech Stack & Integrations</CardTitle>
                <CardDescription>Tell us about your current accounting and payment setup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4" />

                <div>
                  <Label className="text-base font-medium">Payment Gateways & Integrations:</Label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {[
                      "Klarna",
                      "Square",
                      "Stripe",
                      "Worldpay",
                      "Braintree",
                      "Amazon Pay",
                      "Shopify Payments",
                      "Clearpay",
                      "PayPal",
                      "GoCardless",
                      "Other"
                    ].map((integration: string) => (
                      <div key={integration} className="flex items-center space-x-2">
                        <Checkbox
                          id={integration}
                          checked={formData.accountingStack.integrations.includes(integration)}
                          onCheckedChange={() => toggleIntegration(integration)}
                        />
                        <Label htmlFor={integration}>{integration}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {(currentUser?.businessProfile?.tools?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Selected integrations:</p>
                    <div className="flex flex-wrap gap-2">
                      {(currentUser?.businessProfile?.tools ?? []).map((integration) => (
                        <Badge key={integration} variant="secondary">
                          {integration}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Tech Stack Button */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveTechStack} disabled={savingTechStack} className="px-8">
                    {savingTechStack ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription & Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription & Plan</CardTitle>
              <CardDescription>View your current subscription status and plan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Current Status</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentUser?.team?.subscriptionStatus || "Not Available"}
                  </p>
                </div>
                <Badge variant={currentUser?.team?.subscriptionStatus === "TRIALING" ? "secondary" : "default"}>
                  {currentUser?.team?.subscriptionStatus || "N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Permanently delete your account and all associated data</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data
                      from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-white hover:bg-destructive/90"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Account"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
