import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Bell,
  Check,
  Trash2,
  Filter,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useNotifications, Notification } from "./notification-context";

// Toast Notification Component
export const NotificationToast: React.FC<{
  notification: Notification;
  onClose: () => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}> = ({ notification, onClose, position = "top-right" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);

    // Auto-close after 5 seconds
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const getToastStyle = (type: string) => {
    switch (type) {
      case "signature_request":
        return "border-blue-400 bg-blue-50 text-blue-800";
      case "document_signed":
        return "border-green-400 bg-green-50 text-green-800";
      case "document_ready":
        return "border-purple-400 bg-purple-50 text-purple-800";
      case "document_published":
        return "border-yellow-400 bg-yellow-50 text-yellow-800";
      case "signing_reminder":
        return "border-orange-400 bg-orange-50 text-orange-800";
      default:
        return "border-gray-400 bg-gray-50 text-gray-800";
    }
  };

  const getPositionClasses = () => {
    const base = "fixed z-50 max-w-sm w-full";
    switch (position) {
      case "top-left":
        return `${base} top-4 left-4`;
      case "bottom-right":
        return `${base} bottom-4 right-4`;
      case "bottom-left":
        return `${base} bottom-4 left-4`;
      default:
        return `${base} top-4 right-4`;
    }
  };

  return (
    <div
      className={`
        ${getPositionClasses()} 
        border-l-4 rounded-lg shadow-lg p-4 
        ${getToastStyle(notification.type)}
        transform transition-all duration-300 ease-in-out
        ${
          isVisible && !isExiting
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.title}</p>
          <p className="text-sm mt-1 opacity-90">{notification.message}</p>
          {notification.documentTitle && (
            <p className="text-xs mt-1 opacity-75">
              📄 {notification.documentTitle}
            </p>
          )}
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className="text-xs font-medium underline mt-2 inline-block hover:no-underline"
            >
              Take Action →
            </a>
          )}
        </div>
        <button
          onClick={handleClose}
          className="ml-4 text-current opacity-60 hover:opacity-80 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-bl-lg animate-[shrink_5s_linear_forwards]"
        style={{
          animationName: "shrink",
          animationDuration: "5s",
          animationTimingFunction: "linear",
          animationFillMode: "forwards",
        }}
      />
    </div>
  );
};

// Toast Container Hook
export const useNotificationToast = () => {
  const [toasts, setToasts] = useState<(Notification & { toastId: string })[]>(
    []
  );

  const showToast = useCallback((notification: Notification) => {
    const toastId = `${notification.id}-${Date.now()}`;
    const toast = { ...notification, toastId };

    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const ToastContainer = useCallback(
    () => (
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.toastId} className="pointer-events-auto">
            <NotificationToast
              notification={toast}
              onClose={() => removeToast(toast.toastId)}
            />
          </div>
        ))}
      </div>
    ),
    [toasts, removeToast]
  );

  return { showToast, removeToast, ToastContainer, toasts };
};

export const NotificationPage: React.FC = () => {
  const {
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
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedNotifications, setSelectedNotifications] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return notification.status === "unread";
    if (filter === "read") return notification.status === "read";
    return true;
  });

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const handleBulkMarkAsRead = async () => {
    const promises = Array.from(selectedNotifications)
      .filter(
        (id) => notifications.find((n) => n.id === id)?.status === "unread"
      )
      .map((id) => markAsRead(id));

    await Promise.all(promises);
    setSelectedNotifications(new Set());
  };

  const handleBulkDelete = async () => {
    const promises = Array.from(selectedNotifications).map((id) =>
      deleteNotification(id)
    );
    await Promise.all(promises);
    setSelectedNotifications(new Set());
  };

  const getNotificationIcon = (type: string) => {
    // Reuse the same icon logic from NotificationBell
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Notifications
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>{unreadCount} unread</span>
                <span>•</span>
                <span>{notifications.length} total</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                  <span>{isConnected ? "Live updates" : "Offline mode"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={refreshNotifications}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Filters and Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All notifications</option>
                <option value="unread">Unread only</option>
                <option value="read">Read only</option>
              </select>

              {/* Select All Checkbox */}
              {filteredNotifications.length > 0 && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedNotifications.size ===
                        filteredNotifications.length &&
                      filteredNotifications.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Select all ({selectedNotifications.size})
                  </span>
                </label>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.size > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkMarkAsRead}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark read
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-1 border border-red-300 rounded text-sm text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notifications
                </h3>
                <p className="text-gray-500">
                  {filter === "unread"
                    ? "You're all caught up! 🎉"
                    : filter === "read"
                    ? "No read notifications yet"
                    : "You'll see updates about your documents here"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all ${
                    notification.status === "unread"
                      ? "border-l-4 border-l-blue-400 bg-blue-50"
                      : ""
                  } ${
                    selectedNotifications.has(notification.id)
                      ? "ring-2 ring-blue-200"
                      : ""
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className={`text-lg font-medium text-gray-900 ${
                              notification.status === "unread"
                                ? "font-semibold"
                                : ""
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {notification.message}
                          </p>

                          {notification.documentTitle && (
                            <p className="text-sm text-gray-500 mt-2">
                              📄 Document: {notification.documentTitle}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 mt-4">
                            <span className="text-sm text-gray-400">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </span>

                            {notification.isRealTime && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                Live update
                              </span>
                            )}

                            {notification.status === "unread" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                Unread
                              </span>
                            )}

                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Take Action →
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {notification.status === "unread" && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
