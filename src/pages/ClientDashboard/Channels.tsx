import { format } from "date-fns";
import { signInWithCustomToken, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  limit,
  Timestamp,
  doc,
  setDoc,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import {
  Plus,
  Hash,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Search,
  MessageSquare,
  ShoppingBag,
  Package,
  Smartphone,
  Calculator,
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  Heart,
  Star,
  Target,
  Briefcase,
  Home,
  Building2,
  Rocket,
  Globe,
  Music,
  Camera,
  Gamepad2,
  Book,
  Code,
  Palette,
  Send,
  Reply,
  X,
  Smile,
  type LucideIcon
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

import { MarkdownMessage } from "@/components/ClientComponents/MarkdownMessage";
import { MessageFormatToolbar } from "@/components/ClientComponents/MessageFormatToolbar";
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChat } from "@/hooks/useChat";
import { useTeam } from "@/hooks/useTeam";
import { auth, db } from "@/lib/firebase";
import type { ChatGroup } from "@/services/chatService";
import { useUserStore } from "@/store/userStore";
import type { TeamMember as TeamMemberType } from "@/types/auth";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "MEMBER" | "ADMIN";
}

interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  createdAt: Date;
  deleted: boolean;
  edited: boolean;
  editedAt?: Date;
  reactions: Record<string, string[]>;
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  };
  attachments: any[];
}

interface Channel {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconName: string;
  color: string;
  members: TeamMember[];
  createdAt: string;
  messages: ChannelMessage[];
  userRole?: "ADMIN" | "MEMBER";
  createdBy?: string;
}

const availableIcons: { name: string; icon: LucideIcon; color: string }[] = [
  { name: "Hash", icon: Hash, color: "hsl(var(--primary))" },
  { name: "Message", icon: MessageSquare, color: "hsl(var(--chart-1))" },
  { name: "Shop", icon: ShoppingBag, color: "hsl(var(--chart-4))" },
  { name: "Package", icon: Package, color: "hsl(var(--chart-5))" },
  { name: "Phone", icon: Smartphone, color: "hsl(var(--destructive))" },
  { name: "Calc", icon: Calculator, color: "hsl(var(--chart-1))" },
  { name: "Chart", icon: BarChart3, color: "hsl(var(--chart-2))" },
  { name: "Trending", icon: TrendingUp, color: "hsl(var(--chart-3))" },
  { name: "Dollar", icon: DollarSign, color: "hsl(var(--success))" },
  { name: "Zap", icon: Zap, color: "hsl(var(--warning))" },
  { name: "Heart", icon: Heart, color: "hsl(var(--destructive))" },
  { name: "Star", icon: Star, color: "hsl(var(--chart-4))" },
  { name: "Target", icon: Target, color: "hsl(var(--chart-5))" },
  { name: "Work", icon: Briefcase, color: "hsl(var(--chart-1))" },
  { name: "Home", icon: Home, color: "hsl(var(--chart-2))" },
  { name: "Building", icon: Building2, color: "hsl(var(--chart-3))" },
  { name: "Rocket", icon: Rocket, color: "hsl(var(--primary))" },
  { name: "Globe", icon: Globe, color: "hsl(var(--chart-4))" },
  { name: "Music", icon: Music, color: "hsl(var(--chart-5))" },
  { name: "Camera", icon: Camera, color: "hsl(var(--destructive))" },
  { name: "Game", icon: Gamepad2, color: "hsl(var(--chart-1))" },
  { name: "Book", icon: Book, color: "hsl(var(--chart-2))" },
  { name: "Code", icon: Code, color: "hsl(var(--chart-3))" },
  { name: "Palette", icon: Palette, color: "hsl(var(--chart-4))" }
];

