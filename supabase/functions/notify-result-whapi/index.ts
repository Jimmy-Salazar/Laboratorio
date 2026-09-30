import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
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
  if (payload.type === "UPDATE" && payload.old_record?.status === "released") return null;
  const id = String(payload.record?.id ?? "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id : null;
}

// Only Ecuador mobile numbers are supported in this initial rollout.
function ecuadorMobile(value) {
  const raw = String(value ?? "").trim();
  if (!/^[+\d\s()-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  const normalized = /^09\d{8}$/.test(digits) ? `593${digits.slice(1)}` :
    /^9\d{8}$/.test(digits) ? `593${digits}` : digits;
  return /^5939\d{8}$/.test(normalized) ? normalized : null;
}

async function mark(admin, resultId, fields) {
  const { data, error } = await admin.from("result_whapi_notifications")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("result_id", resultId).select("result_id").maybeSingle();
  if (error || !data) throw error ?? new Error("notification_row_missing");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ ok: false, code: "method_not_allowed" }, 405);
  if (!await equalSecrets(
    req.headers.get("x-webhook-secret"), Deno.env.get("WHAPI_WEBHOOK_SECRET") ?? ""
  )) return reply({ ok: false, code: "unauthorized" }, 401);

  let event;
  try { event = await req.json(); }
  catch { return reply({ ok: false, code: "invalid_json" }, 400); }
  const resultId = resultIdFromEvent(event);
  if (!resultId) return reply({ ok: true, status: "ignored" });

  if (Deno.env.get("WHAPI_RESULT_ENABLED") !== "true") {
    return reply({ ok: true, status: "disabled" });
  }

  const token = Deno.env.get("WHAPI_TOKEN") ?? "";
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!token || !url || !serviceKey) {
    return reply({ ok: false, code: "not_configured" }, 503);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: result, error: resultError } = await admin.from("patient_results")
    .select("id,status,order_id").eq("id", resultId).maybeSingle();
  if (resultError || !result || result.status !== "released" || !result.order_id) {
    return reply({ ok: false, code: "released_result_not_found" }, 409);
  }

  const { data: claimed, error: claimError } = await admin.rpc(
    "claim_result_whapi_notification", { p_result_id: resultId },
  );
  if (claimError) return reply({ ok: false, code: "claim_failed" }, 500);
  if (!claimed) return reply({ ok: true, status: "already_handled" });

  try {
    const { data: order, error: orderError } = await admin.from("result_orders")
      .select("patient_id").eq("id", result.order_id).maybeSingle();
    if (orderError || !order?.patient_id) throw new Error("order_lookup_failed");
    const { data: patient, error: patientError } = await admin.from("patients")
      .select("phone").eq("id", order.patient_id).maybeSingle();
    if (patientError || !patient) throw new Error("patient_lookup_failed");

    const phone = ecuadorMobile(patient.phone);
    if (!phone) {
      await mark(admin, resultId, {
        status: "skipped_invalid_phone", last_error: "missing_or_invalid_ecuador_mobile",
      });
      return reply({ ok: true, status: "skipped_invalid_phone" });
    }

    const response = await fetch("https://gate.whapi.cloud/messages/text", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        to: phone,
        body: "Laboratorio Clinico Dr. Milton Chasi: su resultado ya esta disponible. Ingrese al portal de resultados o comuniquese con el laboratorio. Este mensaje no incluye informacion medica.",
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      await mark(admin, resultId, {
        status: response.status >= 500 ? "needs_review" : "failed",
        recipient_last4: phone.slice(-4),
        last_error: `whapi_http_${response.status}`,
      });
      return reply({ ok: false, code: "whapi_rejected" }, 502);
    }

    const body = await response.json().catch(() => ({}));
    const messageId = String(body?.message?.id ?? body?.id ?? "").slice(0, 200);
    await mark(admin, resultId, {
      status: "accepted", recipient_last4: phone.slice(-4),
      accepted_at: new Date().toISOString(), whapi_message_id: messageId || null,
      last_error: null,
    });
    // Whapi acceptance does not prove delivery on the patient's phone.
    return reply({ ok: true, status: "accepted" });
  } catch (error) {
    try {
      await mark(admin, resultId, {
        status: "needs_review",
        last_error: error instanceof Error &&
          ["order_lookup_failed", "patient_lookup_failed"].includes(error.message)
          ? error.message : "uncertain_send_check_whapi",
      });
    } catch { /* Do not overwrite the original failure response. */ }
    return reply({ ok: false, code: "send_needs_review" }, 502);
  }
});
