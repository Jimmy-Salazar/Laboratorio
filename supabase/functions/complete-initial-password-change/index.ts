import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};


function json(
  body: Record<string, unknown>,
  status = 200,
) {

  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}


function validPassword(
  value: string,
) {

  return (
    value.length >= 10 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );

}


Deno.serve(async (req) => {

  if (
    req.method === "OPTIONS"
  ) {

    return new Response(
      "ok",
      {
        headers:
          corsHeaders,
      },
    );

  }


  if (
    req.method !== "POST"
  ) {

    return json(
      {
        ok: false,
        message:
          "Metodo no permitido.",
      },
      405,
    );

  }


  const supabaseUrl =
    Deno.env.get(
      "SUPABASE_URL",
    ) ?? "";

  const serviceRoleKey =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    ) ?? "";


  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {

    return json(
      {
        ok: false,
        message:
          "Configuracion del servidor incompleta.",
      },
      500,
    );

  }


  const authorization =
    req.headers.get(
      "Authorization",
    ) ?? "";

  const token =
    authorization
      .replace(
        /^Bearer\s+/i,
        "",
      )
      .trim();


  if (!token) {

    return json(
      {
        ok: false,
        message:
          "No autorizado.",
      },
      401,
    );

  }


  const adminClient =
    createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken:
            false,
          persistSession:
            false,
        },
      },
    );


  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await adminClient
      .auth
      .getUser(
        token,
      );


  if (
    userError ||
    !user
  ) {

    return json(
      {
        ok: false,
        message:
          "Sesion invalida.",
      },
      401,
    );

  }


  const {
    data:
      profile,
    error:
      profileError,
  } =
    await adminClient
      .from(
        "staff_profiles",
      )
      .select(
        "user_id, full_name, role, active, must_change_password",
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();


  if (
    profileError ||
    !profile ||
    !profile.active
  ) {

    return json(
      {
        ok: false,
        message:
          "Usuario no autorizado.",
      },
      403,
    );

  }


  let body: {
    password?: string;
  };


  try {

    body =
      await req.json();

  }
  catch {

    return json(
      {
        ok: false,
        message:
          "Solicitud invalida.",
      },
      400,
    );

  }


  const password =
    String(
      body.password ?? "",
    );


  if (
    !validPassword(
      password,
    )
  ) {

    return json(
      {
        ok: false,
        message:
          "La nueva contrasena debe tener minimo 10 caracteres, mayuscula, minuscula, numero y simbolo.",
      },
      400,
    );

  }


  const {
    error:
      passwordError,
  } =
    await adminClient
      .auth
      .admin
      .updateUserById(
        user.id,
        {
          password,
        },
      );


  if (passwordError) {

    console.error(
      passwordError,
    );

    return json(
      {
        ok: false,
        message:
          "No fue posible cambiar la contrasena.",
      },
      500,
    );

  }


  const changedAt =
    new Date().toISOString();


  const {
    error:
      profileUpdateError,
  } =
    await adminClient
      .from(
        "staff_profiles",
      )
      .update({
        must_change_password:
          false,

        password_changed_at:
          changedAt,
      })
      .eq(
        "user_id",
        user.id,
      );


  if (profileUpdateError) {

    console.error(
      profileUpdateError,
    );

    return json(
      {
        ok: false,
        message:
          "La contrasena cambio, pero no fue posible actualizar el perfil. Intenta nuevamente sin cerrar la sesion.",
      },
      500,
    );

  }


  const {
    error:
      auditError,
  } =
    await adminClient
      .rpc(
        "write_service_audit_log",
        {
          p_actor_user_id:
            user.id,

          p_action:
            "edit",

          p_entity_type:
            "staff_profiles",

          p_entity_id:
            user.id,

          p_description:
            "Cambio su contrasena inicial.",

          p_changed_fields:
            [
              "password",
            ],
        },
      );


  if (auditError) {

    console.error(
      "Audit log error:",
      auditError,
    );

  }


  return json({
    ok:
      true,

    passwordChangedAt:
      changedAt,
  });

});