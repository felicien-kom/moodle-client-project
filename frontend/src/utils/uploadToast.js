import { toast } from "sonner";

export const UPLOAD_TOAST_OPTS = {
  position: "top-left",
  duration: 4500,
};

export function uploadSuccess(message = "Chargement terminé") {
  toast.success(message, UPLOAD_TOAST_OPTS);
}

export function uploadError(message = "Échec du chargement") {
  toast.error(message, UPLOAD_TOAST_OPTS);
}

export async function runWithUploadFeedback(task, {
  loadingMessage = "Chargement en cours…",
  successMessage = "Chargement terminé",
} = {}) {
  const id = toast.loading(loadingMessage, UPLOAD_TOAST_OPTS);
  try {
    const result = await task();
    toast.success(successMessage, { id, ...UPLOAD_TOAST_OPTS });
    return result;
  } catch (err) {
    const msg = err?.message || "Échec du chargement";
    toast.error(msg, { id, ...UPLOAD_TOAST_OPTS });
    throw err;
  }
}
