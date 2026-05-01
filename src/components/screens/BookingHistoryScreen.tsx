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

const BookingHistoryScreen = () => {
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
          <div className="flex items-start gap-2.5">
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
              <button className="flex-1 py-2 rounded-md border border-border bg-card text-muted-foreground text-xs font-medium cursor-pointer">
                View receipt
              </button>
              <button className="flex-1 py-2 rounded-md border-none bg-primary text-primary-foreground text-xs font-semibold cursor-pointer">
                Rebook
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BookingHistoryScreen;
