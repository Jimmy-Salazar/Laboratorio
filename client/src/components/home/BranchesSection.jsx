import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Building2,
  Clock3,
  ExternalLink,
  MapPin,
  MapPinned,
  Phone,
} from "lucide-react";

import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";

const dayNames = {
  es: {
    1: "Lun",
    2: "Mar",
    3: "Mie",
    4: "Jue",
    5: "Vie",
    6: "Sab",
    7: "Dom",
  },
  en: {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
  },
};

function shortTime(value) {
  return String(value ?? "")
    .slice(0, 5);
}

function getBranchImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  const { data } = supabase.storage
    .from("branch-images")
    .getPublicUrl(imagePath);

  return data?.publicUrl ?? "";
}

function scheduleSignature(rows) {
  return rows
    .sort((a, b) =>
      String(a.open_time).localeCompare(
        String(b.open_time),
      ),
    )
    .map(
      (row) =>
        `${shortTime(row.open_time)}-${shortTime(row.close_time)}`,
    )
    .join(" / ");
}

function formatHours(
  branchId,
  hours,
  language,
) {
  const labels =
    dayNames[language] ??
    dayNames.es;

  const days = [];

  for (
    let weekday = 1;
    weekday <= 7;
    weekday += 1
  ) {
    const rows = hours.filter(
      (item) =>
        item.branch_id === branchId &&
        Number(item.weekday) === weekday &&
        item.active,
    );

    if (rows.length === 0) {
      continue;
    }

    days.push({
      weekday,
      signature:
        scheduleSignature(rows),
    });
  }

  if (days.length === 0) {
    return language === "en"
      ? "Hours to be defined"
      : "Horario por definir";
  }

  const groups = [];

  for (const day of days) {
    const previous =
      groups[
        groups.length - 1
      ];

    if (
      previous &&
      previous.signature ===
        day.signature &&
      previous.end + 1 ===
        day.weekday
    ) {
      previous.end =
        day.weekday;
      continue;
    }

    groups.push({
      start: day.weekday,
      end: day.weekday,
      signature:
        day.signature,
    });
  }

  return groups
    .map((group) => {
      const dayLabel =
        group.start === group.end
          ? labels[group.start]
          : `${labels[group.start]}-${labels[group.end]}`;

      return `${dayLabel}: ${group.signature}`;
    })
    .join(" | ");
}

export default function BranchesSection() {
  const {
    language,
    content,
  } = useLanguage();

  const [branches, setBranches] =
    useState([]);
  const [hours, setHours] =
    useState([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadBranches() {
      setLoading(true);

      const [
        branchesResponse,
        hoursResponse,
      ] = await Promise.all([
        supabase
          .from("branches")
          .select(
            "id, code, name_es, name_en, address_es, address_en, phone, image_path, google_maps_url, active, sort_order",
          )
          .eq("active", true)
          .order("sort_order", {
            ascending: true,
          })
          .order("name_es", {
            ascending: true,
          }),

        supabase
          .from("branch_hours")
          .select(
            "id, branch_id, weekday, open_time, close_time, active, sort_order",
          )
          .eq("active", true)
          .order("weekday", {
            ascending: true,
          })
          .order("open_time", {
            ascending: true,
          }),
      ]);

      if (!mounted) {
        return;
      }

      if (branchesResponse.error) {
        console.error(
          "Could not load Home branches:",
          branchesResponse.error,
        );

        setBranches([]);
      } else {
        setBranches(
          branchesResponse.data ?? [],
        );
      }

      if (hoursResponse.error) {
        console.error(
          "Could not load Home branch hours:",
          hoursResponse.error,
        );

        setHours([]);
      } else {
        setHours(
          hoursResponse.data ?? [],
        );
      }

      setLoading(false);
    }

    loadBranches();

    return () => {
      mounted = false;
    };
  }, []);

  const copy = useMemo(
    () =>
      language === "en"
        ? {
            directions:
              "Get directions",
            addressFallback:
              "Address to be defined",
            phoneFallback:
              "Phone to be defined",
            empty:
              "Branch information will be available soon.",
            loading:
              "Loading locations...",
          }
        : {
            directions:
              "Como llegar",
            addressFallback:
              "Direccion por definir",
            phoneFallback:
              "Telefono por definir",
            empty:
              "La informacion de sucursales estara disponible pronto.",
            loading:
              "Cargando sucursales...",
          },
    [language],
  );

  return (
    <section
      id="branches"
      className="content-section"
    >
      <div className="page-container">
        <SectionHeader
          icon={MapPinned}
          title={content.branches.title}
          subtitle={
            content.branches.subtitle
          }
        />

        {loading ? (
          <div
            className="home-branches-state"
            role="status"
          >
            {copy.loading}
          </div>
        ) : branches.length === 0 ? (
          <div className="home-branches-state">
            {copy.empty}
          </div>
        ) : (
          <div className="branches-grid">
            {branches.map((branch) => {
              const name =
                language === "en"
                  ? branch.name_en ||
                    branch.name_es
                  : branch.name_es ||
                    branch.name_en;

              const address =
                language === "en"
                  ? branch.address_en ||
                    copy.addressFallback
                  : branch.address_es ||
                    copy.addressFallback;

              const imageUrl =
                getBranchImageUrl(
                  branch.image_path,
                );

              const branchHours =
                formatHours(
                  branch.id,
                  hours,
                  language,
                );

              return (
                <article
                  className="branch-card branch-card--dynamic"
                  key={branch.id}
                >
                  <div className="branch-card__media">
                    {imageUrl ? (
                      <img
                        className="branch-card__image"
                        src={imageUrl}
                        alt={name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="branch-card__image-placeholder">
                        <Building2
                          size={38}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>

                  <div className="branch-card__body">
                    <div className="branch-card__title-row">
                      <h3>{name}</h3>

                      <MapPin
                        size={18}
                        aria-hidden="true"
                      />
                    </div>

                    <p>
                      <MapPin
                        size={14}
                        aria-hidden="true"
                      />
                      <span>
                        {address}
                      </span>
                    </p>

                    <p>
                      <Phone
                        size={14}
                        aria-hidden="true"
                      />
                      <span>
                        {branch.phone ||
                          copy.phoneFallback}
                      </span>
                    </p>

                    <p>
                      <Clock3
                        size={14}
                        aria-hidden="true"
                      />
                      <span>
                        {branchHours}
                      </span>
                    </p>

                    {branch.google_maps_url ? (
                      <a
                        className="branch-card__directions"
                        href={
                          branch.google_maps_url
                        }
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <MapPinned
                          size={15}
                        />

                        <span>
                          {copy.directions}
                        </span>

                        <ExternalLink
                          size={13}
                        />
                      </a>
                    ) : (
                      <span
                        className="branch-card__directions is-disabled"
                        aria-disabled="true"
                      >
                        <MapPinned
                          size={15}
                        />

                        <span>
                          {copy.directions}
                        </span>
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}