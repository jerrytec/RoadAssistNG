import { useState } from "react";

interface Notification {
  id: string;
  type: "booking" | "system" | "promo" | "alert";
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
}

const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "booking",
    title: "Provider en route",
    message: "Emeka Okafor Towing is 3 minutes away from your location.",
    time: "Just now",
    read: false,
    icon: "🚐",
  },
  {
    id: "n2",
    type: "booking",
    title: "Quote received",
    message: "Emeka Okafor Towing sent you a quote of ₦12,128 for towing service.",
    time: "5 min ago",
    read: false,
    icon: "💰",
  },
  {
    id: "n3",
    type: "alert",
    title: "High demand area",
    message: "Many requests in Ikeja right now. Wait times may be slightly longer.",
    time: "15 min ago",
    read: false,
    icon: "⚠️",
  },
  {
    id: "n4",
    type: "booking",
    title: "Service completed",
    message: "Your booking #RA-2035 with Chidi AutoFix Mobile has been completed. Don't forget to leave a review!",
    time: "3 days ago",
    read: true,
    icon: "✅",
  },
  {
    id: "n5",
    type: "promo",
    title: "20% off your next tow",
    message: "Use code ROADNG20 on your next booking. Valid until May 15.",
    time: "5 days ago",
    read: true,
    icon: "🎁",
  },
  {
    id: "n6",
    type: "system",
    title: "Profile verified",
    message: "Your NIN and BVN have been successfully verified. You're all set!",
    time: "1 week ago",
    read: true,
    icon: "🔐",
  },
  {
    id: "n7",
    type: "booking",
    title: "Booking cancelled",
    message: "Your booking #RA-2019 with Lagos Rescue Co. was cancelled.",
    time: "2 weeks ago",
    read: true,
    icon: "❌",
  },
];

const typeBorderColors = {
  booking: "border-l-primary-mid",
  alert: "border-l-accent",
  promo: "border-l-secondary",
  system: "border-l-info",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const NotificationsPanel = ({ open, onClose }: Props) => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center" onClick={onClose}>
      <div className="w-full max-w-[700px] relative">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-foreground/30" />

        {/* Panel */}
        <div
          className="absolute top-0 right-0 w-full max-w-[380px] h-full bg-card shadow-xl animate-slide-up overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-[15px] font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <span className="text-[10px] text-muted-foreground">{unreadCount} unread</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-primary font-medium bg-transparent border-none cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-background border-none cursor-pointer flex items-center justify-center text-sm text-muted-foreground"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-card border border-border rounded-lg rounded-l-none border-l-[3px] ${typeBorderColors[n.type]} p-3 mb-2 transition-colors ${
                  !n.read ? "bg-background" : ""
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold">{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary-mid shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">{n.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
