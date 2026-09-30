import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const allowedRoles =
  new Set([
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
      },
    },
  );
}


function validEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(value);
}


function validUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}


Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers:
          corsHeaders,
      },
    );
  }


  if (req.method !== "POST") {
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
    fullName?: string;
    identificationNumber?: string;
    email?: string;
    role?: string;
    branchId?: string | null;
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

  const fullName =
    String(
      body.fullName ?? "",
    ).trim();

  const identificationNumber =
    String(
      body.identificationNumber ??
        "",
    ).replace(
      /\D/g,
      "",
    );

  const realEmail =
    String(
      body.email ?? "",
    )
      .trim()
      .toLowerCase();

  const role =
    String(
      body.role ?? "",
    ).trim();

  const requestedBranchId =
    String(
      body.branchId ?? "",
    ).trim();


  if (
    !validUuid(
      targetUserId,
    ) ||
    fullName.length < 2 ||
    !/^\d{8,15}$/.test(
      identificationNumber,
    ) ||
    !validEmail(
      realEmail,
    ) ||
    !allowedRoles.has(
      role,
    )
  ) {
    return json(
      {
        ok: false,
        message:
          "Los datos del usuario no son validos.",
      },
      400,
    );
  }


  const {
    data:
      currentProfile,
    error:
      currentProfileError,
  } =
    await adminClient
      .from(
        "staff_profiles",
      )
      .select(
        "user_id, full_name, identification_number, email, role, branch_id, active",
      )
      .eq(
        "user_id",
        targetUserId,
      )
      .maybeSingle();


  if (
    currentProfileError ||
    !currentProfile
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
    currentProfile.role ===
    "master"
  ) {
    return json(
      {
        ok: false,
        message:
          "El usuario Master no puede editarse desde esta pantalla.",
      },
      403,
    );
  }


  /*
   * Evitar que un administrador se quite
   * accidentalmente su propio rol.
   */
  if (
    caller.id ===
      targetUserId &&
    currentProfile.role ===
      "admin" &&
    role !==
      "admin"
  ) {
    return json(
      {
        ok: false,
        message:
          "No puedes cambiar tu propio rol de Administrador.",
      },
      400,
    );
  }


  let branchId:
    string | null =
      null;


  if (
    role !==
      "admin" &&
    requestedBranchId
  ) {

    if (
      !validUuid(
        requestedBranchId,
      )
    ) {
      return json(
        {
          ok: false,
          message:
            "Sucursal no valida.",
        },
        400,
      );
    }


    const {
      data:
        branch,
      error:
        branchError,
    } =
      await adminClient
        .from(
          "branches",
        )
        .select(
          "id",
        )
        .eq(
          "id",
          requestedBranchId,
        )
        .eq(
          "active",
          true,
        )
        .maybeSingle();


    if (
      branchError ||
      !branch
    ) {
      return json(
        {
          ok: false,
          message:
            "La sucursal seleccionada no existe o esta inactiva.",
        },
        400,
      );
    }


    branchId =
      branch.id;
  }


  const {
    data:
      duplicateIdentification,
  } =
    await adminClient
      .from(
        "staff_profiles",
      )
      .select(
        "user_id",
      )
      .eq(
        "identification_number",
        identificationNumber,
      )
      .neq(
        "user_id",
        targetUserId,
      )
      .maybeSingle();


  if (
    duplicateIdentification
  ) {
    return json(
      {
        ok: false,
        message:
          "Ya existe otro usuario con esa cedula.",
      },
      409,
    );
  }


  const {
    data:
      duplicateEmail,
  } =
    await adminClient
      .from(
        "staff_profiles",
      )
      .select(
        "user_id",
      )
      .eq(
        "email",
        realEmail,
      )
      .neq(
        "user_id",
        targetUserId,
      )
      .maybeSingle();


  if (
    duplicateEmail
  ) {
    return json(
      {
        ok: false,
        message:
          "Ya existe otro usuario con ese correo.",
      },
      409,
    );
  }


  const oldAuthEmail =
    `${currentProfile.identification_number}@admin.drchasi.local`;

  const newAuthEmail =
    `${identificationNumber}@admin.drchasi.local`;


  const {
    data:
      targetAuthResponse,
    error:
      targetAuthError,
  } =
    await adminClient
      .auth
      .admin
      .getUserById(
        targetUserId,
      );


  if (
    targetAuthError ||
    !targetAuthResponse?.user
  ) {
    return json(
      {
        ok: false,
        message:
          "No fue posible cargar la cuenta de acceso.",
      },
      500,
    );
  }


  const existingMetadata =
    targetAuthResponse
      .user
      .user_metadata ??
    {};


  const {
    error:
      authUpdateError,
  } =
    await adminClient
      .auth
      .admin
      .updateUserById(
        targetUserId,
        {
          email:
            newAuthEmail,

          email_confirm:
            true,

          user_metadata: {
            ...existingMetadata,

            identification_number:
              identificationNumber,

            role,

            branch_id:
              branchId,
          },
        },
      );


  if (authUpdateError) {

    console.error(
      authUpdateError,
    );

    return json(
      {
        ok: false,
        message:
          "No fue posible actualizar la cuenta de acceso.",
      },
      500,
    );
  }


  const {
    error:
      profileUpdateError,
  } =
    await adminClient
      .from(
        "staff_profiles",
      )
      .update({
        full_name:
          fullName,

        identification_number:
          identificationNumber,

        email:
          realEmail,

        role,

        branch_id:
          branchId,
      })
      .eq(
        "user_id",
        targetUserId,
      );


  if (profileUpdateError) {

    console.error(
      profileUpdateError,
    );


    /*
     * Intento de rollback de Auth.
     */
    await adminClient
      .auth
      .admin
      .updateUserById(
        targetUserId,
        {
          email:
            oldAuthEmail,

          email_confirm:
            true,

          user_metadata: {
            ...existingMetadata,

            identification_number:
              currentProfile
                .identification_number,

            role:
              currentProfile.role,

            branch_id:
              currentProfile
                .branch_id,
          },
        },
      );


    return json(
      {
        ok: false,
        message:
          "No fue posible guardar los cambios del usuario.",
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
            caller.id,

          p_action:
            "edit",

          p_entity_type:
            "staff_profiles",

          p_entity_id:
            targetUserId,

          p_description:
            "Edito usuario: " +
            fullName,

          p_changed_fields: [
            "full_name",
            "identification_number",
            "email",
            "role",
            "branch_id",
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

    user: {
      userId:
        targetUserId,

      fullName,

      identificationNumber,

      email:
        realEmail,

      role,

      branchId,
    },
  });

});