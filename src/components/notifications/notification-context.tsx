"use client";
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/no-unsafe-function-type */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/utils/const";

// Types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  documentId: string;
  documentTitle?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  status: "unread" | "read" | "dismissed";
  createdAt: string;
  readAt?: string;
  isRealTime?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  clearError: () => void;
}

// Context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Custom hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

class NotificationWebSocketService {
  private socket: Socket | null = null;
  private readonly callbacks: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;

  connect(userAddress: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Disconnect existing connection
        if (this.socket) {
          this.socket.disconnect();
        }

        const backendUrl = API_BASE_URL;

        this.socket = io(`${backendUrl}/notifications`, {
          transports: ["websocket", "polling"],
          timeout: 10000,
          forceNew: true,
        });

        this.socket.on("connect", () => {
          console.log("🔌 Connected to notification service");
          this.reconnectAttempts = 0;

          // Authenticate with user address
          this.socket?.emit("authenticate", { userAddress });
        });

        this.socket.on("authenticated", (data) => {
          console.log("✅ Authenticated:", data);
          this.trigger("authenticated", data);
          resolve(true);
        });

        this.socket.on("disconnect", (reason) => {
          console.log("🔌 Disconnected from notification service:", reason);
          this.trigger("disconnect", reason);

          // Auto-reconnect if not intentional
          if (reason === "io server disconnect") {
            // Server disconnected, try to reconnect
            this.handleReconnect(userAddress);
          }
        });

        this.socket.on("connect_error", (error) => {
          console.error("❌ Socket connection error:", error);
          this.trigger("error", error);
          this.handleReconnect(userAddress);
          reject(error);
        });

        this.socket.on("error", (error) => {
          console.error("❌ Socket error:", error);
          this.trigger("error", error);
        });

        this.socket.on("newNotification", (notification) => {
          console.log("📨 New notification received:", notification);
          this.trigger("newNotification", notification);
        });

        this.socket.on("unreadCountUpdated", (data) => {
          console.log("🔢 Unread count updated:", data);
          this.trigger("unreadCountUpdated", data);
        });

        this.socket.on("notificationUpdated", (data) => {
          console.log("🔄 Notification updated:", data);
          this.trigger("notificationUpdated", data);
        });

        this.socket.on("allNotificationsRead", () => {
          console.log("✅ All notifications marked as read");
          this.trigger("allNotificationsRead");
        });

        // Connection timeout
        setTimeout(() => {
          if (!this.socket?.connected) {
            reject(new Error("Connection timeout"));
          }
        }, 15000);
      } catch (error) {
        console.error("❌ Failed to connect:", error);
        reject(error);
      }
    });
  }

  private handleReconnect(userAddress: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

      console.log(
        `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
      );

      setTimeout(() => {
        this.connect(userAddress).catch(console.error);
      }, delay);
    } else {
      console.error("❌ Max reconnection attempts reached");
      this.trigger("maxReconnectAttemptsReached");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private trigger(event: string, data?: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in callback for event ${event}:`, error);
        }
      });
    }
  }

  // Socket methods
  getNotifications(options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("getNotifications", options);
    }
  }

  markAsRead(notificationId: string) {
    if (this.socket?.connected) {
      this.socket.emit("markAsRead", { notificationId });
    }
  }

  markAllAsRead() {
    if (this.socket?.connected) {
      this.socket.emit("markAllAsRead");
    }
  }
}

