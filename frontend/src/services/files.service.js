import apiClient from "@/client/apiClient";
import { API_CONFIG } from "@/config/api.config";

/**
 * Service pour gérer les fichiers
 * Communique avec l'API backend pour télécharger et servir les fichiers
 * Supporte le mode hors-ligne via IndexedDB
 */

// ─── IndexedDB pour stockage local des fichiers ─────────────────────────────
const DB_NAME = 'MoodleFilesDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

let db = null;

async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'fileId' });
      }
    };
  });
}

async function saveFileToIndexedDB(fileId, blob) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ fileId, blob, timestamp: Date.now() });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getFileFromIndexedDB(fileId) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(fileId);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Télécharge un fichier depuis le serveur Moodle vers le stockage local
 * @param {number} fileId - L'ID local du fichier
 * @returns {Promise<Object>} { message, localPath }
 */
export async function downloadFile(fileId) {
  if (!fileId) {
    throw new Error("fileId est requis");
  }

  try {
    const response = await apiClient.post(`/files/${fileId}/download`);
    
    // Après téléchargement réussi, récupérer le fichier et le stocker dans IndexedDB pour mode hors-ligne
    try {
      const fileResponse = await fetch(`${API_CONFIG.baseURL}/files/${fileId}/serve`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (fileResponse.ok) {
        const blob = await fileResponse.blob();
        await saveFileToIndexedDB(fileId, blob);
        console.log(`Fichier ${fileId} stocké dans IndexedDB pour mode hors-ligne`);
      }
    } catch (storageError) {
      console.warn("Impossible de stocker le fichier dans IndexedDB:", storageError);
    }
    
    return response;
  } catch (error) {
    console.error(`Erreur lors du téléchargement du fichier ${fileId}:`, error);
    throw error;
  }
}

/**
 * Sert un fichier depuis le stockage local (après téléchargement)
 * @param {number} fileId - L'ID local du fichier
 * @returns {Promise<string>} URL blob pour ouvrir le fichier
 */
export async function serveFile(fileId) {
  if (!fileId) {
    throw new Error("fileId est requis");
  }

  try {
    // 1. Essayer d'abord IndexedDB (mode hors-ligne)
    try {
      const cachedFile = await getFileFromIndexedDB(fileId);
      if (cachedFile && cachedFile.blob) {
        console.log(`Fichier ${fileId} servi depuis IndexedDB (mode hors-ligne)`);
        const blobUrl = window.URL.createObjectURL(cachedFile.blob);
        return blobUrl;
      }
    } catch (dbError) {
      console.warn("Erreur lors de la lecture IndexedDB:", dbError);
    }

    // 2. Si pas dans IndexedDB, essayer le serveur (mode en ligne)
    console.log(`Fichier ${fileId} non trouvé dans IndexedDB, tentative depuis le serveur`);
    const response = await fetch(`${API_CONFIG.baseURL}/files/${fileId}/serve`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Erreur ${response.status}`);
    }

    // Créer un blob à partir de la réponse
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    return blobUrl;
  } catch (error) {
    console.error(`Erreur lors de l'ouverture du fichier ${fileId}:`, error);
    throw error;
  }
}

/**
 * Télécharge plusieurs fichiers en lot (bulk download)
 * @param {Array<number>} fileIds - Liste des IDs de fichiers à télécharger
 * @returns {Promise<Object>} { downloaded, failed, message }
 */
export async function bulkDownloadFiles(fileIds) {
  if (!fileIds || !Array.isArray(fileIds)) {
    throw new Error("fileIds doit être un tableau");
  }

  try {
    const response = await apiClient.post("/files/download-bulk", { fileIds });
    return response;
  } catch (error) {
    console.error("Erreur lors du téléchargement en lot:", error);
    throw error;
  }
}

/**
 * Récupère tous les fichiers locaux
 * @returns {Promise<Array>} Liste des fichiers
 */
export async function getAllLocalFiles() {
  try {
    const response = await apiClient.get("/files");
    return response.files || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    throw error;
  }
}
