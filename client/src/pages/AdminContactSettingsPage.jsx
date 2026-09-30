import { useCallback, useEffect, useMemo, useState, } from "react";
import { Mail, MapPin, MessageCircle, Music2, Phone, RefreshCw, Save, Share2 } from "lucide-react";

import { supabase } from "../lib/supabase";
import "../styles/admin.css";



function BrandGlyph({
  label,
  size = 18,
}) {
  const fontSize =
    Math.max(
      8,
      Math.round(
        size * 0.5,
      ),
    );

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: "inline-grid",
        placeItems: "center",
        flex: "0 0 auto",
        borderRadius: "5px",
        fontSize,
        lineHeight: 1,
        fontWeight: 900,
        letterSpacing: "-0.02em",
      }}
    >
      {label}
    </span>
  );
}

function BrandFacebook(props) {
  return (
    <BrandGlyph
      {...props}
      label="f"
    />
  );
}

function BrandInstagram(props) {
  return (
    <BrandGlyph
      {...props}
      label="IG"
    />
  );
}

function BrandYoutube(props) {
  return (
    <BrandGlyph
      {...props}
      label="YT"
    />
  );
}

function BrandLinkedin(props) {
  return (
    <BrandGlyph
      {...props}
      label="in"
    />
  );
}

const initialForm = {
  id: "main",

  phone: "",
  phone_enabled: true,

  whatsapp: "",
  whatsapp_enabled: true,

  email: "",
  email_enabled: true,

  address: "",
  address_enabled: true,

  facebook_url: "",
  facebook_enabled: false,

  instagram_url: "",
  instagram_enabled: false,

  tiktok_url: "",
  tiktok_enabled: false,

  youtube_url: "",
  youtube_enabled: false,

  linkedin_url: "",
  linkedin_enabled: false,
};

const socialDefinitions = [
  {
    key: "facebook",
    label: "BrandFacebook",
    urlField: "facebook_url",
    enabledField: "facebook_enabled",
    icon: BrandFacebook,
    placeholder:
      "https://facebook.com/...",
  },
  {
    key: "instagram",
    label: "BrandInstagram",
    urlField: "instagram_url",
    enabledField: "instagram_enabled",
    icon: BrandInstagram,
    placeholder:
      "https://instagram.com/...",
  },
  {
    key: "tiktok",
    label: "TikTok",
    urlField: "tiktok_url",
    enabledField: "tiktok_enabled",
    icon: Music2,
    placeholder:
      "https://tiktok.com/@...",
  },
  {
    key: "youtube",
    label: "YouTube",
    urlField: "youtube_url",
    enabledField: "youtube_enabled",
    icon: BrandYoutube,
    placeholder:
      "https://youtube.com/...",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    urlField: "linkedin_url",
    enabledField: "linkedin_enabled",
    icon: BrandLinkedin,
    placeholder:
      "https://linkedin.com/...",
  },
];

const contactDefinitions = [
  {
    key: "phone",
    label: "Telefono",
    valueField: "phone",
    enabledField: "phone_enabled",
    icon: Phone,
    placeholder:
      "+593 4 ...",
    type: "tel",
  },
  {
    key: "whatsapp",
    label: "WhatsApp para cotizaciones",
    valueField: "whatsapp",
    enabledField: "whatsapp_enabled",
    icon: MessageCircle,
    placeholder:
      "+593 99 ...",
    helpText:
      "Este numero tambien se utiliza para el boton Cotizar del HOME.",
    type: "tel",
    description:
      "Este numero se usa en el boton COTIZAR del HOME.",
  },
  {
    key: "email",
    label: "Correo electronico",
    valueField: "email",
    enabledField: "email_enabled",
    icon: Mail,
    placeholder:
      "contacto@laboratorio.com",
    type: "email",
  },
  {
    key: "address",
    label: "Direccion",
    valueField: "address",
    enabledField: "address_enabled",
    icon: MapPin,
    placeholder:
      "Direccion principal",
    type: "text",
  },
];

function cleanForm(data) {
  return {
    ...initialForm,
    ...(data ?? {}),
  };
}

