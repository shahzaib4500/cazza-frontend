import { AxiosError } from "axios";
import { useCallback } from "react";

import { useToast } from "@/components/ToastProvider";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  getTeamInvitationsService,
  getMyInvitationsService,
  getTeamMembersService,
  getTeamAnalyticsService,
  cancelInvitationService,
  removeTeamMemberService,
  updateTeamMemberRoleService,
  teamMemberSubscriptionService,
  acceptInvitationService
} from "@/services/teamService";
import { useTeamStore } from "@/store/teamStore";

export const useTeam = () => {
  const { showToast } = useToast();
  const { members, invitations, analytics, isLoading, setMembers, setInvitations, setAnalytics, setLoading } =
    useTeamStore();

  const fetchTeamInvitations = async () => {
    try {
      setLoading(true);
      const res = await getTeamInvitationsService();
      if (res && res.success) {
        const allInvitations = res.data || [];
        const pendingInvitations = allInvitations.filter(
          (invitation: any) => !invitation.status || invitation.status.toUpperCase() !== "ACCEPTED"
        );
        setInvitations(pendingInvitations);
        return pendingInvitations;
      } else {
        showToast(res.message || "Failed to fetch invitations", "error");
        return [];
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 400 || status === 404) {
          setInvitations([]);
          return [];
        }
        if (status === 401 || status === 403) {
          // Handle auth errors gracefully - don't show error, just return empty
          setInvitations([]);
          return [];
        }
        if (status === 500) {
          console.error("Fetch invitations error:", error);
          showToast("Unable to load invitations. Please try again later.", "error");
          setInvitations([]);
          return [];
        }
        console.error("Fetch invitations error:", error);
        showToast(getApiErrorMessage(error, "Failed to fetch invitations"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      setInvitations([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await getTeamMembersService();
      if (res && res.success) {
        setMembers(res.data || []);
        return res.data || [];
      } else {
        showToast(res.message || "Failed to fetch team members", "error");
        return [];
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        // Handle specific status codes
        if (status === 400 || status === 404) {
          // User might not have a team yet
          setMembers([]);
          return [];
        }
        if (status === 401 || status === 403) {
          // Handle auth errors gracefully - don't show error, just return empty
          setMembers([]);
          return [];
        }
        if (status === 500) {
          // Backend server error - don't show user the technical details
          console.error("Fetch team members error:", error);
          showToast("Unable to load team members. Please try again later.", "error");
          setMembers([]);
          return [];
        }
        console.error("Fetch team members error:", error);
        showToast(getApiErrorMessage(error, "Failed to fetch team members"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      setMembers([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getTeamAnalyticsService();
      if (res && res.success) {
        setAnalytics(res.data);
        return res.data;
      } else {
        showToast(res.message || "Failed to fetch team analytics", "error");
        return null;
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 400 || status === 404) {
          setAnalytics(null);
          return null;
        }
        if (status === 401 || status === 403) {
          // Handle auth errors gracefully - don't show error, just return null
          setAnalytics(null);
          return null;
        }
        if (status === 500) {
          console.error("Fetch team analytics error:", error);
          showToast("Unable to load team analytics. Please try again later.", "error");
          setAnalytics(null);
          return null;
        }
        console.error("Fetch team analytics error:", error);
        showToast(getApiErrorMessage(error, "Failed to fetch team analytics"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      setAnalytics(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTeamData = async () => {
    try {
      setLoading(true);
      // Fetch members first (all users can see this)
      await fetchTeamMembersWithoutLoading();
      // Then fetch invitations and analytics in parallel (only for OWNER/ADMIN)
      // Use Promise.allSettled so if one fails, others still complete
      await Promise.allSettled([fetchTeamInvitationsWithoutLoading(), fetchTeamAnalyticsWithoutLoading()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembersWithoutLoading = async () => {
    try {
      const res = await getTeamMembersService();
      if (res && res.success) {
        setMembers(res.data || []);
        return res.data || [];
      } else {
        showToast(res.message || "Failed to fetch team members", "error");
        return [];
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 400 || status === 404) {
          setMembers([]);
          return [];
        }
        if (status === 401 || status === 403) {
          setMembers([]);
          return [];
        }
        if (status === 500) {
        console.error("Fetch team members error:", error);
        showToast("Unable to load team members. Please try again later.", "error");
          setMembers([]);
          return [];
        }
        console.error("Fetch team members error:", error);
        showToast(getApiErrorMessage(error, "Failed to fetch team members"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      setMembers([]);
      return [];
    }
  };

  const fetchTeamInvitationsWithoutLoading = async () => {
    try {
      const res = await getTeamInvitationsService();
      if (res && res.success) {
        const allInvitations = res.data || [];
        const pendingInvitations = allInvitations.filter(
          (invitation: any) => !invitation.status || invitation.status.toUpperCase() !== "ACCEPTED"
        );
        setInvitations(pendingInvitations);
        return pendingInvitations;
      } else {
        showToast(res.message || "Failed to fetch invitations", "error");
        return [];
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 400 || status === 404) {
          setInvitations([]);
          return [];
        }
        if (status === 401 || status === 403) {
          setInvitations([]);
          return [];
        }
        if (status === 500) {
        console.error("Fetch invitations error:", error);
        showToast("Unable to load invitations. Please try again later.", "error");
          setInvitations([]);
          return [];
        }
        console.error("Fetch invitations error:", error);
        showToast(getApiErrorMessage(error, "Failed to fetch invitations"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      setInvitations([]);
      return [];
    }
  };

  const fetchTeamAnalyticsWithoutLoading = async () => {
    try {
      const res = await getTeamAnalyticsService();
      if (res && res.success) {
        setAnalytics(res.data);
        return res.data;
      } else {
        showToast(res.message || "Failed to fetch team analytics", "error");
        return null;
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 400 || status === 404) {
          setAnalytics(null);
          return null;
        }
        if (status === 401 || status === 403) {
          setAnalytics(null);
          return null;
        }
        if (status === 500) {
          console.error("Fetch team analytics error:", error);
          showToast("Unable to load team analytics. Please try again later.", "error");
          setAnalytics(null);
          return null;
        }
        console.error("Fetch team analytics error:", error);
        showToast(getApiErrorMessage(error, "Failed to fetch team analytics"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      setAnalytics(null);
      return null;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      const res = await cancelInvitationService(invitationId);
      if (res && res.success) {
        showToast(res.message || "Invitation cancelled successfully", "success");
        // Refresh all team data to ensure consistency with server
        await fetchAllTeamData();
        return res;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to cancel invitation", "error");
        throw new Error(res.message || "Cancel invitation failed");
      }
    } catch (error: unknown) {
      console.error("Cancel invitation error:", error);
      if (error instanceof AxiosError) {
        showToast(getApiErrorMessage(error, "Failed to cancel invitation"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeTeamMember = async (memberId: string) => {
    try {
      setLoading(true);
      const res = await removeTeamMemberService(memberId);
      if (res && res.success) {
        showToast(res.message || "Team member removed successfully", "success");
        // Refresh all team data to ensure consistency with server
        await fetchAllTeamData();
        return res;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to remove team member", "error");
        throw new Error(res.message || "Remove member failed");
      }
    } catch (error: unknown) {
      console.error("Remove team member error:", error);
      if (error instanceof AxiosError) {
        showToast(getApiErrorMessage(error, "Failed to remove team member"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTeamMemberRole = async (teamMemberId: string, currentRole: string) => {
    try {
      setLoading(true);
      // Toggle role: if MEMBER, send ADMIN; if ADMIN, send MEMBER
      const newRole: "ADMIN" | "MEMBER" = currentRole?.toUpperCase() === "ADMIN" ? "MEMBER" : "ADMIN";
      const res = await updateTeamMemberRoleService(teamMemberId, {
        role: newRole
      });
      if (res && res.success) {
        showToast(res.message || "Team member role updated successfully", "success");
        // Refresh all team data to ensure consistency with server
        await fetchAllTeamData();
        return res;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to update team member role", "error");
        throw new Error(res.message || "Update role failed");
      }
    } catch (error: unknown) {
      console.error("Update team member role error:", error);
      if (error instanceof AxiosError) {
        showToast(getApiErrorMessage(error, "Failed to update team member role"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getMyInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyInvitationsService();
      if (res && res.success) {
        return res.data || [];
      } else {
        showToast(res.message || "Failed to fetch invitations", "error");
        return [];
      }
    } catch (error: unknown) {
      console.error("Get my invitations error:", error);
      if (error instanceof AxiosError) {
        showToast(getApiErrorMessage(error, "Failed to fetch invitations"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const acceptInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      const res = await acceptInvitationService(invitationId);
      if (res && res.success) {
        const { removeInvitation } = useTeamStore.getState();
        removeInvitation(invitationId);
        await fetchAllTeamData();
        return res;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to accept invitation", "error");
        throw new Error(res.message || "Accept invitation failed");
      }
    } catch (error: unknown) {
      console.error("Accept invitation error:", error);
      if (error instanceof AxiosError) {
        showToast(getApiErrorMessage(error, "Failed to accept invitation"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const payForTeamMember = async (userId: string, interval: "monthly" | "yearly") => {
    try {
      setLoading(true);
      const res = await teamMemberSubscriptionService({ userId, interval });
      if (res && res.success) {
        // If checkout URL is provided, redirect to it
        if (res.data?.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
          return res;
        }
        showToast(res.message || "Subscription checkout initiated successfully", "success");
        return res;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to initiate subscription checkout", "error");
        throw new Error(res.message || "Subscription checkout failed");
      }
    } catch (error: unknown) {
      console.error("Team member subscription error:", error);
      if (error instanceof AxiosError) {
        showToast(getApiErrorMessage(error, "Failed to initiate subscription checkout"), "error");
      } else if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    members,
    invitations,
    analytics,
    isLoading,
    fetchTeamInvitations,
    getMyInvitations,
    fetchTeamMembers,
    fetchTeamAnalytics,
    fetchAllTeamData,
    cancelInvitation,
    acceptInvitation,
    removeTeamMember,
    updateTeamMemberRole,
    payForTeamMember
  };
};
