import { useCallback, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Shield, Users, Loader2, X, CreditCard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamInviteDialog } from "@/components/TeamInviteDialog";
import { useTeam } from "@/hooks/useTeam";
import { useUserStore } from "@/store/userStore";
import { useToast } from "@/components/ToastProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const roles = [
  {
    name: "Owner",
    description:
      "Full access to all features including billing, integrations, and team management",
    permissions: [
      "All permissions",
      "Manage billing",
      "Manage integrations",
      "Manage team",
      "Full access",
    ],
    icon: "owner",
  },
  {
    name: "Admin",
    description:
      "Manage team members, integrations, and settings, but cannot access billing",
    permissions: [
      "Manage team",
      "Manage integrations",
      "View reports",
      "Manage settings",
      "Connect stores",
    ],
    icon: "admin",
  },
  {
    name: "Member",
    description:
      "Standard access to core features, cannot manage billing or integrations",
    permissions: [
      "View reports",
      "View data",
      "Basic settings",
      "Use features",
    ],
    icon: "member",
  },
];
export const TeamSettings = () => {
  const { user: currentUser } = useUserStore();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    members,
    invitations,
    analytics,
    isLoading,
    fetchAllTeamData,
    cancelInvitation,
    removeTeamMember,
    updateTeamMemberRole,
    payForTeamMember,
  } = useTeam();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [cancelInviteId, setCancelInviteId] = useState<string | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [memberIntervals, setMemberIntervals] = useState<Record<string, "monthly" | "yearly">>({});
  const [payingForMemberId, setPayingForMemberId] = useState<string | null>(null);

  // Check for payment success/failure message in URL (fallback for direct navigation)
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      // Redirect to callback page for proper handling
      navigate(`/subscription/callback?message=${message}&type=team`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Fetch team data on mount
  useEffect(() => {
    fetchAllTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const canManageTeam = true;

  // Handle invite button click
  const handleInvite = useCallback(() => {
    setIsInviteDialogOpen(true);
  }, []);

  // Handle successful invite
  const handleInviteSuccess = useCallback(() => {
    fetchAllTeamData();
  }, [fetchAllTeamData]);

  const handleCancelInvitation = useCallback((invitationId: string) => {
    setCancelInviteId(invitationId);
  }, []);

  const confirmCancelInvitation = useCallback(async () => {
    if (cancelInviteId) {
      try {
        await cancelInvitation(cancelInviteId);
        setCancelInviteId(null);
      } catch (error) {
        console.error("Failed to cancel invitation:", error);
      }
    }
  }, [cancelInviteId, cancelInvitation]);

  const handleRemoveMember = useCallback((memberId: string) => {
    setRemoveMemberId(memberId);
  }, []);

  const handlePayForMember = useCallback(async (member: any) => {
    console.log("handlePayForMember called with member:", member);
    // userId is the id of the member
    const userId = member.id;
    console.log("Using member.id as userId:", userId);
    
    if (!userId) {
      console.error("Member ID not found for member:", member);
      showToast("Member ID not found. Please contact support.", "error");
      return;
    }
    
    const interval = memberIntervals[member.id] || "monthly";
    console.log("Using interval:", interval, "for member:", member.id);
    setPayingForMemberId(member.id);
    try {
      console.log("Calling payForTeamMember with:", { userId, interval });
      await payForTeamMember(userId, interval);
    } catch (error) {
      console.error("Error paying for team member:", error);
      // Error is already handled in payForTeamMember hook
    } finally {
      setPayingForMemberId(null);
    }
  }, [memberIntervals, payForTeamMember, showToast]);

  const confirmRemoveMember = useCallback(async () => {
    if (removeMemberId) {
      try {
        await removeTeamMember(removeMemberId);
        setRemoveMemberId(null);
      } catch (error) {
        console.error("Failed to remove member:", error);
      }
    }
  }, [removeMemberId, removeTeamMember]);

  const getInitials = (m: any) => {
    if (m.name) {
      return m.name
        .split(" ")
        .map((s: string) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    const email = m.email || m.profiles?.email || "";
    return email[0]?.toUpperCase() || "?";
  };

  const getDisplayName = (m: any) => {
    return m.name || m.email || m.profiles?.email || "Unknown";
  };

  const getMemberEmail = (m: any) => {
    return m.email || m.profiles?.email || "No email";
  };

  // Filter out current user from members list
  const filteredMembers = members.filter(
    (member) => member.userId !== currentUser?.id && member.user_id !== currentUser?.id
  );

  if (isLoading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 mx-auto my-4">
      {/* Team overview  */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="px-6 py-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Team Members</h3>
            </div>
            <p className="text-3xl font-bold">
              {analytics?.totalTeamMembers ?? filteredMembers.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {filteredMembers.length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-6 py-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Pending Invites</h3>
            </div>
            <p className="text-3xl font-bold">
              {analytics?.pendingInvitations ?? invitations.length}
            </p>
            <p className="text-sm text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-6 py-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Admins</h3>
            </div>
            <p className="text-3xl font-bold">
              {analytics?.adminCount ?? filteredMembers.filter((m) => m.role?.toLowerCase() === "admin").length}
            </p>
            <p className="text-sm text-muted-foreground">Admin privileges</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members and Invitations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their access permissions
              </CardDescription>
            </div>

            {canManageTeam && (
              <Button className="gap-2" onClick={handleInvite}>
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Pending Members Section */}
            {invitations.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Pending Members</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Invitations that are awaiting acceptance
                  </p>
                </div>
                {invitations.map((invitation) => {
                  const expiresAt = invitation.expiresAt 
                    ? new Date(invitation.expiresAt) 
                    : null;
                  const isExpired = expiresAt ? expiresAt < new Date() : false;
                  
                  return (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {invitation.email?.[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{invitation.email}</h3>
                            <Badge variant="outline" className="capitalize text-xs">
                              {invitation.role?.toLowerCase() || "member"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Pending invitation
                          </p>
                          {expiresAt && (
                            <p className={`text-xs mt-1 ${isExpired ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                              {isExpired 
                                ? "Expired" 
                                : `Expires ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {canManageTeam && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-destructive border border-destructive hover:bg-destructive hover:text-white"
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Team Members Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Team Members</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Active team members in your organization
                </p>
              </div>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(member)}</AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {getDisplayName(member)}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getMemberEmail(member)}
                        </p>
                        {member.joined_at && (
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {member.role?.toLowerCase()}
                      </Badge>
                      {canManageTeam && (
                        <>
                          {/* Subscription checkout for team members */}
                          {member.role?.toUpperCase() !== "OWNER" && (
                            <div className="flex items-center gap-2">
                              <Select
                                value={memberIntervals[member.id] || "monthly"}
                                onValueChange={(value: "monthly" | "yearly") => {
                                  setMemberIntervals(prev => ({
                                    ...prev,
                                    [member.id]: value
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder="Interval" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePayForMember(member)}
                                disabled={isLoading || payingForMemberId === member.id}
                                className="gap-2"
                              >
                                {payingForMemberId === member.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-4 w-4" />
                                    Pay for him
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                          {/* Only show role toggle for members (not OWNER) */}
                          {member.role?.toUpperCase() !== "OWNER" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  // The API expects the team member's ID (member.id) in the URL
                                  // Based on endpoint: /team/member/{{userID}}/role where userID is the team member ID
                                  const teamMemberId = member.id;
                                  
                                  if (teamMemberId) {
                                    await updateTeamMemberRole(teamMemberId, member.role || "MEMBER");
                                  } else {
                                    console.error("Team member ID not found:", member);
                                  }
                                } catch (error) {
                                  console.error("Error updating team member role:", error);
                                }
                              }}
                              disabled={isLoading}
                            >
                              {member.role?.toUpperCase() === "ADMIN" ? "Make Member" : "Make Admin"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive border border-destructive hover:bg-destructive hover:text-white"
                            disabled={isLoading}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No team members yet. Invite your first member to get started!
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No team members yet.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Overview of what each role can do in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.name} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {role.icon}
                  <h3 className="font-semibold">{role.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {role.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <Badge
                      key={permission}
                      variant="outline"
                      className="text-xs"
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Team Member Dialog */}
      <TeamInviteDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInviteSuccess={handleInviteSuccess}
      />

      {/* Cancel Invitation Confirmation Dialog */}
      <AlertDialog
        open={cancelInviteId !== null}
        onOpenChange={(open) => !open && setCancelInviteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invitation? The person will no longer be able to accept it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelInviteId(null)}>
              Keep Invitation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelInvitation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Invitation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={removeMemberId !== null}
        onOpenChange={(open) => !open && setRemoveMemberId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? They will lose access to the workspace immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveMemberId(null)}>
              Keep Member
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
