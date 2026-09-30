import {
  useState,
} from "react";
import {
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

export default function ForcedPasswordChangeModal() {

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmation,
    setConfirmation,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");


  async function handleSubmit(
    event,
  ) {

    event.preventDefault();

    if (saving) {
      return;
    }


    if (
      password.length < 10 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {

      setMessage(
        "Usa minimo 10 caracteres, incluyendo mayuscula, minuscula, numero y simbolo.",
      );

      return;
    }


    if (
      password !==
      confirmation
    ) {

      setMessage(
        "Las contrasenas no coinciden.",
      );

      return;
    }


    setSaving(true);
    setMessage("");


    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke(
          "complete-initial-password-change",
          {
            body: {
              password,
            },
          },
        );


    setSaving(false);


    if (
      error ||
      !data?.ok
    ) {

      console.error(
        error ?? data,
      );

      setMessage(
        data?.message ??
          "No fue posible cambiar la contrasena.",
      );

      return;
    }


    /*
     * Recargar perfil y sesion.
     * Al volver a cargar:
     * must_change_password = false
     * y el sistema queda disponible.
     */
    window.location.reload();

  }


  return (
    <div className="admin-password-gate">

      <section className="admin-password-modal">

        <span className="admin-password-modal__icon">
          <ShieldCheck
            size={31}
          />
        </span>

        <div className="admin-password-modal__heading">

          <h1>
            Cambiar contrasena
          </h1>

          <p>
            Por seguridad debes cambiar la contrasena temporal antes de continuar.
          </p>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <label>

            <span>
              Nueva contrasena
            </span>

            <div className="admin-form-control">

              <KeyRound
                size={18}
              />

              <input
                type="password"
                autoComplete="new-password"
                value={
                  password
                }
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target
                      .value,
                  )
                }
                placeholder="Minimo 10 caracteres"
                autoFocus
              />

            </div>

          </label>


          <label>

            <span>
              Confirmar contrasena
            </span>

            <div className="admin-form-control">

              <KeyRound
                size={18}
              />

              <input
                type="password"
                autoComplete="new-password"
                value={
                  confirmation
                }
                onChange={(
                  event,
                ) =>
                  setConfirmation(
                    event.target
                      .value,
                  )
                }
                placeholder="Repite la nueva contrasena"
              />

            </div>

          </label>


          <small className="admin-password-modal__help">
            Debe incluir mayuscula, minuscula, numero y simbolo.
          </small>


          {message ? (

            <div
              className="admin-master-message is-error"
              role="alert"
            >
              {message}
            </div>

          ) : null}


          <button
            type="submit"
            className="admin-button admin-button--primary admin-password-modal__submit"
            disabled={
              saving ||
              !password ||
              !confirmation
            }
          >

            <ShieldCheck
              size={18}
            />

            <span>
              {saving
                ? "Cambiando..."
                : "Cambiar contrasena"}
            </span>

          </button>

        </form>

      </section>

    </div>
  );
}