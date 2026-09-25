import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Building2,
  Check,
  Clock3,
  Edit3,
  FlaskConical,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Upload,
  ExternalLink,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import {
  translateBranchAddressToEnglish,
  translateBranchNameToEnglish,
} from "../utils/branchTranslation";
/* PATCH_06_15_BRANCH_AUTO_TRANSLATION */
import "../styles/admin.css";

const dayNames = {
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
  7: "Domingo",
};

const emptyBranch = {
  code: "",
  nameEs: "",
  addressEs: "",
  phone: "",
  whatsapp: "",
  googleMapsUrl: "",
  imagePath: "",
  timezone: "America/Guayaquil",
  active: true,
  bookingEnabled: true,
};

function defaultDrafts() {
  return Object.fromEntries(
    Object.keys(dayNames).map((day) => [
      day,
      {
        openTime: "07:00",
        closeTime: "17:00",
      },
    ]),
  );
}

function shortTime(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 5);
}


const BRANCH_STUDIES_PAGE_SIZE = 10;

/* PATCH_06_12_BRANCH_STUDIES_PAGINATION */
function BranchStudiesPagination({
  page,
  pageCount,
  totalItems,
  onPrevious,
  onNext,
}) {
  const startItem =
    totalItems === 0
      ? 0
      : (page - 1) *
          BRANCH_STUDIES_PAGE_SIZE +
        1;

  const endItem =
    totalItems === 0
      ? 0
      : Math.min(
          page *
            BRANCH_STUDIES_PAGE_SIZE,
          totalItems,
        );

  return (
    <div className="admin-branch-studies-pagination">
      <span className="admin-branch-studies-pagination__summary">
        {totalItems === 0
          ? "0 estudios"
          : `${startItem}-${endItem} de ${totalItems}`}
      </span>

      <div className="admin-branch-studies-pagination__controls">
        <button
          type="button"
          className="admin-branch-pagination-button"
          onClick={onPrevious}
          disabled={page <= 1}
          aria-label="Pagina anterior"
          title="Pagina anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="admin-branch-studies-pagination__page">
          Pagina {page} de {pageCount}
        </span>

        <button
          type="button"
          className="admin-branch-pagination-button"
          onClick={onNext}
          disabled={page >= pageCount}
          aria-label="Pagina siguiente"
          title="Pagina siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* PATCH_06_14_BRANCH_PHOTO_MAPS */
function getBranchImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  const { data } = supabase.storage
    .from("branch-images")
    .getPublicUrl(imagePath);

  return data?.publicUrl ?? "";
}

function isGoogleMapsUrl(value) {
  const cleanValue =
    String(value ?? "").trim();

  if (!cleanValue) {
    return true;
  }

  try {
    const url = new URL(cleanValue);

    if (url.protocol !== "https:") {
      return false;
    }

    const host =
      url.hostname.toLowerCase();

    const path =
      url.pathname.toLowerCase();

    return (
      host === "maps.app.goo.gl" ||
      (
        host === "goo.gl" &&
        path.startsWith("/maps")
      ) ||
      host === "maps.google.com" ||
      host.startsWith("maps.google.") ||
      (
        host.endsWith(".google.com") &&
        path.startsWith("/maps")
      ) ||
      (
        host.startsWith("www.google.") &&
        path.startsWith("/maps")
      )
    );
  } catch {
    return false;
  }
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState([]);
  const [studies, setStudies] = useState([]);
  const [selectedBranchId, setSelectedBranchId] =
    useState(null);
  const [branchStudies, setBranchStudies] =
    useState([]);
  const [hours, setHours] = useState([]);
  const [tab, setTab] = useState("general");
  const [search, setSearch] = useState("");
  const [studySearch, setStudySearch] =
    useState("");
  const [studyPage, setStudyPage] =
    useState(1);
  const [branchForm, setBranchForm] =
    useState(emptyBranch);
  const [scheduleDrafts, setScheduleDrafts] =
    useState(defaultDrafts);
  const [creatingBranch, setCreatingBranch] =
    useState(false);
  const [savingBranch, setSavingBranch] =
    useState(false);
  const [uploadingImage, setUploadingImage] =
    useState(false);
  const [busyStudyId, setBusyStudyId] =
    useState(null);
  const [busySchedule, setBusySchedule] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("info");

  const selectedBranch = useMemo(
    () =>
      branches.find(
        (branch) =>
          branch.id === selectedBranchId,
      ) ?? null,
    [branches, selectedBranchId],
  );

  const activeBranchStudyMap = useMemo(() => {
    return new Map(
      branchStudies.map((row) => [
        row.study_id,
        row,
      ]),
    );
  }, [branchStudies]);

  const filteredBranches = useMemo(() => {
    const term = search
      .trim()
      .toLocaleLowerCase();

    if (!term) {
      return branches;
    }

    return branches.filter((branch) =>
      [
        branch.code,
        branch.name_es,
        branch.address_es,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLocaleLowerCase()
            .includes(term),
        ),
    );
  }, [branches, search]);

  const filteredStudies = useMemo(() => {
    const term = studySearch
      .trim()
      .toLocaleLowerCase();

    if (!term) {
      return studies;
    }

    return studies.filter((study) =>
      [
        study.code,
        study.name_es,
        study.name_en,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLocaleLowerCase()
            .includes(term),
        ),
    );
  }, [studies, studySearch]);

  const studyPageCount = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(
          filteredStudies.length /
            BRANCH_STUDIES_PAGE_SIZE,
        ),
      ),
    [filteredStudies.length],
  );

  const pagedStudies = useMemo(() => {
    const start =
      (studyPage - 1) *
      BRANCH_STUDIES_PAGE_SIZE;

    return filteredStudies.slice(
      start,
      start +
        BRANCH_STUDIES_PAGE_SIZE,
    );
  }, [
    filteredStudies,
    studyPage,
  ]);

  useEffect(() => {
    setStudyPage(1);
  }, [
    studySearch,
    selectedBranchId,
  ]);

  useEffect(() => {
    if (studyPage > studyPageCount) {
      setStudyPage(
        studyPageCount,
      );
    }
  }, [
    studyPage,
    studyPageCount,
  ]);

  const loadBaseData = useCallback(async () => {
    setLoading(true);

    const [
      branchesResponse,
      studiesResponse,
    ] = await Promise.all([
      supabase
        .from("branches")
        .select(
          "id, code, name_es, name_en, address_es, address_en, phone, whatsapp, image_path, google_maps_url, active, booking_enabled, timezone, sort_order",
        )
        .order("sort_order", {
          ascending: true,
        })
        .order("name_es", {
          ascending: true,
        }),

      supabase
        .from("studies")
        .select(
          "id, code, name_es, name_en, active, booking_enabled, sort_order",
        )
        .eq("active", true)
        .eq("booking_enabled", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("name_es", {
          ascending: true,
        }),
    ]);

    if (
      branchesResponse.error ||
      studiesResponse.error
    ) {
      console.error(
        branchesResponse.error ??
          studiesResponse.error,
      );

      setMessage(
        "No fue posible cargar sucursales y estudios.",
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    const nextBranches =
      branchesResponse.data ?? [];

    setBranches(nextBranches);
    setStudies(
      studiesResponse.data ?? [],
    );

    setSelectedBranchId((current) => {
      if (
        current &&
        nextBranches.some(
          (branch) =>
            branch.id === current,
        )
      ) {
        return current;
      }

      return nextBranches[0]?.id ?? null;
    });

    setLoading(false);
  }, []);

  const loadBranchConfiguration =
    useCallback(async (branchId) => {
      if (!branchId) {
        setBranchStudies([]);
        setHours([]);
        return;
      }

      const [
        studiesResponse,
        hoursResponse,
      ] = await Promise.all([
        supabase
          .from("branch_studies")
          .select(
            "branch_id, study_id, active, notes_es, notes_en",
          )
          .eq("branch_id", branchId),

        supabase
          .from("branch_hours")
          .select(
            "id, branch_id, weekday, open_time, close_time, active, sort_order",
          )
          .eq("branch_id", branchId)
          .order("weekday", {
            ascending: true,
          })
          .order("open_time", {
            ascending: true,
          }),
      ]);

      if (
        studiesResponse.error ||
        hoursResponse.error
      ) {
        console.error(
          studiesResponse.error ??
            hoursResponse.error,
        );

        setMessage(
          "No fue posible cargar la configuracion de la sucursal.",
        );
        setMessageType("error");
        return;
      }

      setBranchStudies(
        studiesResponse.data ?? [],
      );
      setHours(hoursResponse.data ?? []);
    }, []);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadBranchConfiguration(
      selectedBranchId,
    );
  }, [
    selectedBranchId,
    loadBranchConfiguration,
  ]);

  useEffect(() => {
    if (!selectedBranch) {
      return;
    }

    setCreatingBranch(false);

    setBranchForm({
      code: selectedBranch.code ?? "",
      nameEs:
        selectedBranch.name_es ?? "",
      addressEs:
        selectedBranch.address_es ?? "",
      phone:
        selectedBranch.phone ?? "",
      whatsapp:
        selectedBranch.whatsapp ?? "",
      googleMapsUrl:
        selectedBranch.google_maps_url ?? "",
      imagePath:
        selectedBranch.image_path ?? "",
      timezone:
        selectedBranch.timezone ??
        "America/Guayaquil",
      active: selectedBranch.active,
      bookingEnabled:
        selectedBranch.booking_enabled,
    });
  }, [selectedBranch]);

  function updateBranchForm(field, value) {
    setBranchForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function newBranch() {
    setCreatingBranch(true);
    setSelectedBranchId(null);
    setBranchForm(emptyBranch);
    setBranchStudies([]);
    setHours([]);
    setTab("general");
    setMessage("");
  }

  function cancelNewBranch() {
    setCreatingBranch(false);

    const first = branches[0] ?? null;
    setSelectedBranchId(
      first?.id ?? null,
    );
  }

  async function saveBranch(event) {
    event.preventDefault();

    if (savingBranch) {
      return;
    }

    const code =
      branchForm.code
        .trim()
        .toUpperCase();

    const nameEs =
      branchForm.nameEs.trim();

        if (!code || !nameEs) {
      setMessage(
        "Codigo y nombre de la sucursal son obligatorios.",
      );
      setMessageType("error");
      return;
    }

    if (
      !isGoogleMapsUrl(
        branchForm.googleMapsUrl,
      )
    ) {
      setMessage(
        "Ingresa un enlace valido de Google Maps.",
      );
      setMessageType("error");
      return;
    }

    const addressEs =
      branchForm.addressEs.trim() ||
      "Por definir";

    const previousNameEs =
      String(
        selectedBranch?.name_es ?? "",
      ).trim();

    const previousAddressEs =
      String(
        selectedBranch?.address_es ??
          "Por definir",
      ).trim();

    const nameChanged =
      creatingBranch ||
      nameEs !== previousNameEs;

    const addressChanged =
      creatingBranch ||
      addressEs !== previousAddressEs;

    const nameEn =
      nameChanged
        ? translateBranchNameToEnglish(
            nameEs,
          )
        : (
            selectedBranch?.name_en
              ?.trim() ||
            translateBranchNameToEnglish(
              nameEs,
            )
          );

    const addressEn =
      addressChanged
        ? translateBranchAddressToEnglish(
            addressEs,
          )
        : (
            selectedBranch?.address_en
              ?.trim() ||
            translateBranchAddressToEnglish(
              addressEs,
            )
          );

    const payload = {
      code,
      name_es: nameEs,
      name_en: nameEn,
      address_es: addressEs,
      address_en: addressEn,
      phone:
        branchForm.phone.trim() ||
        null,
      whatsapp:
        branchForm.whatsapp.trim() ||
        null,
      google_maps_url:
        branchForm.googleMapsUrl.trim() ||
        null,
      timezone:
        branchForm.timezone.trim() ||
        "America/Guayaquil",
      active: branchForm.active,
      booking_enabled:
        branchForm.bookingEnabled,
    };

    setSavingBranch(true);
    setMessage("");

    let response;

    if (creatingBranch) {
      response = await supabase
        .from("branches")
        .insert(payload)
        .select("id")
        .single();
    } else if (selectedBranchId) {
      response = await supabase
        .from("branches")
        .update(payload)
        .eq("id", selectedBranchId)
        .select("id")
        .single();
    } else {
      setSavingBranch(false);
      return;
    }

    setSavingBranch(false);

    if (response.error) {
      console.error(response.error);

      setMessage(
        response.error.code === "23505"
          ? "Ya existe una sucursal con ese codigo."
          : "No fue posible guardar la sucursal.",
      );
      setMessageType("error");
      return;
    }

    const savedId =
      response.data?.id ??
      selectedBranchId;

    setMessage(
      creatingBranch
        ? "Sucursal creada."
        : "Sucursal actualizada.",
    );
    setMessageType("success");

    setCreatingBranch(false);

    await loadBaseData();

    if (savedId) {
      setSelectedBranchId(savedId);
    }
  }

  async function uploadBranchImage(
    event,
  ) {
    const file =
      event.target.files?.[0] ?? null;

    event.target.value = "";

    if (
      !file ||
      !selectedBranchId ||
      creatingBranch ||
      uploadingImage
    ) {
      return;
    }

    const allowedTypes =
      new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
      ]);

    if (!allowedTypes.has(file.type)) {
      setMessage(
        "La foto debe ser JPG, PNG o WEBP.",
      );
      setMessageType("error");
      return;
    }

    const maxBytes =
      5 * 1024 * 1024;

    if (file.size > maxBytes) {
      setMessage(
        "La foto no puede superar 5 MB.",
      );
      setMessageType("error");
      return;
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      (
        file.type === "image/png"
          ? "png"
          : file.type ===
              "image/webp"
            ? "webp"
            : "jpg"
      );

    const filePath =
      `${selectedBranchId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const previousPath =
      branchForm.imagePath || null;

    setUploadingImage(true);
    setMessage("");

    const {
      error: uploadError,
    } = await supabase.storage
      .from("branch-images")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        },
      );

    if (uploadError) {
      console.error(uploadError);

      setUploadingImage(false);
      setMessage(
        "No fue posible subir la foto de la sucursal.",
      );
      setMessageType("error");
      return;
    }

    const {
      error: updateError,
    } = await supabase
      .from("branches")
      .update({
        image_path: filePath,
      })
      .eq(
        "id",
        selectedBranchId,
      );

    if (updateError) {
      console.error(updateError);

      await supabase.storage
        .from("branch-images")
        .remove([filePath]);

      setUploadingImage(false);
      setMessage(
        "La foto subio, pero no se pudo asociar a la sucursal.",
      );
      setMessageType("error");
      return;
    }

    if (previousPath) {
      const {
        error: removeOldError,
      } = await supabase.storage
        .from("branch-images")
        .remove([previousPath]);

      if (removeOldError) {
        console.warn(
          "Could not remove previous branch image:",
          removeOldError,
        );
      }
    }

    setBranchForm(
      (current) => ({
        ...current,
        imagePath: filePath,
      }),
    );

    setUploadingImage(false);
    setMessage(
      "Foto de la sucursal actualizada.",
    );
    setMessageType("success");

    await loadBaseData();
  }

  async function removeBranchImage() {
    if (
      !selectedBranchId ||
      !branchForm.imagePath ||
      uploadingImage
    ) {
      return;
    }

    const previousPath =
      branchForm.imagePath;

    setUploadingImage(true);
    setMessage("");

    const {
      error: updateError,
    } = await supabase
      .from("branches")
      .update({
        image_path: null,
      })
      .eq(
        "id",
        selectedBranchId,
      );

    if (updateError) {
      console.error(updateError);

      setUploadingImage(false);
      setMessage(
        "No fue posible quitar la foto.",
      );
      setMessageType("error");
      return;
    }

    const {
      error: removeError,
    } = await supabase.storage
      .from("branch-images")
      .remove([previousPath]);

    if (removeError) {
      console.warn(
        "Could not remove branch image file:",
        removeError,
      );
    }

    setBranchForm(
      (current) => ({
        ...current,
        imagePath: "",
      }),
    );

    setUploadingImage(false);
    setMessage(
      "Foto eliminada.",
    );
    setMessageType("success");

    await loadBaseData();
  }

  async function toggleStudy(study) {
    if (
      !selectedBranchId ||
      busyStudyId
    ) {
      return;
    }

    setBusyStudyId(study.id);
    setMessage("");

    const existing =
      activeBranchStudyMap.get(
        study.id,
      );

    const nextActive =
      existing
        ? !existing.active
        : true;

    const { error } = await supabase
      .from("branch_studies")
      .upsert(
        {
          branch_id:
            selectedBranchId,
          study_id: study.id,
          active: nextActive,
        },
        {
          onConflict:
            "branch_id,study_id",
        },
      );

    setBusyStudyId(null);

    if (error) {
      console.error(error);

      setMessage(
        "No fue posible actualizar los estudios de la sucursal.",
      );
      setMessageType("error");
      return;
    }

    await loadBranchConfiguration(
      selectedBranchId,
    );
  }

  function updateDraft(
    weekday,
    field,
    value,
  ) {
    setScheduleDrafts(
      (current) => ({
        ...current,
        [weekday]: {
          ...current[weekday],
          [field]: value,
        },
      }),
    );
  }

  async function addSchedule(weekday) {
    if (
      !selectedBranchId ||
      busySchedule
    ) {
      return;
    }

    const draft =
      scheduleDrafts[weekday];

    if (
      !draft.openTime ||
      !draft.closeTime ||
      draft.openTime >= draft.closeTime
    ) {
      setMessage(
        "La hora de apertura debe ser menor que la hora de cierre.",
      );
      setMessageType("error");
      return;
    }

    setBusySchedule(true);
    setMessage("");

    const { error } = await supabase
      .from("branch_hours")
      .insert({
        branch_id:
          selectedBranchId,
        weekday: Number(weekday),
        open_time:
          draft.openTime,
        close_time:
          draft.closeTime,
        active: true,
        sort_order:
          Number(weekday) * 10,
      });

    setBusySchedule(false);

    if (error) {
      console.error(error);

      setMessage(
        error.message?.includes(
          "superpone",
        )
          ? "Ese horario se superpone con otro bloque del mismo dia."
          : "No fue posible agregar el horario.",
      );
      setMessageType("error");
      return;
    }

    await loadBranchConfiguration(
      selectedBranchId,
    );
  }

  async function deleteSchedule(id) {
    if (busySchedule) {
      return;
    }

    setBusySchedule(true);
    setMessage("");

    const { error } = await supabase
      .from("branch_hours")
      .delete()
      .eq("id", id);

    setBusySchedule(false);

    if (error) {
      console.error(error);

      setMessage(
        "No fue posible eliminar el bloque horario.",
      );
      setMessageType("error");
      return;
    }

    await loadBranchConfiguration(
      selectedBranchId,
    );
  }

  return (
    <div className="admin-branches-page">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            Configuracion
          </span>

          <h1>Sucursales</h1>

          <p>
            Administra datos, estudios disponibles y horarios de cada sucursal.
          </p>
        </div>

        <div className="admin-page-heading__actions">
          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={loadBaseData}
            disabled={loading}
          >
            <RefreshCw size={17} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={newBranch}
          >
            <Plus size={17} />
            <span>Nueva sucursal</span>
          </button>
        </div>
      </section>

      <section className="admin-branches-layout">
        <aside className="admin-panel admin-branch-list-panel">
          <header className="admin-panel__header admin-panel__header--stack">
            <div>
              <span className="admin-panel__icon">
                <Building2 size={20} />
              </span>

              <div>
                <h2>Sucursales</h2>
                <p>
                  {branches.length} registrada(s)
                </p>
              </div>
            </div>

            <div className="admin-search-control admin-search-control--full">
              <Search size={17} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar sucursal..."
              />
            </div>
          </header>

          <div className="admin-branch-list">
            {filteredBranches.map(
              (branch) => (
                <button
                  type="button"
                  key={branch.id}
                  className={[
                    "admin-branch-card",
                    selectedBranchId ===
                    branch.id
                      ? "is-selected"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setCreatingBranch(false);
                    setSelectedBranchId(
                      branch.id,
                    );
                    setTab("general");
                    setMessage("");
                  }}
                >
                  <span className="admin-branch-card__icon">
                    <Building2 size={19} />
                  </span>

                  <span className="admin-branch-card__copy">
                    <strong>
                      {branch.name_es}
                    </strong>

                    <small>
                      {branch.code}
                    </small>

                    <small>
                      {branch.address_es}
                    </small>
                  </span>

                  <span
                    className={[
                      "admin-branch-card__status",
                      branch.active
                        ? "is-open"
                        : "is-closed",
                    ].join(" ")}
                  >
                    {branch.active
                      ? "Activa"
                      : "Inactiva"}
                  </span>
                </button>
              ),
            )}
          </div>
        </aside>

        <div className="admin-branch-editor">
          {(selectedBranch ||
            creatingBranch) ? (
            <>
              <nav className="admin-config-tabs">
                <button
                  type="button"
                  className={
                    tab === "general"
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setTab("general")
                  }
                >
                  <Building2 size={17} />
                  <span>General</span>
                </button>

                <button
                  type="button"
                  disabled={creatingBranch}
                  className={
                    tab === "studies"
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setTab("studies")
                  }
                >
                  <FlaskConical size={17} />
                  <span>Estudios</span>
                </button>

                <button
                  type="button"
                  disabled={creatingBranch}
                  className={
                    tab === "hours"
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setTab("hours")
                  }
                >
                  <Clock3 size={17} />
                  <span>Horarios</span>
                </button>
              </nav>

              {tab === "general" ? (
                <article className="admin-panel">
                  <header className="admin-panel__header">
                    <div>
                      <span className="admin-panel__icon">
                        {creatingBranch ? (
                          <Plus size={20} />
                        ) : (
                          <Edit3 size={20} />
                        )}
                      </span>

                      <div>
                        <h2>
                          {creatingBranch
                            ? "Nueva sucursal"
                            : selectedBranch
                              ?.name_es}
                        </h2>

                        <p>
                          Informacion general de la sede.
                        </p>
                      </div>
                    </div>
                  </header>

                  <form
                    className="admin-branch-form"
                    onSubmit={saveBranch}
                  >
                    <div className="admin-form-two-columns">
                      <label>
                        <span>Codigo</span>

                        <div className="admin-form-control">
                          <input
                            type="text"
                            value={
                              branchForm.code
                            }
                            onChange={(event) =>
                              updateBranchForm(
                                "code",
                                event.target.value,
                              )
                            }
                            placeholder="Ej. MATRIZ"
                          />
                        </div>
                      </label>

                      <label>
                        <span>Zona horaria</span>

                        <div className="admin-form-control">
                          <input
                            type="text"
                            value={
                              branchForm.timezone
                            }
                            onChange={(event) =>
                              updateBranchForm(
                                "timezone",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </label>
                    </div>

                    <label>
                      <span>
                        Nombre de la sucursal
                      </span>

                      <div className="admin-form-control">
                        <input
                          type="text"
                          value={
                            branchForm.nameEs
                          }
                          onChange={(event) =>
                            updateBranchForm(
                              "nameEs",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <small className="admin-field-help">
                        La version en ingles se genera al guardar y solo se recalcula si cambias este nombre.
                      </small>
                    </label>

                    <label>
                      <span>
                        Direccion
                      </span>

                      <div className="admin-form-control">
                        <MapPin size={18} />

                        <input
                          type="text"
                          value={
                            branchForm.addressEs
                          }
                          onChange={(event) =>
                            updateBranchForm(
                              "addressEs",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <small className="admin-field-help">
                        La version en ingles se genera al guardar y solo se recalcula si cambias esta direccion.
                      </small>
                    </label>

                    <div className="admin-form-two-columns">
                      <label>
                        <span>Telefono</span>

                        <div className="admin-form-control">
                          <Phone size={18} />

                          <input
                            type="tel"
                            value={
                              branchForm.phone
                            }
                            onChange={(event) =>
                              updateBranchForm(
                                "phone",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </label>

                      <label>
                        <span>WhatsApp</span>

                        <div className="admin-form-control">
                          <Phone size={18} />

                          <input
                            type="tel"
                            value={
                              branchForm.whatsapp
                            }
                            onChange={(event) =>
                              updateBranchForm(
                                "whatsapp",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </label>
                    </div>

                    <label>
                      <span>
                        Enlace de Google Maps
                      </span>

                      <div className="admin-form-control">
                        <MapPin size={18} />

                        <input
                          type="url"
                          value={
                            branchForm.googleMapsUrl
                          }
                          onChange={(event) =>
                            updateBranchForm(
                              "googleMapsUrl",
                              event.target.value,
                            )
                          }
                          placeholder="https://maps.app.goo.gl/..."
                        />

                        {branchForm.googleMapsUrl &&
                        isGoogleMapsUrl(
                          branchForm.googleMapsUrl,
                        ) ? (
                          <a
                            className="admin-map-preview-link"
                            href={
                              branchForm.googleMapsUrl
                            }
                            target="_blank"
                            rel="noreferrer noopener"
                            title="Abrir Google Maps"
                            aria-label="Abrir Google Maps"
                          >
                            <ExternalLink
                              size={17}
                            />
                          </a>
                        ) : null}
                      </div>

                      <small className="admin-field-help">
                        Pega el enlace de compartir de Google Maps.
                      </small>
                    </label>

                    <div className="admin-branch-photo-field">
                      <span className="admin-branch-photo-field__label">
                        Foto de la sucursal
                      </span>

                      <div className="admin-branch-photo-editor">
                        <div className="admin-branch-photo-preview">
                          {branchForm.imagePath ? (
                            <img
                              src={getBranchImageUrl(
                                branchForm.imagePath,
                              )}
                              alt={
                                branchForm.nameEs ||
                                "Sucursal"
                              }
                            />
                          ) : (
                            <div className="admin-branch-photo-placeholder">
                              <ImagePlus
                                size={32}
                              />
                              <span>
                                Sin foto
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="admin-branch-photo-actions">
                          <label
                            className={[
                              "admin-button",
                              "admin-button--secondary",
                              (
                                creatingBranch ||
                                !selectedBranchId ||
                                uploadingImage
                              )
                                ? "is-disabled"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <Upload size={17} />

                            <span>
                              {uploadingImage
                                ? "Subiendo..."
                                : branchForm.imagePath
                                  ? "Cambiar foto"
                                  : "Subir foto"}
                            </span>

                            <input
                              className="admin-visually-hidden-input"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={
                                creatingBranch ||
                                !selectedBranchId ||
                                uploadingImage
                              }
                              onChange={
                                uploadBranchImage
                              }
                            />
                          </label>

                          {branchForm.imagePath ? (
                            <button
                              type="button"
                              className="admin-button admin-button--danger-soft"
                              onClick={
                                removeBranchImage
                              }
                              disabled={
                                uploadingImage
                              }
                            >
                              <Trash2
                                size={16}
                              />
                              <span>
                                Quitar foto
                              </span>
                            </button>
                          ) : null}

                          {creatingBranch ? (
                            <small>
                              Guarda primero la sucursal para subir su foto.
                            </small>
                          ) : (
                            <small>
                              JPG, PNG o WEBP. Maximo 5 MB.
                            </small>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-switches">
                      <label className="admin-inline-check">
                        <input
                          type="checkbox"
                          checked={
                            branchForm.active
                          }
                          onChange={(event) =>
                            updateBranchForm(
                              "active",
                              event.target.checked,
                            )
                          }
                        />
                        <span>Sucursal activa</span>
                      </label>

                      <label className="admin-inline-check">
                        <input
                          type="checkbox"
                          checked={
                            branchForm.bookingEnabled
                          }
                          onChange={(event) =>
                            updateBranchForm(
                              "bookingEnabled",
                              event.target.checked,
                            )
                          }
                        />
                        <span>
                          Permitir agendamiento web
                        </span>
                      </label>
                    </div>

                    <div className="admin-form-actions">
                      {creatingBranch ? (
                        <button
                          type="button"
                          className="admin-button admin-button--secondary"
                          onClick={
                            cancelNewBranch
                          }
                        >
                          Cancelar
                        </button>
                      ) : null}

                      <button
                        type="submit"
                        className="admin-button admin-button--primary"
                        disabled={
                          savingBranch
                        }
                      >
                        <Save size={17} />

                        <span>
                          {savingBranch
                            ? "Guardando..."
                            : "Guardar"}
                        </span>
                      </button>
                    </div>
                  </form>
                </article>
              ) : null}

              {tab === "studies" &&
              selectedBranch ? (
                <article className="admin-panel">
                  <header className="admin-panel__header admin-panel__header--wrap">
                    <div>
                      <span className="admin-panel__icon">
                        <FlaskConical size={20} />
                      </span>

                      <div>
                        <h2>
                          Estudios disponibles
                        </h2>

                        <p>
                          {
                            selectedBranch.name_es
                          }
                        </p>
                      </div>
                    </div>

                    <div className="admin-search-control">
                      <Search size={17} />

                      <input
                        type="search"
                        value={studySearch}
                        onChange={(event) =>
                          setStudySearch(
                            event.target.value,
                          )
                        }
                        placeholder="Buscar estudio..."
                      />
                    </div>
                  </header>

                  <div className="admin-branch-study-list">
                    {pagedStudies.map(
                      (study) => {
                        const link =
                          activeBranchStudyMap.get(
                            study.id,
                          );

                        const enabled =
                          link?.active === true;

                        return (
                          <div
                            className="admin-branch-study-row"
                            key={study.id}
                          >
                            <span className="admin-study-row__icon">
                              <FlaskConical size={18} />
                            </span>

                            <div>
                              <strong>
                                {study.name_es}
                              </strong>

                              <small>
                                {study.code ||
                                  "Sin codigo"}
                                {!study.active
                                  ? " \u00b7 Estudio inactivo"
                                  : ""}
                              </small>
                            </div>

                            <button
                              type="button"
                              className={[
                                "admin-switch-button",
                                enabled
                                  ? "is-on"
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              disabled={
                                busyStudyId ===
                                  study.id ||
                                !study.active
                              }
                              onClick={() =>
                                toggleStudy(
                                  study,
                                )
                              }
                              aria-pressed={
                                enabled
                              }
                            >
                              <span className="admin-switch-button__track">
                                <span />
                              </span>

                              <strong>
                                {busyStudyId ===
                                study.id
                                  ? "Guardando"
                                  : enabled
                                    ? "Disponible"
                                    : "No disponible"}
                              </strong>
                            </button>
                          </div>
                        );
                      },
                    )}
                  </div>

                  <BranchStudiesPagination
                    page={studyPage}
                    pageCount={
                      studyPageCount
                    }
                    totalItems={
                      filteredStudies.length
                    }
                    onPrevious={() =>
                      setStudyPage(
                        (current) =>
                          Math.max(
                            1,
                            current - 1,
                          ),
                      )
                    }
                    onNext={() =>
                      setStudyPage(
                        (current) =>
                          Math.min(
                            studyPageCount,
                            current + 1,
                          ),
                      )
                    }
                  />
                </article>
              ) : null}

              {tab === "hours" &&
              selectedBranch ? (
                <article className="admin-panel">
                  <header className="admin-panel__header">
                    <div>
                      <span className="admin-panel__icon">
                        <Clock3 size={20} />
                      </span>

                      <div>
                        <h2>
                          Horario semanal
                        </h2>

                        <p>
                          {
                            selectedBranch.name_es
                          }
                        </p>
                      </div>
                    </div>
                  </header>

                  <div className="admin-week-schedule">
                    {Object.entries(
                      dayNames,
                    ).map(
                      ([
                        weekday,
                        dayName,
                      ]) => {
                        const dayHours =
                          hours.filter(
                            (item) =>
                              Number(
                                item.weekday,
                              ) ===
                                Number(
                                  weekday,
                                ) &&
                              item.active,
                          );

                        const draft =
                          scheduleDrafts[
                            weekday
                          ];

                        return (
                          <section
                            className="admin-day-schedule"
                            key={weekday}
                          >
                            <div className="admin-day-schedule__name">
                              <strong>
                                {dayName}
                              </strong>

                              <span>
                                {dayHours.length
                                  ? `${dayHours.length} bloque(s)`
                                  : "Cerrado"}
                              </span>
                            </div>

                            <div className="admin-day-schedule__blocks">
                              {dayHours.map(
                                (item) => (
                                  <div
                                    className="admin-time-block"
                                    key={
                                      item.id
                                    }
                                  >
                                    <Clock3
                                      size={15}
                                    />

                                    <span>
                                      {shortTime(
                                        item.open_time,
                                      )}
                                      {" - "}
                                      {shortTime(
                                        item.close_time,
                                      )}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteSchedule(
                                          item.id,
                                        )
                                      }
                                      disabled={
                                        busySchedule
                                      }
                                      aria-label="Eliminar horario"
                                    >
                                      <Trash2
                                        size={15}
                                      />
                                    </button>
                                  </div>
                                ),
                              )}
                            </div>

                            <div className="admin-day-schedule__add">
                              <input
                                type="time"
                                value={
                                  draft.openTime
                                }
                                onChange={(event) =>
                                  updateDraft(
                                    weekday,
                                    "openTime",
                                    event.target
                                      .value,
                                  )
                                }
                                aria-label={`Hora de apertura ${dayName}`}
                              />

                              <span>a</span>

                              <input
                                type="time"
                                value={
                                  draft.closeTime
                                }
                                onChange={(event) =>
                                  updateDraft(
                                    weekday,
                                    "closeTime",
                                    event.target
                                      .value,
                                  )
                                }
                                aria-label={`Hora de cierre ${dayName}`}
                              />

                              <button
                                type="button"
                                className="admin-add-time-button"
                                onClick={() =>
                                  addSchedule(
                                    weekday,
                                  )
                                }
                                disabled={
                                  busySchedule
                                }
                              >
                                <Plus
                                  size={16}
                                />
                                <span>
                                  Agregar
                                </span>
                              </button>
                            </div>
                          </section>
                        );
                      },
                    )}
                  </div>
                </article>
              ) : null}

              {message ? (
                <div
                  className={[
                    "admin-master-message",
                    "admin-config-message",
                    `is-${messageType}`,
                  ].join(" ")}
                >
                  {message}
                </div>
              ) : null}
            </>
          ) : (
            <article className="admin-panel admin-branch-empty">
              <Building2 size={38} />
              <strong>
                No hay una sucursal seleccionada
              </strong>
              <span>
                Selecciona una sede o crea una nueva.
              </span>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}