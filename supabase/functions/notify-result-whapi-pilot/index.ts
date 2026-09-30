import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function equalSecrets(received, expected) {
  if (!received || !expected) return false;
  const hash = async (value) => new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value)),
  );
  const left = await hash(received);
  const right = await hash(expected);
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left[i] ^ right[i];
  return difference === 0;
}

function resultIdFromEvent(payload) {
  if (!payload || payload.schema !== "public" ||
      payload.table !== "patient_results") return null;
  if (payload.type !== "INSERT" && payload.type !== "UPDATE") return null;
  if (payload.record?.status !== "released") return null;
  if (payload.type === "UPDATE" && payload.old_record?.status === "released") {
    return null;
  }
  const id = String(payload.record?.id ?? "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id : null;
}

function pilotPhone(value) {
  const digits = String(value ?? "").replace(/[\s()+-]/g, "");
  return /^[1-9][0-9]{7,14}$/.test(digits) ? digits : null;
}

async function mark(admin, resultId, fields) {
  const { error } = await admin.from("result_whapi_pilot_notifications")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("result_id", resultId);
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ ok: false, code: "method_not_allowed" }, 405);

  const webhookSecret = Deno.env.get("WHAPI_WEBHOOK_SECRET") ?? "";
  if (!await equalSecrets(req.headers.get("x-webhook-secret"), webhookSecret)) {
    return reply({ ok: false, code: "unauthorized" }, 401);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return reply({ ok: false, code: "invalid_json" }, 400);
  }
  const resultId = resultIdFromEvent(payload);
  if (!resultId) return reply({ ok: true, status: "ignored" });

  // The pilot never sends to a patient. Activation is an explicit secret.
  if (Deno.env.get("WHAPI_PILOT_ENABLED") !== "true") {
    return reply({ ok: true, status: "pilot_disabled" });
  }

  const token = Deno.env.get("WHAPI_TOKEN") ?? "";
  const phone = pilotPhone(Deno.env.get("WHAPI_PILOT_PHONE"));
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!token || !phone || !url || !serviceKey) {
    return reply({ ok: false, code: "pilot_not_configured" }, 503);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: result, error: resultError } = await admin
    .from("patient_results").select("id,status")
    .eq("id", resultId).maybeSingle();
  if (resultError || !result || result.status !== "released") {
    return reply({ ok: false, code: "released_result_not_found" }, 409);
  }

  const { data: claims, error: claimError } = await admin.rpc(
    "claim_result_whapi_pilot", { p_result_id: resultId },
  );
  if (claimError) return reply({ ok: false, code: "claim_failed" }, 500);
  const claim = Array.isArray(claims) ? claims[0] : claims;
  if (!claim?.claimed) {
    return reply({ ok: true, status: claim?.notification_status ?? "unchanged" });
  }

  try {
    const response = await fetch("https://gate.whapi.cloud/messages/text", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        to: phone,
        body: "PILOTO - Laboratorio Clinico Dr. Milton Chasi: se libero un resultado de prueba en el sistema. Este aviso no contiene datos del paciente ni archivos.",
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      await mark(admin, resultId, {
        status: "failed", last_error: `whapi_http_${response.status}`,
      });
      return reply({ ok: false, code: "whapi_rejected" }, 502);
    }

    const data = await response.json().catch(() => ({}));
    const messageId = String(data?.message?.id ?? data?.id ?? "").slice(0, 200);
    await mark(admin, resultId, {
      status: "accepted",
      accepted_at: new Date().toISOString(),
      whapi_message_id: messageId || null,
      last_error: null,
    });
    // Accepted by Whapi; delivery requires a separate status webhook.
    return reply({ ok: true, status: "accepted" });
  } catch {
    try {
      // Network failures can happen after Whapi accepted the request.
      // A human must check the channel before another attempt.
      await mark(admin, resultId, {
        status: "needs_review", last_error: "uncertain_delivery_check_whapi",
      });
    } catch { /* Keep the original failure response. */ }
    return reply({ ok: false, code: "send_failed" }, 502);
  }
});
