import { ArrowLeft, UserRound, Settings } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";

/*
 * LOGIN TEMPORAL
 * ---------------------------------------------------------------------------
 * Esta vista reserva la ruta /login desde ahora.
 * El formulario real se agregara en la siguiente fase junto con Supabase Auth.
 */

export default function LoginPage() {
  const { content } = useLanguage();
  const [searchParams] = useSearchParams();

  const requestedRole = searchParams.get("role");
  const isAdministrator = requestedRole === "administrator";

  return (
    <main className="login-page">
      <div className="login-page__top">
        <Link to="/" className="login-page__back">
          <ArrowLeft size={18} />
          {content.login.back}
        </Link>

        <LanguageSwitcher />
      </div>

      <section className="login-card">
        <div className="login-card__icon">
          {isAdministrator ? <Settings size={34} /> : <UserRound size={34} />}
        </div>

        <p className="eyebrow">
          {isAdministrator
            ? content.login.administrator
            : content.login.patient}
        </p>

        <h1>{content.login.title}</h1>

        <p>{content.login.description}</p>

        <Link className="button button--primary" to="/">
          {content.login.back}
        </Link>
      </section>
    </main>
  );
}

