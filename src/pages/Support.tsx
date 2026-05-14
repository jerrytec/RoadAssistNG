import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";

const Support = () => {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-[720px] flex items-center gap-3 h-14">
          <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center"><ArrowLeft className="w-4 h-4"/></button>
          <h1 className="text-base font-semibold">Support</h1>
        </div>
      </header>
      <section className="container max-w-[720px] py-6 space-y-3">
        <p className="text-sm text-muted-foreground">Our team responds within minutes during business hours.</p>
        <a href="tel:+2348000000000" className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-card hover:border-primary/40">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Phone className="w-4 h-4"/></div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Call us</p>
            <p className="text-xs text-muted-foreground">+234 800 000 0000</p>
          </div>
        </a>
        <a href="https://wa.me/2348000000000" className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-card hover:border-primary/40">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><MessageCircle className="w-4 h-4"/></div>
          <div className="flex-1">
            <p className="text-sm font-semibold">WhatsApp chat</p>
            <p className="text-xs text-muted-foreground">Tap to chat with our team</p>
          </div>
        </a>
        <a href="mailto:support@roadassistng.com" className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-card hover:border-primary/40">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Mail className="w-4 h-4"/></div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Email</p>
            <p className="text-xs text-muted-foreground">support@roadassistng.com</p>
          </div>
        </a>
      </section>
    </main>
  );
};

export default Support;
