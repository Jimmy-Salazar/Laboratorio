import {

  Phone,
  Mail,
  MapPin,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";

import { useLanguage } from "../../context/LanguageContext";

/*
 * FOOTER PRINCIPAL
 * ---------------------------------------------------------------------------
 * La marca visible del proyecto ahora es Dr. Chasis.
 */

/* PATCH_06_23_BRAND_FOOTER */

/* PATCH_06_25_FOOTER_LOGO */

export default function SiteFooter() {
  const { content } = useLanguage();
  const currentYear = new Date().getFullYear();

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
          <h3>{content.footer.contactTitle}</h3>

          <ul className="footer-list">
            <li>
              <Phone size={15} aria-hidden="true" />
              {content.footer.phone}
            </li>

            <li>
              <Mail size={15} aria-hidden="true" />
              {content.footer.email}
            </li>

            <li>
              <MapPin size={15} aria-hidden="true" />
              {content.footer.address}
            </li>
          </ul>
        </div>

        <div>
          <h3>{content.footer.quickLinksTitle}</h3>

          <div className="footer-links">
            <a href="#home">{content.navigation.home}</a>
            <a href="#branches">{content.navigation.branches}</a>
            <a href="#specialties">{content.navigation.specialties}</a>
            <a href="#promotions">{content.navigation.promotions}</a>
            <a href="/resultados">{content.navigation.results}</a>
          </div>
        </div>

        <div>
          <h3>{content.footer.socialTitle}</h3>

          <div className="social-links">
            <a href="#" aria-label="Facebook">
              <FaFacebookF size={16} aria-hidden="true" />
            </a>

            <a href="#" aria-label="Instagram">
              <FaInstagram size={17} aria-hidden="true" />
            </a>

            <a href="#" aria-label="YouTube">
              <FaYoutube size={18} aria-hidden="true" />
            </a>

            <a href="#" aria-label="LinkedIn">
              <FaLinkedinIn size={17} aria-hidden="true" />
            </a>
          </div>

          <p className="footer-slogan">{content.footer.slogan}</p>
        </div>
      </div>

      <div className="page-container site-footer__bottom">
        <span>
          © {currentYear} Dr. Chasi. {content.footer.rights}
        </span>

        <div>
          <a href="#">{content.footer.privacy}</a>
          <span>·</span>
          <a href="#">{content.footer.terms}</a>
        </div>
      </div>
    </footer>
  );
}


