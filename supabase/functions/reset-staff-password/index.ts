import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore
import nodemailer from "npm:nodemailer@6.10.1";

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


function validUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}


function escapeHtml(
  value: string,
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function randomCharacter(
  characters: string,
) {
  const values =
    new Uint32Array(1);

  crypto.getRandomValues(
    values,
  );

  return characters[
    values[0] %
    characters.length
  ];
}


function generateTemporaryPassword() {

  const upper =
    "ABCDEFGHJKLMNPQRSTUVWXYZ";

  const lower =
    "abcdefghijkmnopqrstuvwxyz";

  const numbers =
    "23456789";

  const symbols =
    "!@#$%*-_";

  const all =
    upper +
    lower +
    numbers +
    symbols;

  const password = [
    randomCharacter(
      upper,
    ),
    randomCharacter(
      lower,
    ),
    randomCharacter(
      numbers,
    ),
    randomCharacter(
      symbols,
    ),
  ];


  while (
    password.length <
    14
  ) {
    password.push(
      randomCharacter(
        all,
      ),
    );
  }


  for (
    let index =
      password.length - 1;
    index > 0;
    index -= 1
  ) {

    const values =
      new Uint32Array(1);

    crypto.getRandomValues(
      values,
    );

    const target =
      values[0] %
      (index + 1);

    [
      password[index],
      password[target],
    ] = [
      password[target],
      password[index],
    ];
  }


  return password.join("");
}


Deno.serve(async (req) => {

  if (
    req.method ===
    "OPTIONS"
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
    req.method !==
    "POST"
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

  const anonKey =
    Deno.env.get(
      "SUPABASE_ANON_KEY",
    ) ?? "";

  const serviceRoleKey =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    ) ?? "";

  const gmailUser =
    Deno.env.get(
      "GMAIL_USER",
    ) ?? "";

  const gmailPassword =
    Deno.env.get(
      "GMAIL_APP_PASSWORD",
    ) ?? "";


  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey ||
    !gmailUser ||
    !gmailPassword
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
    );

  if (!authorization) {
    return json(
      {
        ok: false,
        message:
          "No autorizado.",
      },
      401,
    );
  }


  const callerClient =
    createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization:
              authorization,
          },
        },
      },
    );


  const {
    data: {
      user: caller,
    },
    error:
      callerError,
  } =
    await callerClient
      .auth
      .getUser();


  if (
    callerError ||
    !caller
  ) {
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
    data:
      callerProfile,
    error:
      callerProfileError,
  } =
    await adminClient
      .from(
        "staff_profiles",
      )
      .select(
        "role, active",
      )
      .eq(
        "user_id",
        caller.id,
      )
      .maybeSingle();


  if (
    callerProfileError ||
    !callerProfile?.active ||
    ![
      "master",
      "admin",
    ].includes(
      callerProfile.role,
    )
  ) {
    return json(
      {
        ok: false,
        message:
          "No autorizado.",
      },
      403,
    );
  }


  let body: {
    userId?: string;
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


  const targetUserId =
    String(
      body.userId ?? "",
    ).trim();


  if (
    !validUuid(
      targetUserId,
    )
  ) {
    return json(
      {
        ok: false,
        message:
          "Usuario invalido.",
      },
      400,
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
        "user_id, full_name, identification_number, email, role, active",
      )
      .eq(
        "user_id",
        targetUserId,
      )
      .maybeSingle();


  if (
    profileError ||
    !profile
  ) {
    return json(
      {
        ok: false,
        message:
          "Usuario no encontrado.",
      },
      404,
    );
  }


  if (
    profile.role ===
    "master"
  ) {
    return json(
      {
        ok: false,
        message:
          "No se puede resetear el Master desde esta pantalla.",
      },
      403,
    );
  }


  if (
    !profile.active
  ) {
    return json(
      {
        ok: false,
        message:
          "El usuario esta inactivo. Activalo antes de resetear la contrasena.",
      },
      400,
    );
  }


  const realEmail =
    String(
      profile.email ?? "",
    )
      .trim()
      .toLowerCase();


  if (
    !realEmail
  ) {
    return json(
      {
        ok: false,
        message:
          "El usuario no tiene correo. Editalo y agrega un correo antes de resetear la contrasena.",
      },
      400,
    );
  }


  /*
   * Comprobamos Gmail ANTES de cambiar
   * la contraseña del usuario.
   */
  const transporter =
    nodemailer.createTransport({
      host:
        "smtp.gmail.com",

      port:
        465,

      secure:
        true,

      auth: {
        user:
          gmailUser,

        pass:
          gmailPassword,
      },

      connectionTimeout:
        15000,

      greetingTimeout:
        15000,

      socketTimeout:
        20000,
    });


  try {
    await transporter.verify();
  }
  catch (verifyError) {

    console.error(
      "Gmail verification error:",
      verifyError,
    );

    return json(
      {
        ok: false,
        message:
          "No se pudo conectar con el servicio de correo. La contrasena NO fue modificada.",
      },
      502,
    );
  }


  const temporaryPassword =
    generateTemporaryPassword();


  /*
   * Cambiar contraseña en Auth.
   */
  const {
    error:
      passwordError,
  } =
    await adminClient
      .auth
      .admin
      .updateUserById(
        targetUserId,
        {
          password:
            temporaryPassword,
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
          "No fue posible resetear la contrasena.",
      },
      500,
    );
  }


  /*
   * Activar nuevamente el cambio obligatorio.
   */
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
          true,

        password_changed_at:
          null,

        temporary_password_sent_at:
          null,
      })
      .eq(
        "user_id",
        targetUserId,
      );


  if (profileUpdateError) {

    console.error(
      profileUpdateError,
    );

    return json(
      {
        ok: false,
        message:
          "La contrasena fue reseteada, pero no fue posible activar el cambio obligatorio.",
      },
      500,
    );
  }


  const safeName =
    escapeHtml(
      profile.full_name ??
      "Usuario",
    );

  const safeIdentification =
    escapeHtml(
      profile.identification_number ??
      "",
    );

  const safePassword =
    escapeHtml(
      temporaryPassword,
    );


  const textBody =
    [
      `Hola ${profile.full_name ?? "usuario"},`,
      "",
      "Un administrador ha reseteado tu contrasena de acceso al sistema del Laboratorio Clinico Dr. Milton Chasi.",
      "",
      `Usuario: ${profile.identification_number}`,
      `Nueva contrasena temporal: ${temporaryPassword}`,
      "",
      "La contrasena anterior ya no debe utilizarse.",
      "",
      "Al ingresar deberas crear una nueva contrasena antes de continuar.",
      "",
      "Por seguridad, no compartas estas credenciales.",
      "",
      "Laboratorio Clinico Dr. Milton Chasi",
    ].join(
      "\n",
    );


  const htmlBody =
    `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#f4f8fc;font-family:Arial,sans-serif;color:#24415f;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dce7f1;border-radius:14px;padding:28px;">

    <h2 style="margin:0 0 20px;color:#0a4b9f;">
      Laboratorio Cl&iacute;nico Dr. Milton Chasi
    </h2>

    <p>
      Hola <strong>${safeName}</strong>,
    </p>

    <p>
      Un administrador ha reseteado tu contrase&ntilde;a de acceso.
    </p>

    <div style="margin:22px 0;padding:18px;background:#f4f8fc;border-radius:10px;">

      <p style="margin:0 0 10px;">
        <strong>Usuario:</strong>
        ${safeIdentification}
      </p>

      <p style="margin:0;">
        <strong>Nueva contrase&ntilde;a temporal:</strong>
        <span style="font-family:monospace;font-size:16px;">
          ${safePassword}
        </span>
      </p>

    </div>

    <p>
      Al ingresar deber&aacute;s crear una nueva contrase&ntilde;a antes de continuar.
    </p>

    <p>
      La contrase&ntilde;a anterior ya no debe utilizarse.
    </p>

    <p style="margin-top:28px;">
      Laboratorio Cl&iacute;nico Dr. Milton Chasi
    </p>

  </div>
</body>
</html>`;


  try {

    await transporter.sendMail({
      from:
        `"Laboratorio Clinico Dr. Milton Chasi" <${gmailUser}>`,

      to:
        realEmail,

      subject:
        "Nueva contrasena temporal - Laboratorio Dr. Milton Chasi",

      text:
        textBody,

      html:
        htmlBody,
    });

  }
  catch (emailError) {

    console.error(
      "Reset password email error:",
      emailError,
    );

    return json(
      {
        ok: false,
        passwordChanged:
          true,

        message:
          "La contrasena fue reseteada, pero el correo no pudo enviarse. Vuelve a usar Resetear contrasena para generar y enviar una nueva.",
      },
      502,
    );
  }


  const sentAt =
    new Date().toISOString();


  await adminClient
    .from(
      "staff_profiles",
    )
    .update({
      temporary_password_sent_at:
        sentAt,
    })
    .eq(
      "user_id",
      targetUserId,
    );


  const {
    error:
      auditError,
  } =
    await adminClient
      .rpc(
        "write_service_audit_log",
        {
          p_actor_user_id:
            caller.id,

          p_action:
            "password_reset",

          p_entity_type:
            "staff_profiles",

          p_entity_id:
            targetUserId,

          p_description:
            "Reseteo la contrasena de: " +
            (
              profile.full_name ??
              targetUserId
            ),

          p_changed_fields: [
            "password",
            "must_change_password",
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

    emailSent:
      true,

    message:
      "Nueva contrasena temporal enviada correctamente.",
  });

});