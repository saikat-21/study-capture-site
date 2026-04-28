export const EXTENSION_HANDOFF_KEY = "studyCaptureExtensionHandoff";
const HANDOFF_SOURCE = "study-capture-web";
const HANDOFF_RESPONSE_SOURCE = "study-capture-extension";
const ACTIVATE_TYPE = "STUDY_CAPTURE_ACTIVATE_PRO";
const ACTIVATE_RESULT_TYPE = "STUDY_CAPTURE_ACTIVATE_PRO_RESULT";

export function getExtensionHandoff(searchParams) {
  const source = searchParams?.get("src") || "website";
  const extensionId = sanitizeExtensionId(searchParams?.get("extId"));
  return {
    source,
    extensionId,
    isExtensionSource: source === "extension"
  };
}

export function sanitizeExtensionId(value) {
  if (typeof value !== "string") return "";
  const id = value.trim();
  if (!id || id.length > 160) return "";
  return /^[A-Za-z0-9._@{}-]+$/.test(id) ? id : "";
}

export async function sendExtensionActivation({ extensionId, email, licenseRef }) {
  const safeExtensionId = sanitizeExtensionId(extensionId);
  const bridgeResult = await sendPostMessageActivation({ email, licenseRef });
  if (bridgeResult.ok || bridgeResult.reached) return bridgeResult;

  if (!safeExtensionId) {
    return {
      ok: false,
      skipped: true,
      message: "Extension handoff is unavailable in this browser session."
    };
  }

  const message = {
    type: ACTIVATE_TYPE,
    email,
    licenseRef,
    source: "studycapture.co"
  };

  if (globalThis.chrome?.runtime?.sendMessage) {
    return sendChromeRuntimeMessage(safeExtensionId, message);
  }

  if (globalThis.browser?.runtime?.sendMessage) {
    try {
      const response = await globalThis.browser.runtime.sendMessage(safeExtensionId, message);
      return normalizeHandoffResponse(response);
    } catch (error) {
      return {
        ok: false,
        message: error?.message || "Could not reach the Study Capture extension."
      };
    }
  }

  return {
    ok: false,
    skipped: true,
    message: "Open Study Capture and click Activate Pro to finish activation."
  };
}

function sendPostMessageActivation({ email, licenseRef }) {
  if (typeof window === "undefined") {
    return Promise.resolve({ ok: false, skipped: true });
  }

  return new Promise((resolve) => {
    const requestId =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false, skipped: true });
    }, 4500);

    function onMessage(event) {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (
        !data ||
        data.source !== HANDOFF_RESPONSE_SOURCE ||
        data.type !== ACTIVATE_RESULT_TYPE ||
        data.requestId !== requestId
      ) {
        return;
      }

      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve({
        reached: true,
        ok: data.ok === true,
        code: data.code || data.error || null,
        message: data.message || null
      });
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      {
        source: HANDOFF_SOURCE,
        type: ACTIVATE_TYPE,
        requestId,
        payload: {
          email,
          licenseRef
        }
      },
      window.location.origin
    );
  });
}

function sendChromeRuntimeMessage(extensionId, message) {
  return new Promise((resolve) => {
    globalThis.chrome.runtime.sendMessage(extensionId, message, (response) => {
      const lastError = globalThis.chrome.runtime.lastError;
      if (lastError) {
        resolve({
          ok: false,
          message: lastError.message || "Could not reach the Study Capture extension."
        });
        return;
      }

      resolve(normalizeHandoffResponse(response));
    });
  });
}

function normalizeHandoffResponse(response) {
  if (response?.ok) return response;
  return {
    ok: false,
    code: response?.code || response?.error || "extension_handoff_failed",
    message:
      response?.message ||
      "Could not activate Study Capture automatically. Use Activate Pro in the extension."
  };
}
