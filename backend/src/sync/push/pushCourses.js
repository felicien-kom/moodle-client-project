// src/sync/push/pushCourses.js
import fs from "fs";
import path from "path";
import { moodleFetch } from "../../config/moodleApi.js";
import { env } from "../../config/env.js";
import { getUserMediaDir } from "../../utils/storage.js";

export const pushCourses = async ({ prisma, token, emitter }) => {
  emitter.emit("progress", { step: "PUSH", entity: "courses", status: "start" });

  const pendingCourses = await prisma.course.findMany({
    where: { sync_status: "PENDING_PUSH", server_id: null },
    include: { sections: true }
  });

  const user = await prisma.localUser.findFirst();

  let pushed = 0;
  let conflicts = 0;

  for (const course of pendingCourses) {
    try {
      let draftItemId = 0;
      
      // Upload de l'image si présente
      if (course.imageUrl && user) {
        const baseDir = getUserMediaDir(user.email);
        const fullPath = path.join(baseDir, course.imageUrl);
        
        if (fs.existsSync(fullPath)) {
          const fileBuffer = fs.readFileSync(fullPath);
          const mimeType = fullPath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
          const blob = new Blob([fileBuffer], { type: mimeType });
          
          const formData = new FormData();
          formData.append("token", token);
          formData.append("itemid", draftItemId);
          formData.append("filearea", "draft");
          formData.append("file", blob, path.basename(fullPath));

          const uploadUrl = `${env.MOODLE_URL}/webservice/upload.php`;
          const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (Array.isArray(uploadData) && uploadData[0]?.itemid) {
              draftItemId = uploadData[0].itemid;
            }
          }
        }
      }

      // Préparation des paramètres pour core_course_create_courses
      const courseParams = {
        courses: [
          {
            fullname: course.title,
            shortname: course.shortName,
            categoryid: course.categoryId || 1, // Catégorie 1 par défaut
            summary: course.summary || "",
          }
        ]
      };

      if (draftItemId !== 0) {
        // Envoi de l'image de couverture du cours
        // Parfois pris en charge par courseformatoptions, sinon on le passe au premier niveau
        courseParams.courses[0].courseformatoptions = [
          { name: "overviewfiles_filemanager", value: String(draftItemId) }
        ];
      }

      const numSections = course.sections.length > 1 ? course.sections.length - 1 : 1; 
      if (!courseParams.courses[0].courseformatoptions) {
        courseParams.courses[0].courseformatoptions = [];
      }
      courseParams.courses[0].courseformatoptions.push({ name: "numsections", value: String(numSections) });

      const { data: serverResponse, servertime } = await moodleFetch(
        "core_course_create_courses",
        courseParams,
        token
      );

      // La réponse est un tableau de cours créés
      if (!Array.isArray(serverResponse) || serverResponse.length === 0 || !serverResponse[0].id) {
        throw new Error("Erreur inattendue de Moodle lors de la création du cours.");
      }

      const newServerId = serverResponse[0].id;

      // Mettre à jour le cours local avec le server_id et SYNCED
      await prisma.course.update({
        where: { id: course.id },
        data: {
          server_id: newServerId,
          sync_status: "SYNCED",
          server_timemodified: servertime,
          last_synced_at: servertime
        }
      });

      // Mettre à jour les sections locales
      await prisma.section.updateMany({
        where: { courseId: course.id },
        data: {
          sync_status: "SYNCED",
          server_timemodified: servertime,
          last_synced_at: servertime
        }
      });

      // Inscription automatique du créateur au cours sur Moodle (en tant qu'enseignant : roleid 3)
      try {
        await moodleFetch("enrol_manual_enrol_users", {
          enrolments: [
            {
              roleid: 3,
              userid: user.moodleUserId,
              courseid: newServerId
            }
          ]
        }, token);
      } catch (enrolErr) {
        console.warn(`[SYNC WARNING] Impossible d'inscrire l'enseignant au cours ${newServerId}:`, enrolErr.message);
      }

      // Ajout de CourseEnrollment pour la sync PULL
      await prisma.courseEnrollment.upsert({
        where: { courseServerId: newServerId },
        update: { enrolledOnServer: true, syncEnabled: true },
        create: { courseServerId: newServerId, enrolledOnServer: true, syncEnabled: true }
      });

      pushed++;
      emitter.emit("progress", { step: "PUSH", entity: "course", localId: course.id });

    } catch (err) {
      console.error(`Error pushing course ${course.id}:`, err);
      emitter.emit("progress", {
        step: "PUSH_ERROR", entity: "course",
        localId: course.id, error: err.message,
      });
    }
  }

  emitter.emit("progress", { step: "PUSH", entity: "courses", status: "done", pushed });
  return { pushed, conflicts };
};