function isValidUrl(value) {
  const clean =
    String(value ?? "").trim();

  if (!clean) {
    return true;
  }

  try {
    const parsed =
      new URL(clean);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export default function AdminContactSettingsPage() {
  const [form, setForm] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("info");

  const enabledSocialCount =
    useMemo(
      () =>
        socialDefinitions.filter(
          (social) =>
            form[
              social.enabledField
            ] &&
            String(
              form[
                social.urlField
              ] ?? "",
            ).trim(),
        ).length,
      [form],
    );

  const loadSettings =
    useCallback(async () => {
      setLoading(true);
      setMessage("");

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "site_contact_settings",
          )
          .select("*")
          .eq("id", "main")
          .maybeSingle();

      if (error) {
        console.error(error);

        setMessage(
          error.code === "42P01"
            ? "Falta ejecutar la migracion 013 en Supabase."
            : "No fue posible cargar la configuracion.",
        );
        setMessageType(
          "error",
        );
        setLoading(false);
        return;
      }

      setForm(
        cleanForm(data),
      );

      setLoading(false);
    }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function updateField(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  async function handleSave(
    event,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const invalidSocial =
      socialDefinitions.find(
        (social) =>
          form[
            social.enabledField
          ] &&
          !isValidUrl(
            form[
              social.urlField
            ],
          ),
      );

    if (invalidSocial) {
      setMessage(
        `La URL de ${invalidSocial.label} no es valida. Usa http:// o https://.`,
      );
      setMessageType(
        "error",
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      id: "main",

      phone:
        form.phone.trim(),
      phone_enabled:
        Boolean(
          form.phone_enabled,
        ),

      whatsapp:
        form.whatsapp.trim(),
      whatsapp_enabled:
        Boolean(
          form.whatsapp_enabled,
        ),

      email:
        form.email.trim(),
      email_enabled:
        Boolean(
          form.email_enabled,
        ),

      address:
        form.address.trim(),
      address_enabled:
        Boolean(
          form.address_enabled,
        ),

      facebook_url:
        form.facebook_url.trim(),
      facebook_enabled:
        Boolean(
          form.facebook_enabled,
        ),

      instagram_url:
        form.instagram_url.trim(),
      instagram_enabled:
        Boolean(
          form.instagram_enabled,
        ),

      tiktok_url:
        form.tiktok_url.trim(),
      tiktok_enabled:
        Boolean(
          form.tiktok_enabled,
        ),

      youtube_url:
        form.youtube_url.trim(),
      youtube_enabled:
        Boolean(
          form.youtube_enabled,
        ),

      linkedin_url:
        form.linkedin_url.trim(),
      linkedin_enabled:
        Boolean(
          form.linkedin_enabled,
        ),
    };

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "site_contact_settings",
        )
        .upsert(
          payload,
          {
            onConflict: "id",
          },
        )
        .select("*")
        .single();

    setSaving(false);

    if (error) {
      console.error(error);

      setMessage(
        "No fue posible guardar la configuracion.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    setForm(
      cleanForm(data),
    );

    setMessage(
      "Configuracion guardada. El pie de pagina se actualizara con estos datos.",
    );
    setMessageType(
      "success",
    );
  }

  return (
    <div className="admin-contact-settings-page">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            Configuracion
          </span>

          <h1>
            Contactos y redes
          </h1>

          <p>
            Administra la informacion publica que aparece en el pie de las paginas.
          </p>
        </div>

        <button
          type="button"
          className="admin-button admin-button--secondary"
          onClick={
            loadSettings
          }
          disabled={
            loading ||
            saving
          }
        >
          <RefreshCw
            size={17}
          />
          <span>
            Actualizar
          </span>
        </button>
      </section>

      {message ? (
        <div
          className={[
            "admin-master-message",
            `is-${messageType}`,
          ].join(" ")}
          role="status"
        >
          {message}
        </div>
      ) : null}

      <form
        className="admin-contact-settings-grid"
        onSubmit={
          handleSave
        }
      >
        <section className="admin-panel">
          <header className="admin-panel__header">
            <div>
              <span className="admin-panel__icon">
                <Phone
                  size={20}
                />
              </span>

              <div>
                <h2>
                  Contactos
                </h2>

                <p>
                  Datos publicos de contacto. El WhatsApp indicado aqui tambien controla el boton COTIZAR del HOME.
                </p>
              </div>
            </div>
          </header>

          <div className="admin-settings-list">
            {contactDefinitions.map(
              (contact) => {
                const Icon =
                  contact.icon;

                return (
                  <div
                    className="admin-setting-row"
                    key={
                      contact.key
                    }
                  >
                    <div className="admin-setting-row__heading">
                      <span className="admin-setting-row__icon">
                        <Icon
                          size={18}
                        />
                      </span>

                      <div>
                        <strong>
                          {
                            contact.label
                          }
                        </strong>

                        <small>
                          {contact.description ??
                            "Mostrar en el pie de pagina"}
                        </small>
                      </div>

                      <label className="admin-switch">
                        <input
                          type="checkbox"
                          checked={
                            Boolean(
                              form[
                                contact
                                  .enabledField
                              ],
                            )
                          }
                          onChange={(
                            event,
                          ) =>
                            updateField(
                              contact
                                .enabledField,
                              event
                                .target
                                .checked,
                            )
                          }
                        />

                        <span className="admin-switch__track">
                          <span className="admin-switch__thumb" />
                        </span>

                        <b>
                          {form[
                            contact
                              .enabledField
                          ]
                            ? "ON"
                            : "OFF"}
                        </b>
                      </label>
                    </div>

                    <div className="admin-form-control">
                      <Icon
                        size={18}
                      />

                      <input
                        type={
                          contact.type
                        }
                        value={
                          form[
                            contact
                              .valueField
                          ]
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            contact
                              .valueField,
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder={
                          contact.placeholder
                        }
                        disabled={
                          loading
                        }
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        <section className="admin-panel">
          <header className="admin-panel__header">
            <div>
              <span className="admin-panel__icon">
                <Share2
                  size={20}
                />
              </span>

              <div>
                <h2>
                  Redes sociales
                </h2>

                <p>
                  {enabledSocialCount} red(es) visible(s) actualmente.
                </p>
              </div>
            </div>
          </header>

          <div className="admin-settings-list">
            {socialDefinitions.map(
              (social) => {
                const Icon =
                  social.icon;

                return (
                  <div
                    className="admin-setting-row"
                    key={
                      social.key
                    }
                  >
                    <div className="admin-setting-row__heading">
                      <span className="admin-setting-row__icon">
                        <Icon
                          size={18}
                        />
                      </span>

                      <div>
                        <strong>
                          {
                            social.label
                          }
                        </strong>

                        <small>
                          Icono publico
                        </small>
                      </div>

                      <label className="admin-switch">
                        <input
                          type="checkbox"
                          checked={
                            Boolean(
                              form[
                                social
                                  .enabledField
                              ],
                            )
                          }
                          onChange={(
                            event,
                          ) =>
                            updateField(
                              social
                                .enabledField,
                              event
                                .target
                                .checked,
                            )
                          }
                        />

                        <span className="admin-switch__track">
                          <span className="admin-switch__thumb" />
                        </span>

                        <b>
                          {form[
                            social
                              .enabledField
                          ]
                            ? "ON"
                            : "OFF"}
                        </b>
                      </label>
                    </div>

                    <div className="admin-form-control">
                      <Icon
                        size={18}
                      />

                      <input
                        type="url"
                        value={
                          form[
                            social
                              .urlField
                          ]
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            social
                              .urlField,
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder={
                          social.placeholder
                        }
                        disabled={
                          loading
                        }
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        <div className="admin-contact-settings-actions">
          <button
            type="submit"
            className="admin-button admin-button--primary"
            disabled={
              loading ||
              saving
            }
          >
            <Save
              size={18}
            />

            <span>
              {saving
                ? "Guardando..."
                : "Guardar configuracion"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}