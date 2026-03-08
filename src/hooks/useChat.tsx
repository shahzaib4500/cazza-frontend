import { AxiosError } from "axios";

import { useToast } from "@/components/ToastProvider";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  createChatGroupService,
  getUserChatGroupsService,
  getChatGroupByIdService,
  updateChatGroupService,
  deleteChatGroupService,
  getFirebaseTokenService,
  addMemberToGroupService,
  removeMemberFromGroupService,
  updateMemberRoleService,
  type CreateChatGroupPayload
} from "@/services/chatService";

export const useChat = () => {
  const { showToast } = useToast();

  const createChatGroup = async (payload: CreateChatGroupPayload) => {
    try {
      const res = await createChatGroupService(payload);
      if (res && res.success && res.data?.group) {
        showToast(res.message || "Channel created successfully", "success");
        return res.data.group;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to create channel", "error");
        throw new Error(res.message || "Failed to create channel");
      }
      throw new Error("Invalid response from server");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        let errorMessage = getApiErrorMessage(error, "Failed to create channel");

        // Check for description length validation specifically
        if (errorMessage.toLowerCase().includes("description") && errorMessage.toLowerCase().includes("characters")) {
          errorMessage = "Description cannot exceed 500 characters";
        }

        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const getUserChatGroups = async () => {
    try {
      const res = await getUserChatGroupsService();
      if (res && res.success && res.data?.groups) {
        return Array.isArray(res.data.groups) ? res.data.groups : [];
      }
      return [];
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Failed to fetch channels";
        showToast(errorMessage, "error");
      }
      return [];
    }
  };

  const getChatGroupById = async (groupId: string) => {
    try {
      const res = await getChatGroupByIdService(groupId);
      if (res && res.success && res.data?.group) {
        return res.data.group;
      }
      return null;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Failed to fetch channel";
        showToast(errorMessage, "error");
      }
      return null;
    }
  };

  const updateChatGroup = async (groupId: string, data: { name: string; description: string; icon: string }) => {
    try {
      const res = await updateChatGroupService(groupId, data);
      if (res && res.success) {
        showToast(res.message || "Channel updated successfully", "success");
        return true;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to update channel", "error");
        throw new Error(res.message || "Failed to update channel");
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        let errorMessage = error.response?.data?.message || "Failed to update channel";

        // Handle validation errors more specifically
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          const validationMessages = error.response.data.errors.map((err: any) => err.message || err.msg).join(", ");
          errorMessage = validationMessages || errorMessage;
        }

        // Check for description length validation specifically
        if (errorMessage.toLowerCase().includes("description") && errorMessage.toLowerCase().includes("characters")) {
          errorMessage = "Description cannot exceed 500 characters";
        }

        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const deleteChatGroup = async (groupId: string) => {
    try {
      const res = await deleteChatGroupService(groupId);
      if (res && res.success) {
        showToast(res.message || "Channel deleted successfully", "success");
        return true;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to delete channel", "error");
        throw new Error(res.message || "Failed to delete channel");
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Failed to delete channel";
        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const getFirebaseToken = async (groupId: string) => {
    try {
      const res = await getFirebaseTokenService(groupId);

      if (res && res.success && res.data?.token) {
        const token = res.data.token;
        return token;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to get Firebase token", "error");
        throw new Error(res.message || "Failed to get Firebase token");
      }
      throw new Error("Invalid response from server");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Failed to get Firebase token";
        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const addMemberToGroup = async (groupId: string, userId: string, role: "ADMIN" | "MEMBER" = "MEMBER") => {
    try {
      const res = await addMemberToGroupService(groupId, { userId, role });
      if (res && res.success) {
        showToast(res.message || "Member added successfully", "success");
        return true;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to add member", "error");
        throw new Error(res.message || "Failed to add member");
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Failed to add member";
        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const removeMemberFromGroup = async (groupId: string, userId: string) => {
    try {
      const res = await removeMemberFromGroupService(groupId, userId);
      if (res && res.success) {
        showToast(res.message || "Member removed successfully", "success");
        return true;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to remove member", "error");
        throw new Error(res.message || "Failed to remove member");
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Failed to remove member";
        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const updateMemberRole = async (groupId: string, userId: string, role: "ADMIN" | "MEMBER") => {
    try {
      const res = await updateMemberRoleService(groupId, userId, { role });
      if (res && res.success) {
        showToast(res.message || "Member role updated successfully", "success");
        return true;
      } else if (res && !res.success) {
        showToast(res.message || "Failed to update member role", "error");
        throw new Error(res.message || "Failed to update member role");
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Failed to update member role";
        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  };

  return {
    createChatGroup,
    getUserChatGroups,
    getChatGroupById,
    updateChatGroup,
    deleteChatGroup,
    getFirebaseToken,
    addMemberToGroup,
    removeMemberFromGroup,
    updateMemberRole
  };
};
