import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const allowedRoles = new Set([
  "admin",
  "secretary",
  "laboratorist",
]);

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
        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function errorText(error: unknown) {
  const text =
    error instanceof Error
      ? error.message
      : String(error ?? "Unknown error");

  return text.slice(0, 1000);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders,
      },
    );
  }

  if (req.method !== "POST") {
    return json(
      {
        ok: false,
        code: "method_not_allowed",
      },
      405,
    );
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL") ?? "";

  const serviceRoleKey =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    ) ?? "";

  const gmailUser =
    (
      Deno.env.get("GMAIL_USER") ??
      ""
    )
      .trim()
      .toLowerCase();

  const gmailPassword =
    (
      Deno.env.get(
        "GMAIL_APP_PASSWORD",
      ) ??
      ""
    ).replace(/\s+/g, "");

  const patientPortalUrl =
    (
      Deno.env.get(
        "PATIENT_PORTAL_URL",
      ) ??
      ""
    ).trim();

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    console.error(
      "Missing Supabase environment.",
    );

    return json(
      {
        ok: false,
        code: "service_error",
      },
      500,
    );
  }

  const authorization =
    req.headers.get(
      "Authorization",
    ) ?? "";

  const jwt =
    authorization.replace(
      /^Bearer\s+/i,
      "",
    );

  if (!jwt) {
    return json(
      {
        ok: false,
        code: "unauthorized",
      },
      401,
    );
  }

  const admin =
    createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

  const {
    data: userData,
    error: userError,
  } =
    await admin.auth.getUser(jwt);

  const user =
    userData?.user;

  if (
    userError ||
    !user
  ) {
    return json(
      {
        ok: false,
        code: "unauthorized",
      },
      401,
    );
  }

  const {
    data: staff,
    error: staffError,
  } =
    await admin
      .from("staff_profiles")
      .select(
        "user_id, role, active",
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();

  if (
    staffError ||
    !staff ||
    staff.active !== true ||
    !allowedRoles.has(
      String(staff.role),
    )
  ) {
    if (staffError) {
      console.error(
        staffError,
      );
    }

    return json(
      {
        ok: false,
        code: "forbidden",
      },
      403,
    );
  }

  let body:
    Record<string, unknown>;

  try {
    body =
      await req.json();
  }
  catch {
    return json(
      {
        ok: false,
        code: "invalid_request",
      },
      400,
    );
  }

  const resultId =
    String(
      body.resultId ?? "",
    );

  if (!validUuid(resultId)) {
    return json(
      {
        ok: false,
        code: "invalid_result_id",
      },
      400,
    );
  }

  const {
    data: result,
    error: resultError,
  } =
    await admin
      .from("patient_results")
      .select(
        "id, order_id, status",
      )
      .eq(
        "id",
        resultId,
      )
      .maybeSingle();

  if (
    resultError ||
    !result
  ) {
    if (resultError) {
      console.error(
        resultError,
      );
    }

    return json(
      {
        ok: false,
        code: "result_not_found",
      },
      404,
    );
  }

  if (
    result.status !== "released"
  ) {
    return json(
      {
        ok: false,
        code: "result_not_released",
      },
      409,
    );
  }

  const {
    error: ensureError,
  } =
    await admin
      .from(
        "result_release_notifications",
      )
      .upsert(
        {
          result_id: resultId,
          status: "pending",
        },
        {
          onConflict: "result_id",
          ignoreDuplicates: true,
        },
      );

  if (ensureError) {
    console.error(
      ensureError,
    );

    return json(
      {
        ok: false,
        code: "notification_job_error",
      },
      500,
    );
  }

  const {
    data: claimData,
    error: claimError,
  } =
    await admin.rpc(
      "claim_result_release_notification",
      {
        p_result_id:
          resultId,
      },
    );

  if (claimError) {
    console.error(
      claimError,
    );

    return json(
      {
        ok: false,
        code: "notification_claim_error",
      },
      500,
    );
  }

  const claim =
    Array.isArray(claimData)
      ? claimData[0]
      : claimData;

  if (
    claim?.claimed !== true
  ) {
    const state =
      String(
        claim
          ?.notification_status ??
        "unknown",
      );

    return json({
      ok: true,
      notificationStatus:
        state === "sent"
          ? "already_sent"
          : state,
    });
  }

  const notificationId =
    String(
      claim.notification_id,
    );

  async function markFailed(
    message: string,
  ) {
    await admin
      .from(
        "result_release_notifications",
      )
      .update({
        status: "failed",
        last_error:
          message.slice(
            0,
            1000,
          ),
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        notificationId,
      );
  }

  try {
    const {
      data: order,
      error: orderError,
    } =
      await admin
        .from("result_orders")
        .select(
          "id, patient_id",
        )
        .eq(
          "id",
          result.order_id,
        )
        .maybeSingle();

    if (
      orderError ||
      !order
    ) {
      throw (
        orderError ??
        new Error(
          "Result order not found.",
        )
      );
    }

    const {
      data: patient,
      error: patientError,
    } =
      await admin
        .from("patients")
        .select(
          "id, first_name, last_name, email",
        )
        .eq(
          "id",
          order.patient_id,
        )
        .maybeSingle();

    if (
      patientError ||
      !patient
    ) {
      throw (
        patientError ??
        new Error(
          "Patient not found.",
        )
      );
    }

    const patientEmail =
      String(
        patient.email ?? "",
      )
        .trim()
        .toLowerCase();

    if (
      !patientEmail ||
      !validEmail(
        patientEmail,
      )
    ) {
      await admin
        .from(
          "result_release_notifications",
        )
        .update({
          status:
            "no_email",
          recipient_email:
            patientEmail ||
            null,
          last_error:
            null,
          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          notificationId,
        );

      return json({
        ok: true,
        notificationStatus:
          "no_email",
      });
    }

    if (
      !gmailUser ||
      !gmailPassword
    ) {
      throw new Error(
        "Gmail secrets are not configured.",
      );
    }

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

    const patientName =
      `${patient.first_name ?? ""} ${patient.last_name ?? ""}`
        .trim();

    const greetingText =
      patientName
        ? `Estimado/a ${patientName}:`
        : "Estimado/a paciente:";

    const portalText =
      patientPortalUrl
        ? `Portal de Pacientes: ${patientPortalUrl}`
        : "Ingrese al Portal de Pacientes desde el sitio web del laboratorio.";

    const textBody =
      [
        greetingText,
        "",
        "Le informamos que tiene un nuevo resultado de laboratorio disponible en la plataforma.",
        "",
        portalText,
        "",
        "Datos de acceso:",
        "Usuario: su numero de cedula",
        "Contrasena: su numero de cedula",
        "",
        "Por seguridad, el resultado no se adjunta a este correo.",
        "",
        "Este es un mensaje automatico. No es necesario responder.",
        "",
        "Laboratorio Clinico Dr. Milton Chasi",
      ].join("\n");

    const safeName =
      escapeHtml(
        patientName,
      );

    const safePortalUrl =
      escapeHtml(
        patientPortalUrl,
      );

    const greetingHtml =
      safeName
        ? `Estimado/a <strong>${safeName}</strong>:`
        : "Estimado/a paciente:";

    const portalHtml =
      patientPortalUrl
        ? `
<p style="margin:26px 0;text-align:center;">
  <a
    href="${safePortalUrl}"
    style="
      display:inline-block;
      background:#0a4b9f;
      color:#ffffff;
      text-decoration:none;
      font-weight:700;
      padding:14px 22px;
      border-radius:9px;
    "
  >
    INGRESAR AL PORTAL DE PACIENTES
  </a>
</p>
`
        : `
<p>
Ingrese al <strong>Portal de Pacientes</strong>
desde el sitio web del laboratorio.
</p>
`;

    const htmlBody =
      `<!doctype html>
<html>
<body style="
margin:0;
padding:24px;
background:#f4f8fc;
font-family:Arial,sans-serif;
color:#24415f;
">

<div style="
max-width:600px;
margin:0 auto;
background:#ffffff;
border:1px solid #dce7f1;
border-radius:14px;
padding:28px;
">

<h2 style="
margin:0 0 20px;
color:#0a4b9f;
">
Laboratorio Cl&iacute;nico Dr. Milton Chasi
</h2>

<p>
${greetingHtml}
</p>

<p>
Le informamos que tiene un nuevo resultado de laboratorio
disponible en la plataforma.
</p>

${portalHtml}

<div style="
background:#f6f9fc;
border:1px solid #dce7f1;
border-radius:10px;
padding:16px;
margin:20px 0;
">

<p style="
margin:0 0 10px;
font-weight:700;
">
Datos de acceso
</p>

<p style="margin:5px 0;">
<strong>Usuario:</strong>
su n&uacute;mero de c&eacute;dula
</p>

<p style="margin:5px 0;">
<strong>Contrase&ntilde;a:</strong>
su n&uacute;mero de c&eacute;dula
</p>

</div>

<p style="
font-size:14px;
color:#60788e;
">
Por seguridad, el resultado no se adjunta a este correo.
</p>

<hr style="
border:0;
border-top:1px solid #e2eaf2;
margin:24px 0;
">

<p style="
margin:0;
font-size:12px;
color:#7a8fa3;
">
Este es un mensaje autom&aacute;tico.
No es necesario responder este correo.
</p>

</div>

</body>
</html>`;

    const info =
      await transporter.sendMail({
        from:
          `"Laboratorio Clinico Dr. Milton Chasi" <${gmailUser}>`,

        to:
          patientEmail,

        subject:
          "Su resultado de laboratorio est\u00e1 disponible",

        text:
          textBody,

        html:
          htmlBody,

        headers: {
          "Auto-Submitted":
            "auto-generated",

          "X-Auto-Response-Suppress":
            "All",
        },
      });

    await admin
      .from(
        "result_release_notifications",
      )
      .update({
        status:
          "sent",

        recipient_email:
          patientEmail,

        sent_at:
          new Date()
            .toISOString(),

        smtp_message_id:
          String(
            info.messageId ?? "",
          ) || null,

        last_error:
          null,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        notificationId,
      );

    return json({
      ok: true,
      notificationStatus:
        "sent",
    });
  }
  catch (error) {
    const message =
      errorText(error);

    console.error(
      "Email notification failed:",
      message,
    );

    await markFailed(
      message,
    );

    return json(
      {
        ok: false,
        code: "email_failed",
        notificationStatus:
          "failed",
      },
      502,
    );
  }
});