export const Channels = () => {
  const {
    getUserChatGroups,
    createChatGroup,
    updateChatGroup,
    deleteChatGroup,
    getChatGroupById,
    addMemberToGroup,
    removeMemberFromGroup,
    updateMemberRole,
    getFirebaseToken
  } = useChat();
  const { fetchTeamMembers } = useTeam();
  const { user: loggedInUser } = useUserStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberType[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [changingRoleMemberId, setChangingRoleMemberId] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingChannelDetails, setIsLoadingChannelDetails] = useState(false);

  const convertChatGroupToChannel = useCallback((chatGroup: ChatGroup): Channel => {
    const defaultIcon = availableIcons[0];
    const iconFromApi = chatGroup.icon
      ? availableIcons.find((i) => i.name.toLowerCase() === chatGroup.icon?.toLowerCase())
      : null;
    const icon = iconFromApi || defaultIcon;

    return {
      id: chatGroup.id,
      name: chatGroup.name,
      description: chatGroup.description || "",
      icon: icon.icon,
      iconName: icon.name,
      color: icon.color,
      members: [],
      createdAt: chatGroup.createdAt,
      messages: [],
      userRole: chatGroup.role,
      createdBy: chatGroup.createdBy
    };
  }, []);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState<string | null>(null);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const typingUnsubscribeRef = useRef<(() => void) | null>(null);
  const isInitializingRef = useRef(false);
  const addMemberDialogChannelIdRef = useRef<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<ChannelMessage | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [openReactionPopoverId, setOpenReactionPopoverId] = useState<string | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [descriptionExceedsLimit, setDescriptionExceedsLimit] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<{
    name: string;
    icon: LucideIcon;
    color: string;
  }>(availableIcons[0]);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  const getCurrentUserRole = (channel: Channel | undefined): "ADMIN" | "MEMBER" | null => {
    if (!channel || !loggedInUser) return null;

    if (channel.userRole) {
      return channel.userRole;
    }

    const userMember = channel.members.find(
      (m) => m.id === loggedInUser.id || String(m.id) === String(loggedInUser.id)
    );

    if (userMember) {
      return userMember.role;
    }

    return null;
  };

  const isCreatorOrAdmin = (channel: Channel | undefined): boolean => {
    if (!channel || !loggedInUser) return false;

    if (
      channel.createdBy &&
      (channel.createdBy === loggedInUser.id || String(channel.createdBy) === String(loggedInUser.id))
    ) {
      return true;
    }

    return getCurrentUserRole(channel) === "ADMIN";
  };

  const processMemberFromAPI = (member: any, creatorId: string | null) => {
    if (!member.user) {
      return {
        id: member.userId,
        name: "User",
        email: "",
        avatar: null,
        role: member.role,
        isCreator: false
      };
    }

    const userData = member.user;
    const isCreator =
      creatorId &&
      (member.userId === creatorId ||
        String(member.userId) === String(creatorId) ||
        userData.id === creatorId ||
        String(userData.id) === String(creatorId));

    const getDisplayName = () => {
      if (userData.firstName && userData.lastName) {
        return `${userData.firstName} ${userData.lastName}`;
      }
      if (userData.firstName) {
        return userData.firstName;
      }
      return userData.email || "User";
    };

    return {
      id: member.userId,
      name: getDisplayName(),
      email: userData.email || "",
      avatar: userData.profileImage || null,
      role: member.role,
      isCreator: !!isCreator
    };
  };

  useEffect(() => {
    const loadChatGroups = async () => {
      try {
        setIsLoading(true);
        const chatGroups = await getUserChatGroups();

        if (chatGroups && Array.isArray(chatGroups) && chatGroups.length > 0) {
          const convertedChannels = chatGroups
            .filter((group) => group && group.id && group.name)
            .map(convertChatGroupToChannel);

          if (convertedChannels.length > 0) {
            setChannels(convertedChannels);

            setSelectedChannelId((prev) => {
              if (!prev) {
                return convertedChannels[0].id;
              }
              return prev;
            });
          } else {
            setChannels([]);
          }
        } else {
          setChannels([]);
        }
      } catch (error) {
        setChannels([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatGroups();
  }, []);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const members = await fetchTeamMembers();
        if (members && members.length > 0) {
          setTeamMembers(members);
        }
      } catch (error) {
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadTeamMembers();
  }, []);

  const updateTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!selectedChannelId || !loggedInUser || !auth.currentUser) return;

      try {
        const typingRef = doc(db, "chatGroups", selectedChannelId, "typing", loggedInUser.id);

        const senderName =
          loggedInUser.firstName && loggedInUser.lastName
            ? `${loggedInUser.firstName} ${loggedInUser.lastName}`
            : loggedInUser.firstName || loggedInUser.email || "User";

        await setDoc(
          typingRef,
          {
            isTyping: isTyping,
            updatedAt: serverTimestamp(),
            createdBy: loggedInUser.id,
            name: senderName
          },
          { merge: true }
        );
      } catch (error) {}
    },
    [selectedChannelId, loggedInUser]
  );

  const handleTyping = useCallback(() => {
    if (!selectedChannelId || !loggedInUser) return;
    updateTypingStatus(true);
  }, [selectedChannelId, loggedInUser, updateTypingStatus]);

  const handleInputBlur = useCallback(() => {
    if (!selectedChannelId || !loggedInUser) return;
    updateTypingStatus(false);
  }, [selectedChannelId, loggedInUser, updateTypingStatus]);

  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!selectedChannelId || !loggedInUser || !auth.currentUser || !newText.trim()) return;

    try {
      const message = selectedChannel?.messages.find((m) => m.id === messageId);
      if (!message) return;

      const trimmedNewText = newText.trim();
      const originalText = message.text.trim();

      if (trimmedNewText === originalText) {
        setEditingMessageId(null);
        setEditingMessageText("");
        if (messageInputRef.current) {
          messageInputRef.current.style.height = "auto";
        }
        return;
      }

      const messageRef = doc(db, "chatGroups", selectedChannelId, "messages", messageId);
      const updateData: any = {
        text: trimmedNewText
      };

      if (trimmedNewText !== originalText) {
        updateData.edited = true;
        updateData.editedAt = serverTimestamp();
      }

      await updateDoc(messageRef, updateData);
      setEditingMessageId(null);
      setEditingMessageText("");
      if (messageInputRef.current) {
        messageInputRef.current.style.height = "auto";
      }
    } catch (error) {}
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChannelId || !loggedInUser || !auth.currentUser) return;

    try {
      const messageRef = doc(db, "chatGroups", selectedChannelId, "messages", messageId);
      await updateDoc(messageRef, {
        deleted: true
      });
    } catch (error) {}
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!selectedChannelId || !loggedInUser || !auth.currentUser) return;

    try {
      const messageRef = doc(db, "chatGroups", selectedChannelId, "messages", messageId);
      const message = selectedChannel?.messages.find((m) => m.id === messageId);
      const currentReactions = message?.reactions || {};
      const usersWithReaction = currentReactions[emoji] || [];

      if (usersWithReaction.includes(loggedInUser.id)) {
        await updateDoc(messageRef, {
          [`reactions.${emoji}`]: arrayRemove(loggedInUser.id)
        });
      } else {
        const updates: any = {};

        Object.keys(currentReactions).forEach((existingEmoji) => {
          if (existingEmoji !== emoji) {
            const existingUsers = currentReactions[existingEmoji] || [];
            if (existingUsers.includes(loggedInUser.id)) {
              updates[`reactions.${existingEmoji}`] = arrayRemove(loggedInUser.id);
            }
          }
        });

        updates[`reactions.${emoji}`] = arrayUnion(loggedInUser.id);

        await updateDoc(messageRef, updates);
      }
      setOpenReactionPopoverId(null);
    } catch (error) {}
  };

  const handleReply = (message: ChannelMessage) => {
    setEditingMessageId(null);
    setEditingMessageText("");
    setReplyingToMessage(message);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingToMessage(null);
  };

  const startEditMessage = (message: ChannelMessage) => {
    setReplyingToMessage(null);
    setEditingMessageId(message.id);
    setEditingMessageText(message.text);
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
    if (messageInputRef.current) {
      messageInputRef.current.style.height = "auto";
    }
  };

  const handleFormatClick = (format: string) => {
    const inputElement = messageInputRef.current;
    if (!inputElement) return;

    const start = inputElement.selectionStart || 0;
    const end = inputElement.selectionEnd || 0;
    const currentText = editingMessageId ? editingMessageText : messageInput;
    const selectedText = currentText.substring(start, end);

    let formattedText = "";
    let cursorOffset = 0;

    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case "underline":
        formattedText = `__${selectedText}__`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case "strikethrough":
        formattedText = `~~${selectedText}~~`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case "link":
        formattedText = `[${selectedText || "text"}](url)`;
        cursorOffset = selectedText ? -4 : -9;
        break;
      case "bulletList":
        formattedText = `- ${selectedText}`;
        cursorOffset = 0;
        break;
      case "numberedList":
        formattedText = `1. ${selectedText}`;
        cursorOffset = 0;
        break;
      default:
        return;
    }

    const newText = currentText.substring(0, start) + formattedText + currentText.substring(end);

    if (editingMessageId) {
      setEditingMessageText(newText);
    } else {
      setMessageInput(newText);
    }

    setTimeout(() => {
      const newCursorPos = start + formattedText.length + cursorOffset;
      inputElement.focus();
      inputElement.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

  useEffect(() => {
    if (!selectedChannelId) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
        typingUnsubscribeRef.current = null;
      }
      setTypingUsers([]);
      isInitializingRef.current = false;
      return;
    }

    if (isInitializingRef.current) {
      return;
    }

    const initializeFirebaseAndLoadMessages = async () => {
      isInitializingRef.current = true;
      setIsLoadingMessages(true);

      try {
        const customToken = await getFirebaseToken(selectedChannelId);

        if (!customToken || typeof customToken !== "string" || customToken.trim() === "") {
          isInitializingRef.current = false;
          setIsLoadingMessages(false);
          return;
        }

        try {
          if (auth.currentUser) {
            await signOut(auth);
          }

          await signInWithCustomToken(auth, customToken);

          await new Promise<void>((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(
              auth,
              (user) => {
                if (user) {
                  unsubscribe();
                  resolve();
                }
              },
              (error) => {
                unsubscribe();
                reject(error);
              }
            );

            setTimeout(() => {
              unsubscribe();
              reject(new Error("Auth state change timeout"));
            }, 5000);
          });

          if (!auth.currentUser) {
            isInitializingRef.current = false;
            setIsLoadingMessages(false);
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const messagesRef = collection(db, "chatGroups", selectedChannelId, "messages");

          const messagesQuery = query(messagesRef, limit(100));

          const unsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
              const firebaseMessages: ChannelMessage[] = snapshot.docs
                .map((docSnapshot) => {
                  const data = docSnapshot.data();
                  const timestamp = data.timestamp as Timestamp;
                  const createdAt = data.createdAt as Timestamp;
                  const editedAt = data.editedAt as Timestamp;
                  return {
                    id: docSnapshot.id,
                    channelId: selectedChannelId,
                    senderId: data.senderId || "",
                    senderName: data.senderName || "",
                    text: data.text || "",
                    timestamp: timestamp ? timestamp.toDate() : new Date(),
                    createdAt: createdAt ? createdAt.toDate() : new Date(),
                    deleted: data.deleted || false,
                    edited: data.edited || false,
                    editedAt: editedAt ? editedAt.toDate() : undefined,
                    reactions: data.reactions || {},
                    replyTo: data.replyTo || undefined,
                    attachments: data.attachments || []
                  };
                })
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

              setChannels((prevChannels) =>
                prevChannels.map((channel) =>
                  channel.id === selectedChannelId ? { ...channel, messages: firebaseMessages } : channel
                )
              );
              setIsLoadingMessages(false);
            },
            (error: any) => {
              if (error?.code === "permission-denied") {
                isInitializingRef.current = false;
                setIsLoadingMessages(false);
              }
            }
          );

          unsubscribeRef.current = unsubscribe;

          const typingRef = collection(db, "chatGroups", selectedChannelId, "typing");
          const typingQuery = query(typingRef, where("isTyping", "==", true));

          const typingUnsubscribe = onSnapshot(
            typingQuery,
            (snapshot) => {
              const typingUsersList: Array<{
                userId: string;
                userName: string;
              }> = [];

              snapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const userId = docSnapshot.id;
                if (
                  data.isTyping &&
                  loggedInUser &&
                  userId !== loggedInUser.id &&
                  String(userId) !== String(loggedInUser.id)
                ) {
                  typingUsersList.push({
                    userId: userId,
                    userName: data.name || "User"
                  });
                }
              });

              setTypingUsers(typingUsersList);
            },
            () => {}
          );

          typingUnsubscribeRef.current = typingUnsubscribe;
          isInitializingRef.current = false;
        } catch (authError: any) {
          isInitializingRef.current = false;
          setIsLoadingMessages(false);
        }
      } catch (error) {
        isInitializingRef.current = false;
        setIsLoadingMessages(false);
      }
    };

    initializeFirebaseAndLoadMessages();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
        typingUnsubscribeRef.current = null;
      }
      if (selectedChannelId && loggedInUser && auth.currentUser) {
        updateTypingStatus(false);
      }
      setTypingUsers([]);
      isInitializingRef.current = false;
      setIsLoadingMessages(false);
    };
  }, [selectedChannelId, loggedInUser, updateTypingStatus]);

  useEffect(() => {
    setExpandedDescription(false);
  }, [selectedChannelId]);

  useEffect(() => {
    if (!selectedChannelId) {
      setIsLoadingChannelDetails(false);
      return;
    }

    const loadChannelDetails = async () => {
      try {
        setIsLoadingChannelDetails(true);
        const channelDetails = await getChatGroupById(selectedChannelId);
        if (channelDetails) {
          const creatorId = (channelDetails as any).createdBy;

          const processedMembers =
            channelDetails.members
              ?.map((member: any) => processMemberFromAPI(member, creatorId))
              .sort((a: any, b: any) => {
                if (a.isCreator) return -1;
                if (b.isCreator) return 1;
                return 0;
              }) || [];

          const finalMembers: TeamMember[] = processedMembers.map((member: any) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.avatar,
            role: member.role
          }));

          setChannels((prevChannels) =>
            prevChannels.map((channel) =>
              channel.id === selectedChannelId
                ? {
                    ...channel,
                    members: finalMembers,
                    userRole: (channelDetails as any).userRole || (channelDetails as any).role,
                    createdBy: creatorId || channel.createdBy
                  }
                : channel
            )
          );
        }
      } catch (error) {
      } finally {
        setIsLoadingChannelDetails(false);
      }
    };

    loadChannelDetails();
  }, [selectedChannelId, teamMembers, loggedInUser]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    previousMessageCountRef.current = 0;
  }, [selectedChannelId]);

  useEffect(() => {
    const currentMessageCount = selectedChannel?.messages.length || 0;
    const previousCount = previousMessageCountRef.current;

    if (currentMessageCount > previousCount) {
      scrollToBottom("smooth");
    }

    previousMessageCountRef.current = currentMessageCount;
  }, [selectedChannel?.messages, scrollToBottom]);

  useEffect(() => {
    if (selectedChannelId && !isLoadingMessages) {
      setTimeout(() => scrollToBottom("instant"), 100);
    }
  }, [selectedChannelId, isLoadingMessages, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (selectedChannelId && loggedInUser && auth.currentUser) {
        updateTypingStatus(false);
      }
    };
  }, [selectedChannelId, loggedInUser, updateTypingStatus]);

  const filteredChannels = channels.filter(
    (channel) =>
      channel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateChannel = async () => {
    if (!channelName.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const createdGroup = await createChatGroup({
        name: channelName.trim(),
        description: channelDescription.trim() || "",
        icon: selectedIcon.name.toLowerCase()
      });

      if (createdGroup) {
        const newChannel = convertChatGroupToChannel(createdGroup);
        setChannels([newChannel, ...channels]);
        setSelectedChannelId(newChannel.id);
      }

      setChannelName("");
      setChannelDescription("");
      setSelectedIcon(availableIcons[0]);
      setShowCreateDialog(false);
    } catch (error) {
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditChannel = async () => {
    if (!editingChannel || !channelName.trim() || isUpdating) return;

    try {
      setIsUpdating(true);
      await updateChatGroup(editingChannel.id, {
        name: channelName.trim(),
        description: channelDescription.trim() || "",
        icon: selectedIcon.name.toLowerCase()
      });

      setChannels(
        channels.map((channel) =>
          channel.id === editingChannel.id
            ? {
                ...channel,
                name: channelName.trim(),
                description: channelDescription.trim(),
                icon: selectedIcon.icon,
                iconName: selectedIcon.name,
                color: selectedIcon.color
              }
            : channel
        )
      );

      setEditingChannel(null);
      setChannelName("");
      setChannelDescription("");
      setSelectedIcon(availableIcons[0]);
      setShowCreateDialog(false);
    } catch (error) {
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (isDeleting === channelId) return;

    try {
      setIsDeleting(channelId);
      await deleteChatGroup(channelId);

      const updatedChannels = channels.filter((channel) => channel.id !== channelId);
      setChannels(updatedChannels);

      if (selectedChannelId === channelId) {
        setSelectedChannelId(updatedChannels[0]?.id || null);
      }
    } catch (error) {
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddMember = async (channelId: string, memberId: string) => {
    try {
      setAddingMemberId(memberId);
      await addMemberToGroup(channelId, memberId, "MEMBER");

      setShowAddMemberDialog(null);

      const channelDetails = await getChatGroupById(channelId);
      if (channelDetails) {
        const creatorId = (channelDetails as any).createdBy;

        const processedMembers =
          channelDetails.members
            ?.map((member: any) => processMemberFromAPI(member, creatorId))
            .sort((a: any, b: any) => {
              if (a.isCreator) return -1;
              if (b.isCreator) return 1;
              return 0;
            }) || [];

        const finalMembers: TeamMember[] = processedMembers.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          role: member.role
        }));

        setChannels((prevChannels) =>
          prevChannels.map((channel) =>
            channel.id === channelId
              ? {
                  ...channel,
                  members: finalMembers,
                  createdBy: creatorId || channel.createdBy
                }
              : channel
          )
        );
      }
    } catch (error) {
    } finally {
      setAddingMemberId(null);
    }
  };

  const handleRemoveMember = async (channelId: string, userId: string) => {
    try {
      setRemovingMemberId(userId);
      await removeMemberFromGroup(channelId, userId);

      setShowRemoveMemberDialog(null);

      const channelDetails = await getChatGroupById(channelId);
      if (channelDetails) {
        const creatorId = (channelDetails as any).createdBy;

        const processedMembers =
          channelDetails.members
            ?.map((member: any) => processMemberFromAPI(member, creatorId))
            .sort((a: any, b: any) => {
              if (a.isCreator) return -1;
              if (b.isCreator) return 1;
              return 0;
            }) || [];

        const finalMembers: TeamMember[] = processedMembers.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          role: member.role
        }));

        setChannels((prevChannels) =>
          prevChannels.map((channel) =>
            channel.id === channelId
              ? {
                  ...channel,
                  members: finalMembers,
                  createdBy: creatorId || channel.createdBy
                }
              : channel
          )
        );
      }
    } catch (error) {
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleChangeMemberRole = async (channelId: string, userId: string, newRole: "ADMIN" | "MEMBER") => {
    try {
      setChangingRoleMemberId(userId);
      await updateMemberRole(channelId, userId, newRole);

      const channelDetails = await getChatGroupById(channelId);
      if (channelDetails) {
        const creatorId = (channelDetails as any).createdBy;

        const processedMembers =
          channelDetails.members
            ?.map((member: any) => processMemberFromAPI(member, creatorId))
            .sort((a: any, b: any) => {
              if (a.isCreator) return -1;
              if (b.isCreator) return 1;
              return 0;
            }) || [];

        const finalMembers: TeamMember[] = processedMembers.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          role: member.role
        }));

        setChannels((prevChannels) =>
          prevChannels.map((channel) =>
            channel.id === channelId
              ? {
                  ...channel,
                  members: finalMembers,
                  createdBy: creatorId || channel.createdBy
                }
              : channel
          )
        );
      }
    } catch (error) {
    } finally {
      setChangingRoleMemberId(null);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannelId || !loggedInUser || isSendingMessage) return;

    try {
      setIsSendingMessage(true);
      if (!auth.currentUser) {
        return;
      }

      if (selectedChannelId && loggedInUser) {
        await updateTypingStatus(false);
      }

      const messagesRef = collection(db, "chatGroups", selectedChannelId, "messages");
      const senderName =
        loggedInUser.firstName && loggedInUser.lastName
          ? `${loggedInUser.firstName} ${loggedInUser.lastName}`
          : loggedInUser.firstName || loggedInUser.email || "User";

      const messageData: any = {
        senderId: loggedInUser.id,
        senderName: senderName,
        text: messageInput.trim(),
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        deleted: false,
        edited: false,
        reactions: {},
        attachments: []
      };

      if (replyingToMessage) {
        messageData.replyTo = {
          messageId: replyingToMessage.id,
          senderName: replyingToMessage.senderName,
          text: replyingToMessage.text.substring(0, 100)
        };
      }

      await addDoc(messagesRef, messageData);

      setMessageInput("");
      setReplyingToMessage(null);
      if (messageInputRef.current) {
        messageInputRef.current.style.height = "auto";
      }
    } catch (error: any) {
    } finally {
      setIsSendingMessage(false);
    }
  };

  const openEditDialog = (channel: Channel) => {
    setEditingChannel(channel);
    setChannelName(channel.name);
    setChannelDescription(channel.description);
    setDescriptionExceedsLimit(false);
    const icon = availableIcons.find((i) => i.name === channel.iconName);
    if (icon) setSelectedIcon(icon);
    setShowCreateDialog(true);
  };

  const closeDialog = () => {
    setShowCreateDialog(false);
    setEditingChannel(null);
    setChannelName("");
    setChannelDescription("");
    setDescriptionExceedsLimit(false);
    setSelectedIcon(availableIcons[0]);
    setShowIconPicker(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSender = (senderId: string, message?: ChannelMessage) => {
    const channel = channels.find((c) => c.id === selectedChannelId);

    if (channel) {
      const channelMember = channel.members.find((m) => m.id === senderId || String(m.id) === String(senderId));

      if (channelMember) {
        return {
          id: channelMember.id,
          name: channelMember.name,
          email: channelMember.email || "",
          avatar: channelMember.avatar ?? undefined,
          role: channelMember.role
        };
      }
    }

    if (loggedInUser && (loggedInUser.id === senderId || String(loggedInUser.id) === String(senderId))) {
      const getDisplayName = () => {
        if (loggedInUser.firstName && loggedInUser.lastName) {
          return `${loggedInUser.firstName} ${loggedInUser.lastName}`;
        }
        if (loggedInUser.firstName) {
          return loggedInUser.firstName;
        }
        return loggedInUser.email || "User";
      };

      return {
        id: loggedInUser.id,
        name: getDisplayName(),
        email: loggedInUser.email || "",
        avatar: loggedInUser.profileImage,
        role: "MEMBER" as const
      };
    }

    return {
      id: senderId,
      name: message?.senderName || "User",
      email: "",
      avatar: undefined,
      role: "MEMBER" as const
    };
  };

  const formatMessageTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  const getReactionUserNames = (userIds: string[]): string[] => {
    const channel = channels.find((c) => c.id === selectedChannelId);
    const names: string[] = [];

    userIds.forEach((userId) => {
      if (channel) {
        const channelMember = channel.members.find((m) => m.id === userId || String(m.id) === String(userId));
        if (channelMember) {
          names.push(channelMember.name);
          return;
        }
      }

      if (loggedInUser && (loggedInUser.id === userId || String(loggedInUser.id) === String(userId))) {
        const displayName =
          loggedInUser.firstName && loggedInUser.lastName
            ? `${loggedInUser.firstName} ${loggedInUser.lastName}`
            : loggedInUser.firstName || loggedInUser.email || "User";
        names.push(displayName);
        return;
      }

      names.push("User");
    });

    return names;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Channels</h2>
            <Dialog
              open={showCreateDialog}
              onOpenChange={(open) => {
                if (!open) {
                  closeDialog();
                } else {
                  if (!editingChannel) {
                    setEditingChannel(null);
                    setChannelName("");
                    setChannelDescription("");
                    setDescriptionExceedsLimit(false);
                    setSelectedIcon(availableIcons[0]);
                  }
                  setShowCreateDialog(true);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingChannel(null);
                    setChannelName("");
                    setChannelDescription("");
                    setDescriptionExceedsLimit(false);
                    setSelectedIcon(availableIcons[0]);
                    setShowCreateDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-[500px]"
                onOpenAutoFocus={(e) => {
                  if (editingChannel) {
                    e.preventDefault();
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle>{editingChannel ? "Edit Channel" : "Create New Channel"}</DialogTitle>
                  <DialogDescription>
                    {editingChannel
                      ? "Update your channel details and icon"
                      : "Create a new channel for your team to collaborate"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Title *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Sales Team"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      autoFocus={false}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">
                      Description
                      <span className="text-xs text-muted-foreground ml-2">
                        ({channelDescription.length}/500 characters)
                      </span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="What is this channel about? (Optional)"
                      value={channelDescription}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (newValue.length <= 500) {
                          setChannelDescription(newValue);
                          setDescriptionExceedsLimit(false);
                        } else {
                          setChannelDescription(newValue.slice(0, 500));
                          setDescriptionExceedsLimit(true);
                        }
                      }}
                      rows={4}
                      className="resize-none max-h-32"
                    />
                    {descriptionExceedsLimit && (
                      <p className="text-xs text-destructive">Description cannot exceed 500 characters</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Channel Icon</Label>
                    <Dialog open={showIconPicker} onOpenChange={setShowIconPicker}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start" type="button">
                          {(() => {
                            const IconComponent = selectedIcon.icon;
                            return <IconComponent className="mr-2 h-4 w-4" style={{ color: selectedIcon.color }} />;
                          })()}
                          {selectedIcon.name}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle>Select Icon</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-4 gap-2 py-4">
                          {availableIcons.map((iconOption) => {
                            const IconComponent = iconOption.icon;
                            return (
                              <button
                                key={iconOption.name}
                                type="button"
                                onClick={() => {
                                  setSelectedIcon(iconOption);
                                  setShowIconPicker(false);
                                }}
                                className={`flex flex-col items-center justify-center p-6 rounded-lg border transition-all hover:bg-muted ${
                                  selectedIcon.name === iconOption.name
                                    ? "border-primary bg-primary/10"
                                    : "border-border"
                                }`}
                              >
                                <IconComponent className="h-6 w-6 mb-1" style={{ color: iconOption.color }} />
                                <span className="text-xs text-center">{iconOption.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={editingChannel ? handleEditChannel : handleCreateChannel}
                    disabled={!channelName.trim() || (editingChannel ? isUpdating : isCreating)}
                  >
                    {editingChannel ? (
                      isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )
                    ) : isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Channel"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No channels found</div>
            ) : (
              filteredChannels.map((channel) => {
                const IconComponent = channel.icon;
                const isSelected = channel.id === selectedChannelId;
                return (
                  <div
                    key={channel.id}
                    className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedChannelId(channel.id)}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isSelected ? "rgba(255, 255, 255, 0.2)" : `${channel.color}20`
                      }}
                    >
                      <IconComponent
                        className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : ""}`}
                        style={{
                          color: isSelected ? undefined : channel.color
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium truncate flex-1 ${isSelected ? "text-primary-foreground" : ""}`}>
                          {channel.name}
                        </p>
                        {isCreatorOrAdmin(channel) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(channel);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Channel
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addMemberDialogChannelIdRef.current = channel.id;
                                  setShowAddMemberDialog(channel.id);
                                }}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Members
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteChannel(channel.id);
                                }}
                                className="text-destructive"
                                disabled={isDeleting === channel.id}
                              >
                                {isDeleting === channel.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Channel
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
        {selectedChannel ? (
          <>
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {(() => {
                    const IconComponent = selectedChannel.icon;
                    return (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${selectedChannel.color}20`
                        }}
                      >
                        <IconComponent className="h-5 w-5" style={{ color: selectedChannel.color }} />
                      </div>
                    );
                  })()}
                  <div className="min-w-0 flex-1" style={{ maxWidth: "calc(100% - 200px)" }}>
                    <h2 className="font-semibold truncate mb-0.5">{selectedChannel.name}</h2>
                    {selectedChannel.description && (
                      <div className="text-sm text-muted-foreground break-words">
                        {selectedChannel.description.length > 80 ? (
                          <div>
                            {expandedDescription ? (
                              <p className="break-words whitespace-normal">
                                {selectedChannel.description}
                                <button
                                  onClick={() => setExpandedDescription(false)}
                                  className="ml-1 text-primary hover:underline font-medium whitespace-nowrap"
                                >
                                  see less
                                </button>
                              </p>
                            ) : (
                              <p className="break-words">
                                {selectedChannel.description.substring(0, 80)}
                                <button
                                  onClick={() => setExpandedDescription(true)}
                                  className="ml-1 text-primary hover:underline font-medium whitespace-nowrap"
                                >
                                  see more
                                </button>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="break-words">{selectedChannel.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {isLoadingChannelDetails ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      selectedChannel.members.length
                    )}
                  </Badge>
                  {isCreatorOrAdmin(selectedChannel) && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoadingChannelDetails}
                        onClick={() => {
                          addMemberDialogChannelIdRef.current = selectedChannel.id;
                          setShowAddMemberDialog(selectedChannel.id);
                        }}
                        title="Add Members"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoadingChannelDetails || selectedChannel.members.length === 0}
                        onClick={() => setShowRemoveMemberDialog(selectedChannel.id)}
                        title="Manage Members"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {!isCreatorOrAdmin(selectedChannel) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isLoadingChannelDetails || selectedChannel.members.length === 0}
                      onClick={() => setShowRemoveMemberDialog(selectedChannel.id)}
                      title="View Members"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
              <div className="space-y-4 p-4 pb-12">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                    <Loader2 className="h-8 w-8 text-muted-foreground mb-4 animate-spin" />
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                ) : selectedChannel.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                    <p className="text-muted-foreground">Start the conversation by sending a message</p>
                  </div>
                ) : (
                  selectedChannel.messages.map((message) => {
                    const sender = getSender(message.senderId, message);
                    const isCurrentUser =
                      loggedInUser &&
                      (message.senderId === loggedInUser.id || String(message.senderId) === String(loggedInUser.id));
                    return (
                      <div key={message.id} className={`group flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={sender.avatar || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(sender.name)}</AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                            <span className="text-sm font-medium">{sender.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </div>
                          {message.replyTo && !message.deleted && (
                            <div
                              className={`text-xs text-muted-foreground mb-1 px-2 py-1 rounded bg-muted/50 ${isCurrentUser ? "text-right" : "text-left"}`}
                            >
                              <span className="font-medium">{message.replyTo.senderName}</span>
                              <p className="truncate max-w-[200px]">{message.replyTo.text}</p>
                            </div>
                          )}
                          <div className="relative">
                            <div
                              className={`rounded-lg px-4 py-2 inline-block ${
                                isCurrentUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                              }`}
                            >
                              {message.deleted ? (
                                <p
                                  className={`text-sm italic ${
                                    isCurrentUser ? "text-primary-foreground/70" : "text-foreground/70"
                                  }`}
                                >
                                  This message was deleted
                                </p>
                              ) : (
                                <div className="text-sm">
                                  <MarkdownMessage content={message.text} className="whitespace-pre-wrap break-words" />
                                  {message.edited && (
                                    <span
                                      className={`text-xs ml-2 ${
                                        isCurrentUser ? "text-primary-foreground/70" : "text-foreground/70"
                                      }`}
                                    >
                                      (edited)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {!message.deleted && (
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 ${isCurrentUser ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
                              >
                                <Popover
                                  open={openReactionPopoverId === message.id}
                                  onOpenChange={(open) => setOpenReactionPopoverId(open ? message.id : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-6 w-6">
                                      <Smile className="h-3 w-3" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <div className="flex gap-1">
                                      {commonEmojis.map((emoji) => {
                                        const hasReacted = message.reactions?.[emoji]?.includes(loggedInUser?.id || "");
                                        return (
                                          <button
                                            key={emoji}
                                            onClick={() => handleToggleReaction(message.id, emoji)}
                                            className={`text-lg hover:bg-muted p-1 rounded transition-colors ${
                                              hasReacted ? "bg-primary/20 border border-primary" : ""
                                            }`}
                                          >
                                            {emoji}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => handleReply(message)}
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                                {isCurrentUser && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => startEditMessage(message)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <AlertDialog
                                      open={deleteMessageId === message.id}
                                      onOpenChange={(open) => setDeleteMessageId(open ? message.id : null)}
                                    >
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Message</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this message? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel onClick={() => setDeleteMessageId(null)}>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => {
                                              if (deleteMessageId) {
                                                handleDeleteMessage(deleteMessageId);
                                                setDeleteMessageId(null);
                                              }
                                            }}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {Object.keys(message.reactions || {}).length > 0 && !message.deleted && (
                            <div
                              className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                            >
                              {Object.entries(message.reactions).map(([emoji, users]) => {
                                if (users.length === 0) return null;
                                const userNames = getReactionUserNames(users);
                                return (
                                  <div key={emoji} className="relative inline-block group/reaction">
                                    <button
                                      onClick={() => handleToggleReaction(message.id, emoji)}
                                      className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                        users.includes(loggedInUser?.id || "")
                                          ? "bg-primary/20 border-primary"
                                          : "bg-muted border-border hover:bg-muted/80"
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{users.length}</span>
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-md shadow-md text-xs opacity-0 invisible group-hover/reaction:opacity-100 group-hover/reaction:visible transition-all duration-200 z-[100] pointer-events-none min-w-[120px]">
                                      <p className="font-medium mb-1 text-foreground">Reacted by:</p>
                                      <div className="space-y-0.5">
                                        {userNames.map((name, index) => (
                                          <p key={index} className="text-muted-foreground">
                                            {name}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                    <span>
                      {typingUsers.length === 1
                        ? `${typingUsers[0].userName} is typing...`
                        : typingUsers.length === 2
                          ? `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`
                          : `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing...`}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-card relative">
              {replyingToMessage && (
                <div className="flex items-center justify-between mb-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">Replying to </span>
                    <span className="text-xs font-medium">{replyingToMessage.senderName}</span>
                    <p className="text-sm text-muted-foreground truncate">{replyingToMessage.text}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={cancelReply}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {editingMessageId && selectedChannel?.messages.find((m) => m.id === editingMessageId) && (
                <div className="flex items-center justify-between mb-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">Editing message</span>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedChannel.messages.find((m) => m.id === editingMessageId)?.text}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={cancelEditMessage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {showFormatToolbar && (
                <div className="absolute bottom-full left-4 right-4 mb-2">
                  <MessageFormatToolbar onFormatClick={handleFormatClick} />
                </div>
              )}
              <div className="flex items-end gap-2">
                <Textarea
                  ref={messageInputRef}
                  placeholder={
                    editingMessageId ? "Edit your message..." : `Message #${selectedChannel.name.toLowerCase()}`
                  }
                  value={editingMessageId ? editingMessageText : messageInput}
                  onChange={(e) => {
                    if (editingMessageId) {
                      setEditingMessageText(e.target.value);
                    } else {
                      setMessageInput(e.target.value);
                      if (e.target.value.trim()) {
                        handleTyping();
                      } else {
                        if (selectedChannelId && loggedInUser) {
                          updateTypingStatus(false);
                        }
                      }
                    }
                  }}
                  onFocus={() => setShowFormatToolbar(true)}
                  onBlur={(e) => {
                    setTimeout(() => {
                      if (!e.relatedTarget?.closest(".format-toolbar")) {
                        setShowFormatToolbar(false);
                      }
                      if (!editingMessageId) {
                        handleInputBlur();
                      }
                    }, 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (editingMessageId) {
                        handleEditMessage(editingMessageId, editingMessageText);
                      } else {
                        handleSendMessage();
                      }
                    } else if (e.key === "Escape" && editingMessageId) {
                      cancelEditMessage();
                    }
                  }}
                  rows={1}
                  className="flex-1 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
                  style={{
                    height: "auto"
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = Math.min(target.scrollHeight, 200) + "px";
                  }}
                />
                <Button
                  onClick={() => {
                    if (editingMessageId) {
                      handleEditMessage(editingMessageId, editingMessageText);
                    } else {
                      handleSendMessage();
                    }
                  }}
                  disabled={
                    editingMessageId
                      ? !editingMessageText.trim() || isSendingMessage
                      : !messageInput.trim() || isSendingMessage
                  }
                  size="icon"
                >
                  {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No channel selected</h3>
              <p className="text-muted-foreground">Select a channel from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={showAddMemberDialog !== null}
        onOpenChange={(open) => {
          if (open) {
            if (showAddMemberDialog) {
              addMemberDialogChannelIdRef.current = showAddMemberDialog;
            }
          } else {
            setShowAddMemberDialog(null);
            setTimeout(() => {
              addMemberDialogChannelIdRef.current = null;
            }, 200);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>Select team members to add to this channel</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : teamMembers.length > 0 ? (
                teamMembers.map((member) => {
                  const channelId = showAddMemberDialog || addMemberDialogChannelIdRef.current;
                  const channel = channels.find((c) => c.id === channelId);
                  const isMember = channel?.members.some((m) => m.id === member.id);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profileImage || member.avatar} />
                          <AvatarFallback>
                            {getInitials(`${member.firstName || ""} ${member.lastName || ""}`.trim() || "User")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {`${member.firstName || ""} ${member.lastName || ""}`.trim() || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email || ""}</p>
                        </div>
                      </div>
                      {isMember ? (
                        <Badge variant="secondary">Already Added</Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={addingMemberId === member.id || !!addingMemberId}
                          onClick={(e) => {
                            e.stopPropagation();
                            const channelId = showAddMemberDialog || addMemberDialogChannelIdRef.current;
                            if (channelId && member.id) {
                              handleAddMember(channelId, member.id);
                            }
                          }}
                        >
                          {addingMemberId === member.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Add
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">No team members added yet</p>
                  <p className="text-sm text-muted-foreground">
                    Please add members to your team first before adding them to channels
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMemberDialog(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveMemberDialog !== null} onOpenChange={(open) => !open && setShowRemoveMemberDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Channel Members</DialogTitle>
            <DialogDescription>Manage channel members and their roles</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {showRemoveMemberDialog &&
                channels
                  .find((c) => c.id === showRemoveMemberDialog)
                  ?.members.map((member) => {
                    const channel = channels.find((c) => c.id === showRemoveMemberDialog);
                    const canManage = channel ? isCreatorOrAdmin(channel) : false;
                    const isCreator =
                      channel?.createdBy &&
                      (channel.createdBy === member.id || String(channel.createdBy) === String(member.id));
                    const isCurrentUserCreator = !!(
                      channel?.createdBy &&
                      loggedInUser &&
                      (channel.createdBy === loggedInUser.id || String(channel.createdBy) === String(loggedInUser.id))
                    );
                    const adminMembers = channel?.members.filter((m) => m.role === "ADMIN") || [];
                    const isLastAdmin = member.role === "ADMIN" && adminMembers.length === 1;
                    const isCurrentUser =
                      loggedInUser && (member.id === loggedInUser.id || String(member.id) === String(loggedInUser.id));
                    const canChangeRoleOrRemove = !isCreator && (isCurrentUserCreator || member.role !== "ADMIN");

                    const displayName = member.name || "User";
                    const displayEmail = member.email || "";

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarImage src={member.avatar ? member.avatar : undefined} alt={displayName} />
                            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{displayName}</p>
                            {displayEmail && <p className="text-xs text-muted-foreground">{displayEmail}</p>}
                            <div className="flex gap-1 mt-1">
                              {isCreator && (
                                <Badge variant="secondary" className="text-xs">
                                  Creator
                                </Badge>
                              )}
                              {member.role === "ADMIN" && (
                                <Badge variant="secondary" className="text-xs">
                                  Admin
                                </Badge>
                              )}
                              {!isCreator && member.role === "MEMBER" && (
                                <Badge variant="outline" className="text-xs">
                                  Member
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-2">
                            {canChangeRoleOrRemove && (
                              <Select
                                value={member.role}
                                onValueChange={(value: "ADMIN" | "MEMBER") => {
                                  if (showRemoveMemberDialog && value !== member.role) {
                                    handleChangeMemberRole(showRemoveMemberDialog, member.id, value);
                                  }
                                }}
                                disabled={!!isCurrentUser || changingRoleMemberId === member.id}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MEMBER">Member</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {canChangeRoleOrRemove && !isLastAdmin && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={removingMemberId === member.id}
                                onClick={() =>
                                  showRemoveMemberDialog && handleRemoveMember(showRemoveMemberDialog, member.id)
                                }
                              >
                                {removingMemberId === member.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removing...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              {showRemoveMemberDialog &&
                channels.find((c) => c.id === showRemoveMemberDialog)?.members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No members found</div>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveMemberDialog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
