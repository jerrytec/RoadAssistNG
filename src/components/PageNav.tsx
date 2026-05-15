import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  onBack?: () => void;
  onHome?: () => void;
  className?: string;
}

/**
 * Floating back + home navigation pill.
 * Shown on every page after a service / provider has been selected.
 */
const PageNav = ({ onBack, onHome, className = "" }: Props) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) return onBack();
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const handleHome = () => {
    if (onHome) return onHome();
    navigate("/");
  };

  return (
    <div
      className={`fixed top-3 left-3 z-50 flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur border border-border shadow-card p-1 transition-all ${className}`}
    >
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="w-8 h-8 rounded-full flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <span className="w-px h-4 bg-border" aria-hidden />
      <button
        onClick={handleHome}
        aria-label="Go to home"
        className="w-8 h-8 rounded-full flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all"
      >
        <Home className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PageNav;
