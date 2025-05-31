import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  X,
  Check,
  Clock,
  AlertCircle,
  PenTool,
  FileText,
  Zap,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useNotifications, Notification } from "./notification-context";

export const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "signature_request":
        return <PenTool className="w-4 h-4 text-blue-600" />;
      case "document_signed":
        return <Check className="w-4 h-4 text-green-600" />;
      case "document_ready":
        return <FileText className="w-4 h-4 text-purple-600" />;
      case "document_published":
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case "signing_reminder":
        return <Clock className="w-4 h-4 text-orange-600" />;
      case "document_created":
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationPriority = (
    notification: Notification
  ): "high" | "medium" | "low" => {
    const priority = notification.metadata?.priority;
    if (priority === "high") return "high";
    if (priority === "medium") return "medium";

    // Default priorities based on type
    if (notification.type === "signature_request") return "high";
    if (notification.type === "document_ready") return "high";
    if (notification.type === "document_signed") return "medium";
    return "low";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read when clicked
    if (notification.status === "unread") {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
      setIsOpen(false);
    }
  };

  const handleMarkAsRead = async (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  // Sort notifications by priority and date
  const sortedNotifications = [...notifications].sort((a, b) => {
    // Sort by unread first, then by priority, then by date
    if (a.status !== b.status) {
      return a.status === "unread" ? -1 : 1;
    }

    const aPriority = getNotificationPriority(a);
    const bPriority = getNotificationPriority(b);
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    if (aPriority !== bPriority) {
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
        aria-label={`Notifications${
          unreadCount > 0 ? ` (${unreadCount} unread)` : ""
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-6 h-6" />

        {/* Connection Status Indicator */}
        <div
          className={`absolute -top-1 -left-1 w-3 h-3 rounded-full transition-colors ${
            isConnected ? "bg-green-400" : "bg-red-400"
          }`}
          title={
            isConnected
              ? "Connected - Real-time updates"
              : "Disconnected - Limited functionality"
          }
        />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 font-medium animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 flex flex-col"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    title="Mark all notifications as read"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Connection Status and Stats */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs text-gray-500">
                  {isConnected ? "Live updates enabled" : "Offline mode"}
                </span>
              </div>

              <span className="text-xs text-gray-500">
                {unreadCount} unread • {notifications.length} total
              </span>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700 flex-1">{error}</span>
                  <button
                    onClick={clearError}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">
                Loading notifications...
              </span>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto notification-scroll">
            {!isLoading && sortedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm mt-1">
                  You'll see updates about your documents here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sortedNotifications.map((notification) => {
                  const priority = getNotificationPriority(notification);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        notification.status === "unread"
                          ? "bg-blue-50 border-l-4 border-blue-400"
                          : ""
                      } ${
                        priority === "high" && notification.status === "unread"
                          ? "bg-red-50"
                          : priority === "medium" &&
                            notification.status === "unread"
                          ? "bg-yellow-50"
                          : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNotificationClick(notification);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <p
                                className={`text-sm font-medium text-gray-900 ${
                                  notification.status === "unread"
                                    ? "font-semibold"
                                    : ""
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>

                              {notification.documentTitle && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  📄 {notification.documentTitle}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-1 ml-2">
                              {notification.status === "unread" && (
                                <button
                                  onClick={(e) =>
                                    handleMarkAsRead(e, notification.id)
                                  }
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Mark as read"
                                  aria-label="Mark notification as read"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={(e) =>
                                  handleDelete(e, notification.id)
                                }
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete notification"
                                aria-label="Delete notification"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">
                                {formatTimeAgo(notification.createdAt)}
                              </span>

                              {notification.isRealTime && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                  Live
                                </span>
                              )}

                              {priority === "high" &&
                                notification.status === "unread" && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                                    Urgent
                                  </span>
                                )}

                              {priority === "medium" &&
                                notification.status === "unread" && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                    Important
                                  </span>
                                )}
                            </div>

                            {notification.actionUrl && (
                              <span className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium">
                                View →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isLoading && notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center flex-shrink-0">
              <a
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
