import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllRead,
} from "../hooks/useNotifications";
import type { NotificationData } from "../api";

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllRead } = useMarkAllRead();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleNotificationClick(notification: NotificationData) {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  }

  function handleMarkAllRead() {
    markAllRead();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-700 bg-gray-800 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="text-sm font-semibold text-gray-200">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto divide-y divide-gray-700">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">
                No notifications
              </li>
            ) : (
              notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex gap-3 items-start ${
                      !notification.is_read ? "border-l-2 border-blue-500" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className={`flex-1 min-w-0 ${notification.is_read ? "pl-5" : ""}`}>
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
