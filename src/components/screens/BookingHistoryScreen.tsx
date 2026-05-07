import { useState } from "react";

interface Booking {
  id: string;
  provider: string;
  providerIcon: string;
  type: string;
  date: string;
  time: string;
  status: "completed" | "active" | "cancelled";
  amount: string;
  rating?: number;
  location: string;
  vehicle: string;
  duration?: string;
  serviceNotes?: string;
}

const bookings: Booking[] = [
  {
    id: "RA-2041",
    provider: "Emeka Okafor Towing",
    providerIcon: "🚐",
    type: "Tow van",
    date: "28 Apr 2026",
    time: "2:14 PM",
    status: "active",
    amount: "₦12,128",
    location: "Awolowo Way, Ikeja",
    vehicle: "Toyota Camry (white)",
    duration: "In progress",
    serviceNotes: "Flat tyre, vehicle unable to move",
  },
  {
    id: "RA-2035",
    provider: "Chidi AutoFix Mobile",
    providerIcon: "🔩",
    type: "Mobile mechanic",
    date: "25 Apr 2026",
    time: "10:30 AM",
    status: "completed",
    amount: "₦8,500",
    rating: 5,
    location: "Maryland, Lagos",
    vehicle: "Honda Accord",
    duration: "1h 20m",
    serviceNotes: "Engine overheating — replaced thermostat",
  },
  {
    id: "RA-2028",
    provider: "Femi Tyres & Vulcanizer",
    providerIcon: "🔧",
    type: "Vulcanizer",
    date: "20 Apr 2026",
    time: "4:45 PM",
    status: "completed",
    amount: "₦4,200",
    rating: 4,
    location: "Ojota, Lagos",
    vehicle: "Toyota Corolla",
    duration: "35m",
    serviceNotes: "Rear left tyre puncture repair",
  },
  {
    id: "RA-2019",
    provider: "Lagos Rescue Co.",
    providerIcon: "🚐",
    type: "Tow van",
    date: "14 Apr 2026",
    time: "8:12 AM",
    status: "cancelled",
    amount: "₦0",
    location: "Alausa, Ikeja",
    vehicle: "Kia Rio",
    duration: "—",
    serviceNotes: "Cancelled by user before provider arrival",
  },
  {
    id: "RA-2011",
    provider: "Tunde Fix-It Mobile",
    providerIcon: "🔧",
    type: "Vulcanizer",
    date: "8 Apr 2026",
    time: "1:20 PM",
    status: "completed",
    amount: "₦3,800",
    rating: 4,
    location: "Yaba, Lagos",
    vehicle: "Hyundai Elantra",
    duration: "25m",
    serviceNotes: "Front right tyre patch",
  },
];

const statusStyles = {
  active: "bg-info-light text-info",
  completed: "bg-primary-light text-primary",
  cancelled: "bg-destructive-light text-destructive",
};

