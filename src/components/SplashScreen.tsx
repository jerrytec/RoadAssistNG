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
      <div className="flex flex-col items-center gap-4">
        <BrandLogo className="w-20 h-20 rounded-2xl shadow-lg" />
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: "#1a1a18" }}>
          RoadAssist<span style={{ color: "#0F6E56" }}>NG</span>
        </h1>
      </div>
    </div>
  );
};

export default SplashScreen;