// Provider Component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const currentAccount = useCurrentAccount();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsService = useRef<NotificationWebSocketService | null>(null);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load notifications from REST API
  const refreshNotifications = useCallback(async () => {
    if (!currentAccount?.address) return;

    setIsLoading(true);
    setError(null);

    try {
      const backendUrl = API_BASE_URL;
      const response = await fetch(
        `${backendUrl}/notifications/${currentAccount.address}?limit=50`
      );

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data.notifications || []);
        setUnreadCount(result.data.unreadCount || 0);
      } else {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount?.address]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!currentAccount?.address) {
      // Disconnect if no account
      if (wsService.current) {
        wsService.current.disconnect();
        wsService.current = null;
      }
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      return;
    }

    // Connect to WebSocket
    const connectToWebSocket = async () => {
      try {
        setIsLoading(true);
        setError(null);

        wsService.current = new NotificationWebSocketService();

        // Set up event listeners
        wsService.current.on("authenticated", (data: any) => {
          setIsConnected(true);
          setError(null);

          // Load initial notifications from the authentication response
          if (data.recentNotifications) {
            setNotifications(data.recentNotifications);
          }
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }

          // Also refresh from API to ensure we have the latest
          refreshNotifications();
        });

        wsService.current.on(
          "newNotification",
          (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show browser notification if permission granted
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(notification.title, {
                body: notification.message,
                icon: "/favicon.ico",
                tag: notification.id,
              });
            }
          }
        );

        wsService.current.on(
          "unreadCountUpdated",
          (data: { unreadCount: number }) => {
            setUnreadCount(data.unreadCount);
          }
        );

        wsService.current.on(
          "notificationUpdated",
          (data: { notificationId: string; status: string }) => {
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.id === data.notificationId
                  ? {
                      ...notif,
                      status: data.status as any,
                      readAt:
                        data.status === "read"
                          ? new Date().toISOString()
                          : notif.readAt,
                    }
                  : notif
              )
            );
          }
        );

        wsService.current.on("allNotificationsRead", () => {
          setNotifications((prev) =>
            prev.map((notif) => ({
              ...notif,
              status: "read" as any,
              readAt: new Date().toISOString(),
            }))
          );
          setUnreadCount(0);
        });

        wsService.current.on("disconnect", (reason: string) => {
          setIsConnected(false);
          if (reason !== "io client disconnect") {
            setError("Connection lost. Attempting to reconnect...");
          }
        });

        wsService.current.on("error", (error: any) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
          setError("Connection error. Please refresh the page.");
        });

        wsService.current.on("maxReconnectAttemptsReached", () => {
          setError("Unable to maintain connection. Please refresh the page.");
        });

        // Connect
        await wsService.current.connect(currentAccount.address);
      } catch (error: any) {
        console.error("Failed to connect to notification service:", error);
        setIsConnected(false);
        setError("Failed to connect to notification service");

        // Fallback to REST API only
        refreshNotifications();
      } finally {
        setIsLoading(false);
      }
    };

    connectToWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
        wsService.current = null;
      }
    };
  }, [currentAccount?.address, refreshNotifications]);

  // Request notification permission
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  // API Methods
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!currentAccount?.address) return;

      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? {
                ...notif,
                status: "read" as any,
                readAt: new Date().toISOString(),
              }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        // Use WebSocket if connected
        if (wsService.current?.isConnected()) {
          wsService.current.markAsRead(notificationId);
        } else {
          // Fallback to REST API
          const backendUrl = API_BASE_URL;
          const response = await fetch(
            `${backendUrl}/notifications/${notificationId}/read`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userAddress: currentAccount.address }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to mark notification as read");
          }
        }
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        // Revert optimistic update
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, status: "unread" as any, readAt: undefined }
              : notif
          )
        );
        setUnreadCount((prev) => prev + 1);
      }
    },
    [currentAccount?.address]
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentAccount?.address) return;

    // Optimistically update UI
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((prev) =>
      prev.map((notif) => ({
        ...notif,
        status: "read" as any,
        readAt: new Date().toISOString(),
      }))
    );
    setUnreadCount(0);

    try {
      // Use WebSocket if connected
      if (wsService.current?.isConnected()) {
        wsService.current.markAllAsRead();
      } else {
        // Fallback to REST API
        const backendUrl = API_BASE_URL;
        const response = await fetch(
          `${backendUrl}/notifications/${currentAccount.address}/read-all`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to mark all notifications as read");
        }
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      // Revert optimistic update
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }, [currentAccount?.address, notifications, unreadCount]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!currentAccount?.address) return;

      // Optimistically update UI
      const notificationToDelete = notifications.find(
        (n) => n.id === notificationId
      );
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
      if (notificationToDelete?.status === "unread") {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        const backendUrl = API_BASE_URL;
        const response = await fetch(
          `${backendUrl}/notifications/${notificationId}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userAddress: currentAccount.address }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete notification");
        }
      } catch (error) {
        console.error("Failed to delete notification:", error);
        // Revert optimistic update
        if (notificationToDelete) {
          setNotifications((prev) => [notificationToDelete, ...prev]);
          if (notificationToDelete.status === "unread") {
            setUnreadCount((prev) => prev + 1);
          }
        }
      }
    },
    [currentAccount?.address, notifications]
  );

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
