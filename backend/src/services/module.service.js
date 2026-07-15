// src/services/module.service.js
import fs from "fs";
import path from "path";
import { getUserMediaDir } from "../utils/storage.js";

export const createModuleLocally = async (
  prisma,
  userEmail,
  courseId,
  sectionId,
  modType,
  name,
  intro,
  externalUrl,
  files
) => {
  // Vérification de l'existence du cours et de la section
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    const err = new Error("Course not found locally.");
    err.statusCode = 404;
    throw err;
  }

  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) {
    const err = new Error("Section not found locally.");
    err.statusCode = 404;
    throw err;
  }

  // Calcul du prochain sortOrder
  const lastModule = await prisma.module.findFirst({
    where: { sectionId },
    orderBy: { sortOrder: "desc" }
  });
  const nextSortOrder = lastModule ? lastModule.sortOrder + 1 : 1;

  // Création du module générique
  const newModule = await prisma.module.create({
    data: {
      courseId,
      sectionId,
      name,
      modType,
      description: intro,
      sortOrder: nextSortOrder,
      visible: true,
      sync_status: "PENDING_PUSH"
    }
  });

  // Création de l'activité spécifique selon modType
  let activity;
  if (modType === "assign") {
    activity = await prisma.assignment.create({
      data: {
        courseId,
        moduleId: newModule.id,
        name,
        intro,
        requiresFile: true,
        requiresText: true,
        sync_status: "PENDING_PUSH"
      }
    });
  } else if (modType === "resource") {
    activity = await prisma.fileResource.create({
      data: {
        moduleId: newModule.id,
        name,
        intro,
        sync_status: "PENDING_PUSH"
      }
    });
  } else if (modType === "folder") {
    activity = await prisma.folderResource.create({
      data: {
        moduleId: newModule.id,
        name,
        intro,
        sync_status: "PENDING_PUSH"
      }
    });
  } else if (modType === "url") {
    activity = await prisma.externalUrl.create({
      data: {
        moduleId: newModule.id,
        name,
        externalUrl,
        description: intro,
        sync_status: "PENDING_PUSH"
      }
    });
  }

  // Traitement des fichiers joints (pour assign, resource, folder)
  if (files && files.length > 0 && modType !== "url") {
    const mediaDir = getUserMediaDir(userEmail);
    // On crée un dossier spécifique pour le stockage offline des modules créés (ex: "modules")
    const modulesSubDir = path.join(mediaDir, "modules");
    if (!fs.existsSync(modulesSubDir)) {
      fs.mkdirSync(modulesSubDir, { recursive: true });
    }

    for (const file of files) {
      const filenameRaw = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const relativeFilename = `mod_${newModule.id}_${Date.now()}_${filenameRaw}`;
      const fullPath = path.join(modulesSubDir, relativeFilename);
      
      // Écriture physique
      fs.writeFileSync(fullPath, file.buffer);

      // Création du LocalFile lié à la bonne activité
      const localFileData = {
        filename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        localPath: path.join("modules", relativeFilename).replace(/\\/g, "/"),
        sync_status: "PENDING_PUSH"
      };

      if (modType === "assign") {
        // Fichiers d'intro (sujet) pour l'assignment
        await prisma.localFile.create({
          data: {
            ...localFileData,
            assignment: { connect: { id: activity.id } }
          }
        });
      } else if (modType === "resource") {
        await prisma.localFile.create({
          data: {
            ...localFileData,
            fileResource: { connect: { id: activity.id } }
          }
        });
      } else if (modType === "folder") {
        await prisma.localFile.create({
          data: {
            ...localFileData,
            folderResource: { connect: { id: activity.id } }
          }
        });
      }
    }
  }

  // Mise à jour du "instance" ID sur le module parent
  await prisma.module.update({
    where: { id: newModule.id },
    data: { instance: activity.id } // Optionnel, mais recommandé si vous l'utilisez ailleurs
  });

  return newModule;
};
