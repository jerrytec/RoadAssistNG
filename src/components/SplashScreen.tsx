import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";


interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2000);
    const finish = setTimeout(() => onFinish(), 2600);
    return () => {
      clearTimeout(timer);
      clearTimeout(finish);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      style={{ backgroundColor: "#E7EFE6" }}
    >
      <div className="flex items-center gap-3">
        <BrandLogo className="w-14 h-14" />
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: "#1a1a18" }}>
          RoadAssist<span style={{ color: "#0F6E56" }}>NG</span>
        </h1>
      </div>
    </div>
  );
};

export default SplashScreen;
