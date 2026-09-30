import { useCallback, useEffect, useState } from "react";
import { ImagePlus, RefreshCw, Save, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { highlightImageUrl } from "../hooks/useSiteHighlights";
import "../styles/admin.css";
import "../styles/admin-highlights.css";

const MAX_SIZE = 5 * 1024 * 1024;
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function AdminHighlightsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [titleEs, setTitleEs] = useState("");
  const [titleEn, setTitleEn] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("site_highlights")
      .select("id,title_es,title_en,image_path,active,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (loadError) {
      console.error(loadError);
      setMessage("No se pudieron cargar los destacados. Comprueba que aplicaste la migración 031.");
      setError(true);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function notify(text, isError = false) {
    setMessage(text);
    setError(isError);
  }

  function edit(id, field, value) {
    setRows((current) => current.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  }

  async function addHighlight(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy) return;

    const es = titleEs.trim();
    const en = titleEn.trim() || es;
    if (!es || es.length > 120 || en.length > 120) {
      notify("Escribe un título de hasta 120 caracteres.", true);
      return;
    }
    if (!file || !EXTENSIONS[file.type] || file.size > MAX_SIZE) {
      notify("Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB.", true);
      return;
    }

    setBusy(true);
    notify("");
    const path = `${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
    const { error: uploadError } = await supabase.storage
      .from("site-highlights")
      .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error(uploadError);
      notify("No se pudo subir la imagen. Revisa el permiso de Storage.", true);
      setBusy(false);
      return;
    }

    const lastOrder = rows.reduce((max, row) =>
      Math.max(max, Number(row.sort_order) || 0), 0
    );
    const { error: insertError } = await supabase.from("site_highlights")
      .insert({
        title_es: es,
        title_en: en,
        image_path: path,
        sort_order: Math.min(9999, lastOrder + 10),
        active: true,
      });

    if (insertError) {
      console.error(insertError);
      await supabase.storage.from("site-highlights").remove([path]);
      notify("La imagen subió, pero no se guardó el destacado.", true);
      setBusy(false);
      return;
    }

    setTitleEs("");
    setTitleEn("");
    setFile(null);
    form.reset();
    await load();
    notify("Destacado publicado. Comprueba el sitio público.");
    setBusy(false);
  }

  async function save(row) {
    if (busy) return;
    const es = row.title_es.trim();
    const en = row.title_en.trim() || es;
    const order = Number(row.sort_order);
    if (!es || es.length > 120 || en.length > 120 ||
        !Number.isInteger(order) || order < 0 || order > 9999) {
      notify("Revisa los títulos (máximo 120 caracteres) y el orden (0 a 9999).", true);
      return;
    }
    setBusy(true);
    const { error: saveError } = await supabase.from("site_highlights")
      .update({ title_es: es, title_en: en, sort_order: order, active: row.active })
      .eq("id", row.id);
    if (saveError) {
      console.error(saveError);
      notify("No se pudieron guardar los cambios.", true);
    } else {
      await load();
      notify("Cambios guardados.");
    }
    setBusy(false);
  }

  async function remove(row) {
    if (busy || !window.confirm(`¿Eliminar definitivamente "${row.title_es}"?`)) return;
    setBusy(true);
    const { error: deleteError } = await supabase.from("site_highlights")
      .delete().eq("id", row.id);
    if (deleteError) {
      console.error(deleteError);
      notify("No se pudo eliminar el destacado.", true);
    } else {
      let imageRemoved = true;
      if (!row.image_path.startsWith("/")) {
        const { error: storageError } = await supabase.storage
          .from("site-highlights").remove([row.image_path]);
        if (storageError) {
          console.error(storageError);
          imageRemoved = false;
        }
      }
      await load();
      notify(imageRemoved
        ? "Destacado eliminado."
        : "Destacado eliminado de la página, pero no se pudo borrar su imagen de Storage.",
      !imageRemoved);
    }
    setBusy(false);
  }

  return (
    <section className="admin-highlights-page">
      <header className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">Configuración del sitio</span>
          <h1>Destacados</h1>
          <p>Sube promociones, campañas o publicidad para el carrusel público.</p>
        </div>
        <button type="button" className="admin-button admin-button--secondary"
          onClick={load} disabled={busy || loading}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </header>

      {message && (
        <p role={error ? "alert" : "status"}
          className={`admin-highlights-message ${error ? "is-error" : ""}`}>
          {message}
        </p>
      )}

      <form className="admin-highlights-new" onSubmit={addHighlight}>
        <div>
          <h2>Nuevo destacado</h2>
          <p>JPG, PNG o WEBP, máximo 5 MB. La imagen será pública al guardar.</p>
          <label>Título en español
            <input value={titleEs} maxLength={120} required
              onChange={(event) => setTitleEs(event.target.value)} />
          </label>
          <label>Título en inglés (opcional)
            <input value={titleEn} maxLength={120}
              onChange={(event) => setTitleEn(event.target.value)}
              placeholder="Si se deja vacío, se usa el título en español" />
          </label>
          <label>Imagen
            <input type="file" accept="image/jpeg,image/png,image/webp"
              required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          <button type="submit" className="admin-button admin-button--primary"
            disabled={busy || loading}>
            <ImagePlus size={17} /> {busy ? "Guardando..." : "Subir y publicar"}
          </button>
        </div>
        <div className="admin-highlights-preview">
          {preview ? <img src={preview} alt="Vista previa del nuevo destacado" /> :
            <span>Vista previa de la imagen</span>}
        </div>
      </form>

      <h2 className="admin-highlights-list-title">Destacados existentes</h2>
      {loading ? <p>Cargando...</p> : rows.length === 0 ?
        <p>No hay destacados. Sube el primero para mostrar esta sección.</p> :
        <div className="admin-highlights-list">
          {rows.map((row) => (
            <article className="admin-highlights-item" key={row.id}>
              <img src={highlightImageUrl(row.image_path)}
                alt={row.title_es} loading="lazy" />
              <div className="admin-highlights-item__fields">
                <label>Título en español
                  <input value={row.title_es} maxLength={120}
                    onChange={(event) => edit(row.id, "title_es", event.target.value)} />
                </label>
                <label>Título en inglés
                  <input value={row.title_en} maxLength={120}
                    onChange={(event) => edit(row.id, "title_en", event.target.value)} />
                </label>
                <label>Orden
                  <input type="number" min="0" max="9999" step="1"
                    value={row.sort_order}
                    onChange={(event) => edit(row.id, "sort_order", event.target.value)} />
                </label>
                <label className="admin-highlights-switch">
                  <input type="checkbox" checked={row.active}
                    onChange={(event) => edit(row.id, "active", event.target.checked)} />
                  Mostrar en la página
                </label>
                <div className="admin-highlights-item__actions">
                  <button type="button" className="admin-button admin-button--primary"
                    disabled={busy} onClick={() => save(row)}>
                    <Save size={16} /> Guardar
                  </button>
                  <button type="button" className="admin-button admin-button--danger-soft"
                    disabled={busy} onClick={() => remove(row)}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      }
    </section>
  );
}
