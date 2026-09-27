import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SESSION_MINUTES = 30;
const SIGNED_URL_SECONDS = 10 * 60;

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
        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}

function normalizeCedula(
  value: unknown,
) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

function getClientIp(
  req: Request,
) {
  const forwarded =
    req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

  return (
    req.headers.get(
      "cf-connecting-ip",
    ) ??
    req.headers.get(
      "x-real-ip",
    ) ??
    forwarded ??
    "unknown"
  );
}

async function sha256(
  value: string,
) {
  const bytes =
    new TextEncoder()
      .encode(value);

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      bytes,
    );

  return Array.from(
    new Uint8Array(digest),
  )
    .map((item) =>
      item
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

function randomToken() {
  const bytes =
    new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return btoa(
    String.fromCharCode(
      ...bytes,
    ),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeFileName(
  value: unknown,
) {
  const raw =
    String(
      value ??
      "resultado.pdf",
    );

  const cleaned =
    raw.replace(
      /[^A-Za-z0-9._-]/g,
      "_",
    );

  return cleaned
    .toLowerCase()
    .endsWith(".pdf")
    ? cleaned
    : `${cleaned}.pdf`;
}

Deno.serve(
  async (req: Request) => {
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
          code:
            "invalid_request",
        },
        405,
      );
    }

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
      console.error(
        "Missing Supabase environment.",
      );

      return json(
        {
          ok: false,
          code:
            "service_error",
        },
        500,
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

    let body:
      Record<string, unknown>;

    try {
      body =
        await req.json();
    } catch {
      return json({
        ok: false,
        code:
          "invalid_request",
      });
    }

    const action =
      String(
        body.action ?? "",
      );

    async function claimLimit(
      scope: string,
      rawKey: string,
      maxAttempts: number,
    ) {
      const hash =
        await sha256(
          `${scope}|${rawKey}|${serviceRoleKey}`,
        );

      const {
        data,
        error,
      } =
        await admin.rpc(
          "claim_patient_portal_limit",
          {
            p_scope: scope,
            p_key_hash: hash,
            p_max_attempts:
              maxAttempts,
            p_window_seconds:
              15 * 60,
            p_block_seconds:
              15 * 60,
          },
        );

      if (error) {
        throw error;
      }

      const row =
        Array.isArray(data)
          ? data[0]
          : data;

      return {
        allowed:
          row?.allowed !==
          false,
        retryAfter:
          Number(
            row
              ?.retry_after_seconds ??
            0,
          ),
      };
    }

    async function getSession(
      rawToken: string,
    ) {
      if (
        !rawToken ||
        rawToken.length < 30
      ) {
        return null;
      }

      const tokenHash =
        await sha256(
          rawToken,
        );

      const {
        data,
        error,
      } =
        await admin
          .from(
            "patient_portal_sessions",
          )
          .select(
            "id, patient_id, expires_at, revoked_at",
          )
          .eq(
            "token_hash",
            tokenHash,
          )
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (
        !data ||
        data.revoked_at ||
        new Date(
          data.expires_at,
        ).getTime() <=
          Date.now()
      ) {
        return null;
      }

      await admin
        .from(
          "patient_portal_sessions",
        )
        .update({
          last_seen_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          data.id,
        );

      return data;
    }

    async function loadPortalData(
      patientId: string,
    ) {
      const {
        data: patient,
        error: patientError,
      } =
        await admin
          .from("patients")
          .select(
            [
              "id",
              "identification_number",
              "first_name",
              "last_name",
              "active",
            ].join(","),
          )
          .eq(
            "id",
            patientId,
          )
          .eq(
            "active",
            true,
          )
          .maybeSingle();

      if (
        patientError ||
        !patient
      ) {
        if (patientError) {
          console.error(
            patientError,
          );
        }

        return null;
      }

      const {
        data: orders,
        error: ordersError,
      } =
        await admin
          .from(
            "result_orders",
          )
          .select(
            "id, order_number, order_date, status",
          )
          .eq(
            "patient_id",
            patientId,
          )
          .order(
            "order_date",
            {
              ascending: false,
            },
          );

      if (ordersError) {
        throw ordersError;
      }

      const orderMap =
        new Map(
          (orders ?? []).map(
            (order) => [
              order.id,
              order,
            ],
          ),
        );

      const orderIds =
        Array.from(
          orderMap.keys(),
        );

      let resultRows = [];

      if (
        orderIds.length > 0
      ) {
        const {
          data,
          error,
        } =
          await admin
            .from(
              "patient_results",
            )
            .select(
              [
                "id",
                "order_id",
                "study_name_snapshot",
                "result_date",
                "file_size_bytes",
                "released_at",
              ].join(","),
            )
            .in(
              "order_id",
              orderIds,
            )
            .eq(
              "status",
              "released",
            )
            .order(
              "released_at",
              {
                ascending: false,
              },
            );

        if (error) {
          throw error;
        }

        resultRows =
          data ?? [];
      }

      const resultIds =
        resultRows.map(
          (row) =>
            String(row.id),
        );

      let accessRows = [];

      if (
        resultIds.length > 0
      ) {
        const {
          data,
          error,
        } =
          await admin
            .from(
              "patient_result_access",
            )
            .select(
              [
                "result_id",
                "first_accessed_at",
                "first_viewed_at",
                "first_downloaded_at",
                "last_accessed_at",
                "view_count",
                "download_count",
              ].join(","),
            )
            .eq(
              "patient_id",
              patientId,
            )
            .in(
              "result_id",
              resultIds,
            );

        if (error) {
          throw error;
        }

        accessRows =
          data ?? [];
      }

      const accessMap =
        new Map(
          accessRows.map(
            (row) => [
              String(row.result_id),
              row,
            ],
          ),
        );

      const results =
        resultRows.map(
          (row) => {
            const order =
              orderMap.get(
                String(
                  row.order_id,
                ),
              );

            const access =
              accessMap.get(
                String(row.id),
              );

            return {
              id:
                row.id,

              orderNumber:
                order?.order_number ??
                "-",

              orderDate:
                order?.order_date ??
                null,

              studyName:
                row.study_name_snapshot,

              resultDate:
                row.result_date,

              releasedAt:
                row.released_at,

              fileSizeBytes:
                row.file_size_bytes,

              accessed:
                Boolean(access),

              firstAccessedAt:
                access?.first_accessed_at ??
                null,

              firstViewedAt:
                access?.first_viewed_at ??
                null,

              firstDownloadedAt:
                access?.first_downloaded_at ??
                null,

              lastAccessedAt:
                access?.last_accessed_at ??
                null,

              viewCount:
                Number(
                  access?.view_count ??
                  0,
                ),

              downloadCount:
                Number(
                  access?.download_count ??
                  0,
                ),
            };
          },
        );

      const recentResults =
        results.filter(
          (result) =>
            !result.accessed,
        );

      const historyResults =
        results.filter(
          (result) =>
            result.accessed,
        );

      const currentResult =
        recentResults[0] ??
        null;

      return {
        patient: {
          displayName:
            `${patient.first_name} ${patient.last_name}`
              .trim(),

          identification:
            patient.identification_number,
        },

        summary: {
          recentResults:
            recentResults.length,

          historyResults:
            historyResults.length,
        },

        currentResult,
        recentResults,
        historyResults,
        results,

        signedUrlExpiresIn:
          SIGNED_URL_SECONDS,
      };
    }

    try {
      if (
        action === "login"
      ) {
        const identification =
          normalizeCedula(
            body.identification,
          );

        const password =
          normalizeCedula(
            body.password,
          );

        const ip =
          getClientIp(req);

        const ipLimit =
          await claimLimit(
            "ip",
            ip,
            30,
          );

        if (
          !ipLimit.allowed
        ) {
          return json({
            ok: false,
            code:
              "rate_limited",
            retryAfter:
              ipLimit.retryAfter,
          });
        }

        const credentialLimit =
          await claimLimit(
            "credential",
            `${ip}|${identification}`,
            8,
          );

        if (
          !credentialLimit.allowed
        ) {
          return json({
            ok: false,
            code:
              "rate_limited",
            retryAfter:
              credentialLimit.retryAfter,
          });
        }

        if (
          identification.length !==
            10 ||
          password.length !== 10 ||
          identification !==
            password
        ) {
          return json({
            ok: false,
            code:
              "invalid_credentials",
          });
        }

        const {
          data: patient,
          error:
            patientError,
        } =
          await admin
            .from("patients")
            .select("id")
            .eq(
              "identification_type",
              "cedula",
            )
            .eq(
              "identification_normalized",
              identification,
            )
            .eq(
              "active",
              true,
            )
            .maybeSingle();

        if (
          patientError
        ) {
          throw patientError;
        }

        if (!patient) {
          return json({
            ok: false,
            code:
              "invalid_credentials",
          });
        }

        const rawToken =
          randomToken();

        const tokenHash =
          await sha256(
            rawToken,
          );

        const expiresAt =
          new Date(
            Date.now() +
              SESSION_MINUTES *
                60 *
                1000,
          ).toISOString();

        const {
          error:
            sessionError,
        } =
          await admin
            .from(
              "patient_portal_sessions",
            )
            .insert({
              patient_id:
                patient.id,
              token_hash:
                tokenHash,
              expires_at:
                expiresAt,
            });

        if (
          sessionError
        ) {
          throw sessionError;
        }

        const portalData =
          await loadPortalData(
            patient.id,
          );

        if (
          !portalData
        ) {
          return json({
            ok: false,
            code:
              "invalid_credentials",
          });
        }

        return json({
          ok: true,
          sessionToken:
            rawToken,
          sessionExpiresAt:
            expiresAt,
          ...portalData,
        });
      }

      if (
        action === "open_result"
      ) {
        const rawToken =
          String(
            body.sessionToken ??
              "",
          );

        const session =
          await getSession(
            rawToken,
          );

        if (!session) {
          return json({
            ok: false,
            code:
              "session_expired",
          });
        }

        const resultId =
          String(
            body.resultId ??
              "",
          );

        const accessType =
          String(
            body.accessType ??
              "",
          );

        if (
          ![
            "view",
            "download",
          ].includes(
            accessType,
          )
        ) {
          return json({
            ok: false,
            code:
              "invalid_request",
          });
        }

        const {
          data: result,
          error: resultError,
        } =
          await admin
            .from(
              "patient_results",
            )
            .select(
              [
                "id",
                "order_id",
                "file_path",
                "original_file_name",
                "status",
              ].join(","),
            )
            .eq(
              "id",
              resultId,
            )
            .eq(
              "status",
              "released",
            )
            .maybeSingle();

        if (
          resultError ||
          !result
        ) {
          return json({
            ok: false,
            code:
              "result_not_found",
          });
        }

        const {
          data: order,
          error: orderError,
        } =
          await admin
            .from(
              "result_orders",
            )
            .select(
              "patient_id",
            )
            .eq(
              "id",
              result.order_id,
            )
            .maybeSingle();

        if (
          orderError ||
          !order ||
          String(
            order.patient_id,
          ) !==
            String(
              session.patient_id,
            )
        ) {
          return json({
            ok: false,
            code:
              "result_not_found",
          });
        }

        const storage =
          admin.storage.from(
            "patient-results",
          );

        let signedData;
        let signedError;

        if (
          accessType ===
          "download"
        ) {
          const response =
            await storage
              .createSignedUrl(
                String(
                  result.file_path,
                ),
                SIGNED_URL_SECONDS,
                {
                  download:
                    safeFileName(
                      result.original_file_name,
                    ),
                },
              );

          signedData =
            response.data;

          signedError =
            response.error;
        }
        else {
          const response =
            await storage
              .createSignedUrl(
                String(
                  result.file_path,
                ),
                SIGNED_URL_SECONDS,
              );

          signedData =
            response.data;

          signedError =
            response.error;
        }

        if (
          signedError ||
          !signedData?.signedUrl
        ) {
          throw (
            signedError ??
            new Error(
              "Signed URL failed.",
            )
          );
        }

        const {
          error: accessError,
        } =
          await admin.rpc(
            "record_patient_result_access",
            {
              p_patient_id:
                session.patient_id,

              p_result_id:
                resultId,

              p_action:
                accessType,
            },
          );

        if (accessError) {
          throw accessError;
        }

        const portalData =
          await loadPortalData(
            session.patient_id,
          );

        return json({
          ok: true,

          url:
            signedData.signedUrl,

          accessType,

          ...portalData,
        });
      }

      if (
        action === "refresh"
      ) {
        const rawToken =
          String(
            body.sessionToken ??
              "",
          );

        const session =
          await getSession(
            rawToken,
          );

        if (!session) {
          return json({
            ok: false,
            code:
              "session_expired",
          });
        }

        const portalData =
          await loadPortalData(
            session.patient_id,
          );

        if (
          !portalData
        ) {
          return json({
            ok: false,
            code:
              "session_expired",
          });
        }

        return json({
          ok: true,
          ...portalData,
        });
      }

      if (
        action === "logout"
      ) {
        const rawToken =
          String(
            body.sessionToken ??
              "",
          );

        if (rawToken) {
          const tokenHash =
            await sha256(
              rawToken,
            );

          await admin
            .from(
              "patient_portal_sessions",
            )
            .update({
              revoked_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "token_hash",
              tokenHash,
            );
        }

        return json({
          ok: true,
        });
      }

      return json({
        ok: false,
        code:
          "invalid_request",
      });
    } catch (error) {
      console.error(
        "patient-portal-access failed:",
        error,
      );

      return json(
        {
          ok: false,
          code:
            "service_error",
        },
        500,
      );
    }
  },
);