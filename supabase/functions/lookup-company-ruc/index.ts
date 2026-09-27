import {
  createClient,
} from "npm:@supabase/supabase-js@2";

const SRI_BASE =
  "https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest";

const allowedRoles =
  new Set([
    "admin",
    "secretary",
    "laboratorist",
  ]);

function corsHeaders(
  origin: string | null,
) {
  return {
    "Access-Control-Allow-Origin":
      origin || "*",

    "Access-Control-Allow-Headers":
      [
        "authorization",
        "x-client-info",
        "apikey",
        "content-type",
      ].join(", "),

    "Access-Control-Allow-Methods":
      "POST, OPTIONS",

    "Vary":
      "Origin",
  };
}

function json(
  body: unknown,
  status = 200,
  origin: string | null = null,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders(origin),

        "Content-Type":
          "application/json; charset=utf-8",

        "Cache-Control":
          "no-store",
      },
    },
  );
}

function clean(
  value: unknown,
) {
  const result =
    String(
      value ?? "",
    )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  return result ||
    "";
}

async function fetchSriJson(
  url: string,
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      15000,
    );

  try {

    const response =
      await fetch(
        url,
        {
          method:
            "GET",

          headers: {
            "Accept":
              "application/json",

            "User-Agent":
              "Mozilla/5.0",
          },

          redirect:
            "follow",

          signal:
            controller.signal,
        },
      );

    const text =
      await response.text();

    if (
      !response.ok
    ) {
      throw new Error(
        `SRI_HTTP_${response.status}`,
      );
    }

    try {

      return JSON.parse(
        text,
      );

    }
    catch {

      console.error(
        "SRI non JSON response",
        {
          status:
            response.status,

          contentType:
            response.headers.get(
              "content-type",
            ),

          length:
            text.length,
        },
      );

      throw new Error(
        "SRI_INVALID_JSON",
      );
    }

  }
  finally {

    clearTimeout(
      timeout,
    );

  }
}