const statusLabels = {
  active: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/* ─── Receipt Modal ─── */
const ReceiptModal = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={onClose}>
    <div
      className="bg-card border border-border rounded-xl w-[92%] max-w-[380px] p-5 shadow-lg animate-scale-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center mb-4">
        <div className="text-2xl mb-1">🧾</div>
        <h3 className="text-[15px] font-bold">Payment Receipt</h3>
        <p className="text-[11px] text-muted-foreground">Transaction #{booking.id}</p>
      </div>

      <div className="space-y-2.5 text-[12px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{booking.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Provider</span>
          <span className="font-medium">{booking.provider}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">{booking.date} · {booking.time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Location</span>
          <span className="font-medium text-right max-w-[180px]">{booking.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Vehicle</span>
          <span className="font-medium">{booking.vehicle}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">{booking.duration}</span>
        </div>
        <div className="border-t border-border my-2" />
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold">Total Paid</span>
          <span className="font-bold text-primary">{booking.amount}</span>
        </div>
      </div>

      <div className="mt-4 p-2.5 rounded-lg bg-background text-center">
        <div className="text-[10px] text-muted-foreground mb-0.5">Reference</div>
        <div className="text-[12px] font-mono font-semibold tracking-wider">TXN-{booking.id}-{booking.date.replace(/\s/g, "").toUpperCase()}</div>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer border-none"
      >
        Close
      </button>
    </div>
  </div>
);

/* ─── Detail Modal ─── */
const DetailModal = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={onClose}>
    <div
      className="bg-card border border-border rounded-xl w-[92%] max-w-[380px] p-5 shadow-lg animate-scale-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-[48px] h-[48px] rounded-lg bg-background flex items-center justify-center text-xl shrink-0">
          {booking.providerIcon}
        </div>
        <div>
          <h3 className="text-[14px] font-bold">{booking.provider}</h3>
          <p className="text-[11px] text-muted-foreground">{booking.type} · #{booking.id}</p>
        </div>
        <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusStyles[booking.status]}`}>
          {statusLabels[booking.status]}
        </span>
      </div>

      <div className="space-y-3 text-[12px]">
        <div>
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Timeline</div>
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{booking.date} at {booking.time}</span>
            {booking.duration && booking.duration !== "—" && (
              <span className="text-muted-foreground">· {booking.duration}</span>
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Location</div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>{booking.location}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Vehicle</div>
          <div className="flex items-center gap-2">
            <span>🚗</span>
            <span>{booking.vehicle}</span>
          </div>
        </div>

        {booking.serviceNotes && (
          <div>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Service Notes</div>
            <div className="p-2.5 rounded-lg bg-background text-[12px]">
              {booking.serviceNotes}
            </div>
          </div>
        )}

        <div>
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Pricing</div>
          <div className="flex items-center gap-2">
            <span>💰</span>
            <span className="font-semibold text-primary">{booking.amount}</span>
            {booking.status === "completed" && (
              <span className="text-[10px] text-muted-foreground ml-1">· Paid via escrow</span>
            )}
          </div>
        </div>

        {booking.rating && (
          <div>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Your Rating</div>
            <div className="text-[13px]" style={{ color: "#EF9F27" }}>
              {"★".repeat(booking.rating)}{"☆".repeat(5 - booking.rating)}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer border-none"
      >
        Close
      </button>
    </div>
  </div>
);

/* ─── Use Again Sheet ─── */
const UseAgainSheet = ({
  booking,
  onClose,
  onConfirm,
}: {
  booking: Booking;
  onClose: () => void;
  onConfirm: (preferSameProvider: boolean) => void;
}) => {
  const [preferSame, setPreferSame] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="bg-card border-t border-border rounded-t-2xl w-full max-w-[700px] p-5 shadow-lg animate-slide-up-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <h3 className="text-[15px] font-bold mb-1">Use this service again</h3>
        <p className="text-[11px] text-muted-foreground mb-4">
          We'll start a new <span className="font-medium text-foreground">{booking.type}</span> request at your current location with similar preferences.
        </p>

        {/* Previous service summary */}
        <div className="p-3 rounded-lg bg-background mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-[36px] h-[36px] rounded-lg bg-card flex items-center justify-center text-base shrink-0">
              {booking.providerIcon}
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-semibold">{booking.provider}</div>
              <div className="text-[10px] text-muted-foreground">
                {booking.type} · Previously {booking.amount}
              </div>
            </div>
            {booking.rating && (
              <div className="text-[11px]" style={{ color: "#EF9F27" }}>
                {"★".repeat(booking.rating)}
              </div>
            )}
          </div>
        </div>

        {/* Provider preference toggle */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold mb-2">Provider preference</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPreferSame(true)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
                preferSame
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              🔄 Request same provider
            </button>
            <button
              onClick={() => setPreferSame(false)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
                !preferSame
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              🔍 Find nearest available
            </button>
          </div>
          {preferSame && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              ⚠️ If this provider is unavailable, we'll automatically match you with the next best option.
            </p>
          )}
        </div>

        {/* What changes notice */}
        <div className="p-3 rounded-lg bg-background mb-4 space-y-1.5">
          <div className="text-[11px] font-semibold">What's different this time</div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span className="text-primary">📍</span> Location: Your <span className="font-medium text-foreground">current GPS location</span> (not the previous one)
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span className="text-primary">💰</span> Pricing: May vary based on <span className="font-medium text-foreground">distance & availability</span>
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span className="text-primary">🚗</span> Vehicle: <span className="font-medium text-foreground">{booking.vehicle}</span> (you can change during booking)
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(preferSame)}
            className="flex-[2] py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer border-none"
          >
            Continue — New {booking.type} Request
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Screen ─── */
const BookingHistoryScreen = () => {
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [useAgainBooking, setUseAgainBooking] = useState<Booking | null>(null);

  const handleUseAgainConfirm = (preferSameProvider: boolean) => {
    // In a real app, this would navigate to the booking flow pre-filled
    console.log("Use again:", useAgainBooking?.type, "prefer same provider:", preferSameProvider);
    setUseAgainBooking(null);
    // TODO: trigger workflow modal with pre-filled service type + current location
  };

  return (
    <div className="p-3.5 animate-fade-in">
      <h2 className="text-[15px] font-semibold mb-1">Booking History</h2>
      <p className="text-[11px] text-muted-foreground mb-3">
        Your past and active service requests
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card border border-border rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-primary">{bookings.filter(b => b.status === "completed").length}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Completed</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-info">{bookings.filter(b => b.status === "active").length}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Active</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-foreground">
            ₦{(bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + parseInt(b.amount.replace(/[₦,]/g, "") || "0"), 0) / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-muted-foreground font-medium">Total spent</div>
        </div>
      </div>

      {bookings.map((b) => (
        <div key={b.id} className="bg-card border border-border rounded-lg p-3 mb-2 animate-fade-in">
          <div className="flex items-start gap-2.5" onClick={() => setDetailBooking(b)} role="button" tabIndex={0}>
            <div className="w-[42px] h-[42px] rounded-lg bg-background flex items-center justify-center text-lg shrink-0">
              {b.providerIcon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[13px] font-semibold">{b.provider}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{b.type} · {b.location}</div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusStyles[b.status]}`}>
                  {statusLabels[b.status]}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">#{b.id}</span> · {b.date} · {b.time}
                </div>
                <div className="text-xs font-semibold text-primary">{b.amount}</div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">🚗 {b.vehicle}</div>
              {b.rating && (
                <div className="text-[11px] mt-1" style={{ color: "#EF9F27" }}>
                  {"★".repeat(b.rating)}{"☆".repeat(5 - b.rating)}
                </div>
              )}
            </div>
          </div>

          {b.status === "active" && (
            <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-border">
              <button className="flex-1 py-2 rounded-md border-none bg-primary-mid text-primary-foreground text-xs font-semibold cursor-pointer">
                Track live
              </button>
              <button className="flex-1 py-2 rounded-md border border-border bg-card text-muted-foreground text-xs font-medium cursor-pointer">
                Contact provider
              </button>
            </div>
          )}

          {b.status === "completed" && (
            <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-border">
              <button
                onClick={() => setDetailBooking(b)}
                className="flex-1 py-2 rounded-md border border-border bg-card text-muted-foreground text-xs font-medium cursor-pointer"
              >
                View details
              </button>
              <button
                onClick={() => setReceiptBooking(b)}
                className="flex-1 py-2 rounded-md border border-border bg-card text-muted-foreground text-xs font-medium cursor-pointer"
              >
                Receipt
              </button>
              <button
                onClick={() => setUseAgainBooking(b)}
                className="flex-1 py-2 rounded-md border-none bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
              >
                Use again
              </button>
            </div>
          )}

          {b.status === "cancelled" && (
            <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-border">
              <button
                onClick={() => setDetailBooking(b)}
                className="flex-1 py-2 rounded-md border border-border bg-card text-muted-foreground text-xs font-medium cursor-pointer"
              >
                View details
              </button>
              <button
                onClick={() => setUseAgainBooking(b)}
                className="flex-1 py-2 rounded-md border-none bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Modals */}
      {receiptBooking && <ReceiptModal booking={receiptBooking} onClose={() => setReceiptBooking(null)} />}
      {detailBooking && <DetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />}
      {useAgainBooking && (
        <UseAgainSheet
          booking={useAgainBooking}
          onClose={() => setUseAgainBooking(null)}
          onConfirm={handleUseAgainConfirm}
        />
      )}
    </div>
  );
};

export default BookingHistoryScreen;
