// src/sync/pull/index.js
import { pullProfile }         from "./pullProfile.js";
import { pullCourses }         from "./pullCourses.js";
import { pullCourseStructure } from "./pullCourseStructure.js";
import { pullFileResources }   from "./pullFileResources.js";
import { pullExternalUrls }    from "./pullExternalUrls.js";
import { pullAssignments }     from "./pullAssignments.js";

export const pullAll = async (ctx) => {
  let pulled = 0;
  let conflicts = 0;

  const add = (r) => { 
    pulled += r?.pulled || 0; 
    conflicts += r?.conflicts || 0; 
  };

  // 1. Profil et Cours
  add(await pullProfile(ctx));
  add(await pullCourses(ctx));

  // 2. Structure (Sections et Modules/Enveloppes)
  add(await pullCourseStructure(ctx));

  // 3. Contenus spécifiques & Génération des LocalFiles
  add(await pullFileResources(ctx));
  add(await pullExternalUrls(ctx));
  add(await pullAssignments(ctx));

  return { pulled, conflicts };
};