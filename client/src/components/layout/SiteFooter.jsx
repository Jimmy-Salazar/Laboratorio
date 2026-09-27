import {
  useEffect,
  useMemo,
  useState,
  } from "react";
import { Mail, MapPin, MessageCircle, Music2, Phone } from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";



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

const emptySettings = {
  phone: "",
  phone_enabled: false,

  whatsapp: "",
  whatsapp_enabled: false,

  email: "",
  email_enabled: false,

  address: "",
  address_enabled: false,

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

function cleanText(
  value,
) {
  return String(
    value ?? "",
  ).trim();
}

function whatsappHref(
  value,
) {
  const digits =
    cleanText(value).replace(
      /\D/g,
      "",
    );

  return digits
    ? `https://wa.me/${digits}`
    : "";
}

export default function SiteFooter() {
  const {
    content,
  } = useLanguage();

  const currentYear =
    new Date().getFullYear();

  const [
    settings,
    setSettings,
  ] =
    useState(
      emptySettings,
    );

  useEffect(() => {
    let mounted =
      true;

    async function loadSettings() {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "site_contact_settings",
          )
          .select("*")
          .eq(
            "id",
            "main",
          )
          .maybeSingle();

      if (
        !mounted
      ) {
        return;
      }

      if (error) {
        console.error(
          "Could not load footer contact settings:",
          error,
        );
        return;
      }

      setSettings({
        ...emptySettings,
        ...(data ?? {}),
      });
    }

    loadSettings();

    return () => {
      mounted =
        false;
    };
  }, []);

  const contacts =
    useMemo(() => {
      const items = [];

      if (
        settings.phone_enabled &&
        cleanText(
          settings.phone,
        )
      ) {
        items.push({
          id: "phone",
          icon: Phone,
          text:
            cleanText(
              settings.phone,
            ),
          href: `tel:${cleanText(
            settings.phone,
          ).replace(
            /[^\d+]/g,
            "",
          )}`,
        });
      }

      if (
        settings.whatsapp_enabled &&
        cleanText(
          settings.whatsapp,
        )
      ) {
        items.push({
          id: "whatsapp",
          icon:
            MessageCircle,
          text:
            cleanText(
              settings.whatsapp,
            ),
          href:
            whatsappHref(
              settings.whatsapp,
            ),
          external: true,
        });
      }

      if (
        settings.email_enabled &&
        cleanText(
          settings.email,
        )
      ) {
        items.push({
          id: "email",
          icon: Mail,
          text:
            cleanText(
              settings.email,
            ),
          href: `mailto:${cleanText(
            settings.email,
          )}`,
        });
      }

      if (
        settings.address_enabled &&
        cleanText(
          settings.address,
        )
      ) {
        items.push({
          id: "address",
          icon: MapPin,
          text:
            cleanText(
              settings.address,
            ),
          href: "",
        });
      }

      return items;
    }, [settings]);

  const socials =
    useMemo(
      () => [
        {
          id: "facebook",
          label:
            "BrandFacebook",
          icon:
            BrandFacebook,
          enabled:
            settings.facebook_enabled,
          href:
            cleanText(
              settings.facebook_url,
            ),
        },
        {
          id: "instagram",
          label:
            "BrandInstagram",
          icon:
            BrandInstagram,
          enabled:
            settings.instagram_enabled,
          href:
            cleanText(
              settings.instagram_url,
            ),
        },
        {
          id: "tiktok",
          label:
            "TikTok",
          icon:
            Music2,
          enabled:
            settings.tiktok_enabled,
          href:
            cleanText(
              settings.tiktok_url,
            ),
        },
        {
          id: "youtube",
          label:
            "YouTube",
          icon:
            BrandYoutube,
          enabled:
            settings.youtube_enabled,
          href:
            cleanText(
              settings.youtube_url,
            ),
        },
        {
          id: "linkedin",
          label:
            "LinkedIn",
          icon:
            BrandLinkedin,
          enabled:
            settings.linkedin_enabled,
          href:
            cleanText(
              settings.linkedin_url,
            ),
        },
      ].filter(
        (social) =>
          social.enabled &&
          social.href,
      ),
      [settings],
    );

  return (
    <footer className="site-footer">
      <div className="page-container site-footer__grid">
        <div className="footer-brand">
          <div className="brand brand--footer brand--footer-logo">
            <img
              className="brand-logo brand-logo--footer"
              src="/brand/dr-milton-chasi-logo-footer.png"
              alt="Laboratorio Clinico Dr. Milton Chasi"
            />
          </div>
        </div>

        <div>
          <h3>
            {content.footer.contactTitle}
          </h3>

          <ul className="footer-list">
            {contacts.map(
              (contact) => {
                const Icon =
                  contact.icon;

                return (
                  <li
                    key={
                      contact.id
                    }
                  >
                    <Icon
                      size={15}
                      aria-hidden="true"
                    />

                    {contact.href ? (
                      <a
                        href={
                          contact.href
                        }
                        target={
                          contact.external
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          contact.external
                            ? "noreferrer"
                            : undefined
                        }
                      >
                        {
                          contact.text
                        }
                      </a>
                    ) : (
                      <span>
                        {
                          contact.text
                        }
                      </span>
                    )}
                  </li>
                );
              },
            )}
          </ul>
        </div>

        <div>
          <h3>
            {content.footer.quickLinksTitle}
          </h3>

          <div className="footer-links">
            <a href="/#home">
              {content.navigation.home}
            </a>

            <a href="/#branches">
              {content.navigation.branches}
            </a>

            <a href="/#specialties">
              {content.navigation.specialties}
            </a>

            <a href="/#highlights">
              {content.navigation.promotions}
            </a>

            <a href="/resultados">
              {content.navigation.results}
            </a>
          </div>
        </div>

        <div>
          <h3>
            {content.footer.socialTitle}
          </h3>

          {socials.length ? (
            <div className="social-links">
              {socials.map(
                (social) => {
                  const Icon =
                    social.icon;

                  return (
                    <a
                      key={
                        social.id
                      }
                      href={
                        social.href
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label={
                        social.label
                      }
                    >
                      <Icon
                        size={18}
                      />
                    </a>
                  );
                },
              )}
            </div>
          ) : null}

          <p className="footer-slogan">
            {content.footer.slogan}
          </p>
        </div>
      </div>

      <div className="page-container site-footer__bottom">
        <span>
          {`\u00a9 ${currentYear} Laboratorio Clinico Dr. Milton Chasi. ${content.footer.rights}`}
        </span>

        <div>
          <a href="#">
            {content.footer.privacy}
          </a>

          <span>
            {"\u00b7"}
          </span>

          <a href="#">
            {content.footer.terms}
          </a>
        </div>
      </div>
    </footer>
  );
}