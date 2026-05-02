import { useState } from "react";

type PayMethod = "card" | "bank" | "ussd";
type PayStep = "select" | "details" | "processing" | "success" | "failed";

const cardBrands = [
  { name: "Visa", icon: "💳" },
  { name: "Mastercard", icon: "💳" },
  { name: "Verve", icon: "💳" },
];

const banks = [
  { name: "GTBank", code: "058", icon: "🏦" },
  { name: "First Bank", code: "011", icon: "🏦" },
  { name: "Zenith Bank", code: "057", icon: "🏦" },
  { name: "Access Bank", code: "044", icon: "🏦" },
  { name: "UBA", code: "033", icon: "🏦" },
  { name: "Kuda Bank", code: "090267", icon: "🏦" },
];

const ussdCodes = [
  { bank: "GTBank", code: "*737*Amount*MerchantCode#" },
  { bank: "First Bank", code: "*894*Amount#" },
  { bank: "Zenith Bank", code: "*966*Amount*MerchantCode#" },
  { bank: "Access Bank", code: "*901*Amount#" },
  { bank: "UBA", code: "*919*Amount#" },
  { bank: "Stanbic IBTC", code: "*909*Amount#" },
];

const PaymentGatewayScreen = () => {
  const [method, setMethod] = useState<PayMethod>("card");
  const [step, setStep] = useState<PayStep>("select");
  const [amount] = useState(12128);

  // Card state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // Bank state
  const [selectedBank, setSelectedBank] = useState("");

  // USSD state
  const [selectedUssd, setSelectedUssd] = useState("");

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => {
      setStep(Math.random() > 0.1 ? "success" : "failed");
    }, 2500);
  };

  const reset = () => {
    setStep("select");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCardName("");
    setSelectedBank("");
    setSelectedUssd("");
  };

  const canProceed = () => {
    if (method === "card") return cardNumber.replace(/\s/g, "").length === 16 && expiry.length === 5 && cvv.length >= 3 && cardName.length > 1;
    if (method === "bank") return selectedBank !== "";
    if (method === "ussd") return selectedUssd !== "";
    return false;
  };

  // Processing screen
  if (step === "processing") {
    return (
      <div className="p-4">
        <div className="bg-card rounded-xl p-8 text-center border border-border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">Processing Payment</h3>
          <p className="text-xs text-muted-foreground">Please do not close this page...</p>
          <div className="mt-4 bg-background rounded-lg p-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-foreground">₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium text-foreground capitalize">{method === "ussd" ? "USSD" : method === "bank" ? "Bank Transfer" : "Card"}</span>
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-foreground text-[10px]">RA-{Date.now().toString(36).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (step === "success") {
    return (
      <div className="p-4">
        <div className="bg-card rounded-xl p-6 text-center border border-border">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-lg font-bold text-primary mb-1">Payment Successful!</h3>
          <p className="text-xs text-muted-foreground mb-4">Your transaction has been completed successfully.</p>
          <div className="bg-primary-light rounded-lg p-4 mb-4 text-left">
            {[
              { l: "Amount Paid", v: `₦${amount.toLocaleString()}` },
              { l: "Payment Method", v: method === "ussd" ? "USSD" : method === "bank" ? "Bank Transfer" : "Debit Card" },
              { l: "Transaction ID", v: `TXN-${Date.now().toString(36).toUpperCase()}` },
              { l: "Date", v: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
              { l: "Status", v: "Confirmed" },
            ].map((item) => (
              <div key={item.l} className="flex justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground">{item.l}</span>
                <span className="font-medium text-foreground">{item.v}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">A receipt has been sent to your registered phone number via SMS.</p>
          <button onClick={reset} className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold border-none cursor-pointer">
            Done ✓
          </button>
        </div>
      </div>
    );
  }

  // Failed screen
  if (step === "failed") {
    return (
      <div className="p-4">
        <div className="bg-card rounded-xl p-6 text-center border border-border">
          <div className="text-5xl mb-3">❌</div>
          <h3 className="text-lg font-bold text-destructive mb-1">Payment Failed</h3>
          <p className="text-xs text-muted-foreground mb-4">We couldn't process your payment. Please try again or use a different method.</p>
          <div className="bg-destructive-light rounded-lg p-3 mb-4">
            <p className="text-xs text-destructive font-medium">Error: Transaction declined by your bank. Please contact your bank or try another payment method.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium cursor-pointer">
              Try Again
            </button>
            <button onClick={() => { setMethod("bank"); reset(); }} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold border-none cursor-pointer">
              Use Different Method
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Amount Header */}
      <div className="bg-card rounded-xl p-4 mb-3 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Amount</p>
            <p className="text-2xl font-bold text-foreground">₦{amount.toLocaleString()}</p>
          </div>
          <div className="bg-primary-light px-3 py-1.5 rounded-full">
            <span className="text-[11px] font-semibold text-primary">🔒 Secured</span>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {(["card", "bank", "ussd"] as PayMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                method === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {m === "card" ? "💳 Card" : m === "bank" ? "🏦 Bank" : "📱 USSD"}
            </button>
          ))}
        </div>
      </div>

      {/* Card Payment */}
      {method === "card" && (
        <div className="bg-card rounded-xl p-4 border border-border animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">Card Details</h3>
            <div className="flex gap-1">
              {cardBrands.map((b) => (
                <span key={b.name} className="text-[10px] bg-background px-1.5 py-0.5 rounded text-muted-foreground border border-border">{b.name}</span>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Card Number</label>
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                placeholder="0000 0000 0000 0000"
                className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono"
                maxLength={19}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Expiry Date</label>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono"
                  maxLength={5}
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">CVV</label>
                <input
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="***"
                  type="password"
                  className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono"
                  maxLength={4}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Cardholder Name</label>
              <input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="As shown on card"
                className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-3 p-2.5 bg-accent-light rounded-lg flex items-start gap-2">
            <span className="text-sm">🔐</span>
            <p className="text-[10px] text-accent leading-relaxed font-medium">Your card information is encrypted with 256-bit SSL and processed via PCI DSS Level 1 compliant gateway. We never store your full card details.</p>
          </div>

          <button
            onClick={handlePay}
            disabled={!canProceed()}
            className="w-full mt-3 py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Pay ₦{amount.toLocaleString()} →
          </button>
        </div>
      )}

      {/* Bank Transfer */}
      {method === "bank" && (
        <div className="bg-card rounded-xl p-4 border border-border animate-fade-in">
          <h3 className="text-sm font-bold text-foreground mb-1">Bank Transfer</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Select your bank to generate a one-time transfer account</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {banks.map((b) => (
              <button
                key={b.code}
                onClick={() => setSelectedBank(b.code)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-left transition-all ${
                  selectedBank === b.code
                    ? "border-primary bg-primary-light"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className="text-lg">{b.icon}</span>
                <span className="text-xs font-medium text-foreground">{b.name}</span>
              </button>
            ))}
          </div>

          {selectedBank && (
            <div className="bg-background rounded-lg p-3.5 mb-3 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Transfer to this account</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Bank</span>
                  <span className="text-xs font-semibold text-foreground">{banks.find((b) => b.code === selectedBank)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Account Number</span>
                  <span className="text-xs font-mono font-bold text-primary">8012345678</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Account Name</span>
                  <span className="text-xs font-semibold text-foreground">RoadAssist NG / Paystack</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <span className="text-xs font-bold text-foreground">₦{amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-2.5 p-2 bg-accent-light rounded flex items-center gap-2">
                <span className="text-xs">⏳</span>
                <p className="text-[10px] text-accent font-medium">This account expires in 30 minutes. Transfer the exact amount to avoid delays.</p>
              </div>
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={!canProceed()}
            className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            I've sent the money →
          </button>
        </div>
      )}

      {/* USSD */}
      {method === "ussd" && (
        <div className="bg-card rounded-xl p-4 border border-border animate-fade-in">
          <h3 className="text-sm font-bold text-foreground mb-1">USSD Payment</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Dial the code from your registered phone number to complete payment</p>

          <div className="space-y-2 mb-3">
            {ussdCodes.map((u) => (
              <button
                key={u.bank}
                onClick={() => setSelectedUssd(u.bank)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border cursor-pointer text-left transition-all ${
                  selectedUssd === u.bank
                    ? "border-primary bg-primary-light"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-foreground">{u.bank}</span>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{u.code}</p>
                </div>
                <span className="text-lg">📱</span>
              </button>
            ))}
          </div>

          {selectedUssd && (
            <div className="bg-secondary-light rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-secondary mb-1">How to pay with USSD:</p>
              <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal pl-4">
                <li>Dial <span className="font-mono font-semibold text-foreground">{ussdCodes.find((u) => u.bank === selectedUssd)?.code}</span> from your phone</li>
                <li>Follow the prompts and enter your PIN</li>
                <li>You'll receive a confirmation SMS</li>
                <li>Click the button below to verify</li>
              </ol>
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={!canProceed()}
            className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            I've completed the USSD payment →
          </button>
        </div>
      )}

      {/* Security footer */}
      <div className="mt-3 flex items-center justify-center gap-3 py-2">
        <span className="text-[10px] text-muted-foreground">🔒 SSL Encrypted</span>
        <span className="text-border">|</span>
        <span className="text-[10px] text-muted-foreground">🛡️ PCI DSS Compliant</span>
        <span className="text-border">|</span>
        <span className="text-[10px] text-muted-foreground">✅ CBN Licensed</span>
      </div>
    </div>
  );
};

export default PaymentGatewayScreen;
