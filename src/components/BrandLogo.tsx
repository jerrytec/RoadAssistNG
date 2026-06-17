import logoAsset from "@/assets/logo.ico.asset.json";

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

const BrandLogo = ({ className = "w-6 h-6", alt = "RoadAssistNG logo" }: BrandLogoProps) => (
  <img
    src={logoAsset.url}
    alt={alt}
    className={`inline-block object-contain ${className}`}
    loading="eager"
    decoding="async"
  />
);

export default BrandLogo;
