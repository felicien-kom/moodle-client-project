import {
  FileText,
  File,
  FileCode,
  FileImage,
  Music,
  Video,
  Archive,
} from "lucide-react";

/**
 * Détermine l'icone Lucide appropriée pour un type de fichier
 * @param {string} filename - Nom du fichier
 * @returns {Object} { icon: Component, color: string }
 */
export function getFileIcon(filename) {
  if (!filename) return { icon: File, color: "text-gray-600" };
  
  const ext = filename.split(".").pop().toLowerCase();
  
  const iconConfig = {
    // Documents
    pdf:    { icon: FileText,  color: "text-red-600" },
    doc:    { icon: FileText,  color: "text-blue-600" },
    docx:   { icon: FileText,  color: "text-blue-600" },
    txt:    { icon: File,      color: "text-gray-600" },
    xls:    { icon: FileText,  color: "text-green-600" },
    xlsx:   { icon: FileText,  color: "text-green-600" },
    csv:    { icon: FileText,  color: "text-green-600" },
    ppt:    { icon: FileText,  color: "text-orange-600" },
    pptx:   { icon: FileText,  color: "text-orange-600" },
    
    // Code
    js:     { icon: FileCode,  color: "text-yellow-600" },
    jsx:    { icon: FileCode,  color: "text-blue-600" },
    ts:     { icon: FileCode,  color: "text-blue-600" },
    tsx:    { icon: FileCode,  color: "text-blue-600" },
    py:     { icon: FileCode,  color: "text-blue-600" },
    java:   { icon: FileCode,  color: "text-orange-600" },
    cpp:    { icon: FileCode,  color: "text-blue-600" },
    c:      { icon: FileCode,  color: "text-blue-600" },
    html:   { icon: FileCode,  color: "text-red-600" },
    css:    { icon: FileCode,  color: "text-blue-600" },
    scss:   { icon: FileCode,  color: "text-pink-600" },
    json:   { icon: FileCode,  color: "text-gray-600" },
    xml:    { icon: FileCode,  color: "text-purple-600" },
    yaml:   { icon: FileCode,  color: "text-gray-600" },
    yml:    { icon: FileCode,  color: "text-gray-600" },
    md:     { icon: FileCode,  color: "text-gray-600" },
    
    // Images
    jpg:    { icon: FileImage, color: "text-purple-600" },
    jpeg:   { icon: FileImage, color: "text-purple-600" },
    png:    { icon: FileImage, color: "text-purple-600" },
    gif:    { icon: FileImage, color: "text-purple-600" },
    svg:    { icon: FileImage, color: "text-purple-600" },
    bmp:    { icon: FileImage, color: "text-purple-600" },
    webp:   { icon: FileImage, color: "text-purple-600" },
    ico:    { icon: FileImage, color: "text-purple-600" },
    
    // Audio
    mp3:    { icon: Music,     color: "text-pink-600" },
    wav:    { icon: Music,     color: "text-pink-600" },
    flac:   { icon: Music,     color: "text-pink-600" },
    aac:    { icon: Music,     color: "text-pink-600" },
    ogg:    { icon: Music,     color: "text-pink-600" },
    m4a:    { icon: Music,     color: "text-pink-600" },
    
    // Vidéo
    mp4:    { icon: Video,     color: "text-red-600" },
    avi:    { icon: Video,     color: "text-red-600" },
    mkv:    { icon: Video,     color: "text-red-600" },
    mov:    { icon: Video,     color: "text-red-600" },
    webm:   { icon: Video,     color: "text-red-600" },
    flv:    { icon: Video,     color: "text-red-600" },
    wmv:    { icon: Video,     color: "text-red-600" },
    
    // Archive
    zip:    { icon: Archive,   color: "text-amber-600" },
    rar:    { icon: Archive,   color: "text-amber-600" },
    "7z":   { icon: Archive,   color: "text-amber-600" },
    tar:    { icon: Archive,   color: "text-amber-600" },
    gz:     { icon: Archive,   color: "text-amber-600" },
    bz2:    { icon: Archive,   color: "text-amber-600" },
  };
  
  return iconConfig[ext] || { icon: File, color: "text-gray-600" };
}

/**
 * Formatte la taille du fichier en format lisible
 * @param {number} bytes - Taille en octets
 * @returns {string} Taille formatée (ex: "1.5 Mo")
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Extrait l'extension d'un nom de fichier
 * @param {string} filename - Nom du fichier
 * @returns {string} Extension en minuscules
 */
export function getFileExtension(filename) {
  if (!filename) return "";
  return filename.split(".").pop().toLowerCase();
}

/**
 * Détermine si un fichier est un type connu téléchargeable
 * @param {string} filename - Nom du fichier
 * @returns {boolean} true si le type est reconnu
 */
export function isDownloadableFile(filename) {
  if (!filename) return false;
  
  const ext = getFileExtension(filename);
  const downloadableExts = [
    // Documents
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
    // Code
    "js", "jsx", "ts", "tsx", "py", "java", "html", "css", "json",
    // Images
    "jpg", "jpeg", "png", "gif", "svg", "bmp", "webp",
    // Audio
    "mp3", "wav", "flac", "aac", "ogg", "m4a",
    // Vidéo
    "mp4", "avi", "mkv", "mov", "webm",
    // Archive
    "zip", "rar", "7z", "tar", "gz",
  ];
  
  return downloadableExts.includes(ext);
}
