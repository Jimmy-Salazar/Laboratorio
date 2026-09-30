import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const originalFlyers = [
  { id: "services", image: "/destacados/destacado-01-servicios.png", es: "Servicios de laboratorio", en: "Laboratory services" },
  { id: "dengue", image: "/destacados/destacado-02-dengue.png", es: "Prueba de dengue", en: "Dengue testing" },
  { id: "payments", image: "/destacados/destacado-03-pagos.png", es: "Formas de pago", en: "Payment options" },
  { id: "occupational", image: "/destacados/destacado-04-ocupacional.png", es: "Salud ocupacional", en: "Occupational health" },
];

export function highlightImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("/destacados/")) return path;
  return supabase.storage.from("site-highlights").getPublicUrl(path).data.publicUrl;
}

export default function useSiteHighlights() {
  const [flyers, setFlyers] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("site_highlights")
        .select("id,title_es,title_en,image_path")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      // An empty successful result means the admin has removed every highlight.
      if (!mounted) return;
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        setFlyers(originalFlyers);
      } else if (!error) {
        setFlyers((data ?? []).map((row) => ({
          id: row.id,
          image: highlightImageUrl(row.image_path),
          es: row.title_es,
          en: row.title_en,
        })));
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return flyers;
}