function firstObject(
  value: unknown,
) {
  if (
    Array.isArray(value)
  ) {
    return (
      value.find(
        (item) =>
          item &&
          typeof item ===
            "object",
      ) ??
      null
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return value;
  }

  return null;
}

function pick(
  source: Record<string, unknown>,
  keys: string[],
) {
  for (
    const key of keys
  ) {
    const value =
      source?.[key];

    if (
      value !== undefined &&
      value !== null &&
      clean(value)
    ) {
      return clean(
        value,
      );
    }
  }

  return "";
}

Deno.serve(
  async (req) => {

    const origin =
      req.headers.get(
        "origin",
      );

    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders(
              origin,
            ),
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
        origin,
      );
    }

    try {

      // ======================================================
      // AUTH
      // ======================================================

      const authHeader =
        req.headers.get(
          "authorization",
        );

      if (
        !authHeader ||
        !authHeader
          .toLowerCase()
          .startsWith(
            "bearer ",
          )
      ) {
        return json(
          {
            ok: false,
            message:
              "Sesion requerida.",
          },
          401,
          origin,
        );
      }

      const jwt =
        authHeader
          .slice(7)
          .trim();

      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL",
        );

      const serviceRoleKey =
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY",
        );

      if (
        !supabaseUrl ||
        !serviceRoleKey
      ) {
        throw new Error(
          "Supabase configuration missing.",
        );
      }

      const admin =
        createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              persistSession:
                false,

              autoRefreshToken:
                false,
            },
          },
        );

      const {
        data: authData,
        error: authError,
      } =
        await admin.auth.getUser(
          jwt,
        );

      if (
        authError ||
        !authData.user
      ) {
        return json(
          {
            ok: false,
            message:
              "Sesion no valida.",
          },
          401,
          origin,
        );
      }

      const {
        data: profile,
        error: profileError,
      } =
        await admin
          .from(
            "staff_profiles",
          )
          .select(
            "role, active",
          )
          .eq(
            "user_id",
            authData.user.id,
          )
          .maybeSingle();

      if (
        profileError ||
        !profile ||
        !profile.active ||
        !allowedRoles.has(
          profile.role,
        )
      ) {
        return json(
          {
            ok: false,
            message:
              "No autorizado.",
          },
          403,
          origin,
        );
      }

      // ======================================================
      // RUC
      // ======================================================

      const body =
        await req.json()
          .catch(
            () => ({}),
          );

      const ruc =
        String(
          body.ruc ?? "",
        )
          .replace(
            /\D/g,
            "",
          );

      if (
        !/^\d{13}$/.test(
          ruc,
        )
      ) {
        return json(
          {
            ok: false,

            code:
              "invalid_ruc",

            message:
              "El RUC debe contener 13 digitos.",
          },
          400,
          origin,
        );
      }

      // ======================================================
      // DATOS DEL CONTRIBUYENTE
      // Consulta DIRECTA al SRI
      // ======================================================

      const contributorUrl =
        new URL(
          `${SRI_BASE}/ConsolidadoContribuyente/obtenerPorNumerosRuc`,
        );

      contributorUrl.searchParams.set(
        "ruc",
        ruc,
      );

      let contributorResponse;

      try {

        contributorResponse =
          await fetchSriJson(
            contributorUrl.toString(),
          );

      }
      catch (error) {

        console.error(
          "SRI contributor request:",
          error,
        );

        return json(
          {
            ok: false,

            code:
              "sri_unavailable",

            message:
              "No fue posible consultar los datos del SRI en este momento.",
          },
          502,
          origin,
        );
      }

      const contributor =
        firstObject(
          contributorResponse,
        ) as
          | Record<string, unknown>
          | null;

      if (
        !contributor
      ) {
        return json(
          {
            ok: false,

            code:
              "not_found",

            message:
              "El SRI no devolvio informacion para ese RUC.",
          },
          404,
          origin,
        );
      }

      const returnedRuc =
        pick(
          contributor,
          [
            "numeroRuc",
            "ruc",
          ],
        );

      const legalName =
        pick(
          contributor,
          [
            "razonSocial",
            "nombreRazonSocial",
          ],
        );

      if (
        returnedRuc &&
        returnedRuc !== ruc
      ) {
        return json(
          {
            ok: false,

            code:
              "ruc_mismatch",

            message:
              "La respuesta del SRI no corresponde al RUC consultado.",
          },
          502,
          origin,
        );
      }

      if (
        !legalName
      ) {
        console.error(
          "Unexpected SRI contributor format",
          {
            keys:
              Object.keys(
                contributor,
              ),
          },
        );

        return json(
          {
            ok: false,

            code:
              "sri_format_changed",

            message:
              "El SRI respondio, pero el formato de los datos cambio.",
          },
          502,
          origin,
        );
      }

      // ======================================================
      // FECHAS
      // ======================================================

      const datesRaw =
        contributor[
          "informacionFechasContribuyente"
        ];

      const dates =
        (
          datesRaw &&
          typeof datesRaw ===
            "object"
        )
          ? datesRaw as
              Record<string, unknown>
          : {};

      // ======================================================
      // ESTABLECIMIENTOS / DIRECCION
      // Segunda consulta directa al SRI
      // ======================================================

      let establishments:
        Record<string, unknown>[] =
          [];

      try {

        const establishmentUrl =
          new URL(
            `${SRI_BASE}/Establecimiento/consultarPorNumeroRuc`,
          );

        establishmentUrl.searchParams.set(
          "numeroRuc",
          ruc,
        );

        const establishmentResponse =
          await fetchSriJson(
            establishmentUrl.toString(),
          );

        if (
          Array.isArray(
            establishmentResponse,
          )
        ) {
          establishments =
            establishmentResponse.filter(
              (item) =>
                item &&
                typeof item ===
                  "object",
            ) as
              Record<string, unknown>[];
        }

      }
      catch (error) {

        /*
         * La empresa sigue siendo valida aunque falle
         * la consulta secundaria de establecimientos.
         */
        console.error(
          "SRI establishments request:",
          error,
        );

      }

      const matrix =
        establishments.find(
          (item) =>
            clean(
              item.matriz,
            )
              .toUpperCase() ===
              "SI" ||
            clean(
              item.tipoEstablecimiento,
            )
              .toUpperCase() ===
              "MAT",
        ) ??
        establishments[0] ??
        null;

      const tradeName =
        pick(
          contributor,
          [
            "nombreComercial",
            "nombreFantasiaComercial",
          ],
        ) ||
        (
          matrix
            ? pick(
                matrix,
                [
                  "nombreFantasiaComercial",
                  "nombreComercial",
                ],
              )
            : ""
        );

      const sriStatus =
        pick(
          contributor,
          [
            "estadoContribuyenteRuc",
            "estadoContribuyente",
            "estadoPersonaNatural",
            "estadoSociedad",
          ],
        );

      const taxpayerType =
        pick(
          contributor,
          [
            "tipoContribuyente",
            "personaSociedad",
            "subtipoContribuyente",
          ],
        );

      const accountingRequired =
        pick(
          contributor,
          [
            "obligadoLlevarContabilidad",
            "obligadoContabilidad",
            "obligado",
          ],
        );

      const principalActivity =
        pick(
          contributor,
          [
            "actividadEconomicaPrincipal",
            "actividadContribuyente",
          ],
        );

      const category =
        pick(
          contributor,
          [
            "categoria",
            "regimen",
            "regimenRimpe",
          ],
        );

      /*
       * Datos de contacto.
       *
       * Primero intentamos obtenerlos del registro principal
       * del contribuyente. Si no vienen alli, usamos como
       * respaldo el establecimiento matriz.
       */

      const address =
        pick(
          contributor,
          [
            "direccionMatriz",
            "direccionCompleta",
            "direccion",
          ],
        ) ||
        (
          matrix
            ? pick(
                matrix,
                [
                  "direccionCompleta",
                  "direccionMatriz",
                  "direccion",
                ],
              )
            : ""
        );

      const email =
        pick(
          contributor,
          [
            "correo",
            "correoElectronico",
            "email",
            "mail",
          ],
        ) ||
        (
          matrix
            ? pick(
                matrix,
                [
                  "correo",
                  "correoElectronico",
                  "email",
                ],
              )
            : ""
        );

      const phone =
        pick(
          contributor,
          [
            "telefono1",
            "telefono",
            "telefonoPrincipal",
            "celular",
          ],
        ) ||
        (
          matrix
            ? pick(
                matrix,
                [
                  "telefono1",
                  "telefono",
                  "telefonoPrincipal",
                  "celular",
                ],
              )
            : ""
        );

      const company = {

        ruc,

        legalName,

        tradeName,

        sriStatus,

        taxpayerType,

        accountingRequired,

        principalActivity,

        category,

        address,

        email,

        phone,

        province:
          matrix
            ? pick(
                matrix,
                [
                  "nombreProvincia",
                  "descripcionProvincia",
                ],
              )
            : "",

        canton:
          matrix
            ? pick(
                matrix,
                [
                  "nombreCanton",
                  "descripcionCanton",
                ],
              )
            : "",

        parish:
          matrix
            ? pick(
                matrix,
                [
                  "nombreParroquia",
                  "descripcionParroquia",
                ],
              )
            : "",

        activityStartDate:
          pick(
            dates,
            [
              "fechaInicioActividades",
            ],
          ) ||
          pick(
            contributor,
            [
              "fechaInicioActividades",
            ],
          ),

        activityEndDate:
          pick(
            dates,
            [
              "fechaCeseActividades",
              "fechaSuspensionDefinitiva",
            ],
          ),

        activityRestartDate:
          pick(
            dates,
            [
              "fechaReinicioActividades",
            ],
          ),

        lastSriUpdate:
          pick(
            dates,
            [
              "fechaActualizacion",
            ],
          ) ||
          pick(
            contributor,
            [
              "fechaActualizacion",
            ],
          ),

        source:
          "Servicio de Rentas Internas - Ecuador",

        consultedAt:
          new Date()
            .toISOString(),
      };

      console.log(
        "SRI lookup OK",
        {
          ruc,
          legalName:
            Boolean(
              company.legalName,
            ),

          establishments:
            establishments.length,
        },
      );

      return json(
        {
          ok: true,
          company,
        },
        200,
        origin,
      );

    }
    catch (error) {

      console.error(
        "lookup-company-ruc:",
        error,
      );

      const timeout =
        error instanceof Error &&
        (
          error.name ===
            "AbortError" ||
          error.name ===
            "TimeoutError"
        );

      return json(
        {
          ok: false,

          code:
            timeout
              ? "sri_timeout"
              : "internal_error",

          message:
            timeout
              ? "El SRI demoro demasiado en responder."
              : "No fue posible consultar el SRI.",
        },
        timeout
          ? 504
          : 500,
        origin,
      );
    }
  },
);