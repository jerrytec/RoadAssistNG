import { ExternalLink } from "lucide-react";

interface Props {
  lat: number | null;
  lng: number | null;
  height?: number;
  label?: string;
}

const LiveSOSMap = ({ lat, lng, height = 220, label = "SOS location" }: Props) => {
  if (lat == null || lng == null) {
    return (
      <div
        className="rounded-xl flex items-center justify-center border border-border bg-muted text-xs text-muted-foreground"
        style={{ height }}
      >
        Waiting for GPS lock…
      </div>
    );
  }
  const d = 0.01;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div
      className="rounded-xl overflow-hidden border border-border relative"
      style={{ height }}
    >
      <iframe
        src={src}
        title={label}
        className="w-full h-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 right-2 bg-card/90 backdrop-blur px-2 py-1 rounded text-[10px] font-medium hover:bg-card transition-colors inline-flex items-center gap-1"
      >
        Open in maps <ExternalLink className="w-3 h-3" aria-hidden="true" />
      </a>
    </div>
  );
};

export default LiveSOSMap;

