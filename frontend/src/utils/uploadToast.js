import { toast } from "sonner";

export const UPLOAD_TOAST_OPTS = {
  position: "top-left",
  duration: 4500,
};

export function uploadSuccess(message = "Chargement terminé") {
  toast.success(message, UPLOAD_TOAST_OPTS);
}

export function uploadError(message = "Le téléchargement n'a pas pu aboutir.") {
  toast.error(message, UPLOAD_TOAST_OPTS);
}

export async function runWithUploadFeedback(task, {
  loadingMessage = "Transfert de fichier...",
  successMessage = "Fichier prêt !",
} = {}) {
  const id = toast.loading(loadingMessage, UPLOAD_TOAST_OPTS);
  try {
    const result = await task();
    toast.success(successMessage, { id, ...UPLOAD_TOAST_OPTS });
    return result;
  } catch (err) {
    const msg = "Une erreur a interrompu le transfert. Essayez à nouveau.";
    toast.error(msg, { id, ...UPLOAD_TOAST_OPTS });
    throw err;
  }
}
