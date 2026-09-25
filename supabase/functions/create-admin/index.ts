import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json(
      {
        ok: false,
        message: "Metodo no permitido.",
      },
      405,
    );
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");

  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY");

  const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (
    !supabaseUrl ||
    !anonKey ||
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
    req.headers.get("Authorization");

  if (!authorization) {
    return json(
      {
        ok: false,
        message: "No autorizado.",
      },
      401,
    );
  }

  const callerClient = createClient(
    supabaseUrl,
    anonKey,
    {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    },
  );

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();

  if (callerError || !caller) {
    return json(
      {
        ok: false,
        message: "No autorizado.",
      },
      401,
    );
  }

  const adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const {
    data: callerProfile,
    error: profileError,
  } = await adminClient
    .from("staff_profiles")
    .select("role, active")
    .eq("user_id", caller.id)
    .maybeSingle();

  if (
    profileError ||
    callerProfile?.role !== "master" ||
    callerProfile?.active !== true
  ) {
    return json(
      {
        ok: false,
        message: "No autorizado.",
      },
      403,
    );
  }

  let body: {
    fullName?: string;
    identificationNumber?: string;
    password?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json(
      {
        ok: false,
        message: "Solicitud invalida.",
      },
      400,
    );
  }

  const fullName =
    String(body.fullName ?? "").trim();

  const identificationNumber =
    String(
      body.identificationNumber ?? "",
    ).replace(/\D/g, "");

  const password =
    String(body.password ?? "");

  if (
    fullName.length < 2 ||
    !/^\d{8,15}$/.test(
      identificationNumber,
    ) ||
    password.length < 8
  ) {
    return json(
      {
        ok: false,
        message:
          "Datos del administrador incompletos o invalidos.",
      },
      400,
    );
  }

  const email =
    `${identificationNumber}@admin.drchasi.local`;

  const {
    data: existingProfile,
  } = await adminClient
    .from("staff_profiles")
    .select("user_id")
    .eq(
      "identification_number",
      identificationNumber,
    )
    .maybeSingle();

  if (existingProfile) {
    return json(
      {
        ok: false,
        message:
          "Ya existe un usuario con esa cedula.",
      },
      409,
    );
  }

  const {
    data: created,
    error: createError,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      identification_number:
        identificationNumber,
      role: "admin",
    },
  });

  if (createError || !created.user) {
    return json(
      {
        ok: false,
        message:
          "No fue posible crear la cuenta de acceso.",
      },
      400,
    );
  }

  const {
    error: insertError,
  } = await adminClient
    .from("staff_profiles")
    .insert({
      user_id: created.user.id,
      full_name: fullName,
      role: "admin",
      active: true,
      identification_number:
        identificationNumber,
    });

  if (insertError) {
    await adminClient.auth.admin.deleteUser(
      created.user.id,
    );

    return json(
      {
        ok: false,
        message:
          "No fue posible crear el perfil administrativo.",
      },
      500,
    );
  }

  return json({
    ok: true,
    admin: {
      userId: created.user.id,
      fullName,
      identificationNumber,
      role: "admin",
      active: true,
    },
  });
});