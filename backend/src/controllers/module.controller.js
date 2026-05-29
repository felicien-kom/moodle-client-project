// src/controllers/module.controller.js
import * as moduleService from "../services/module.service.js";

// POST /api/modules/courses/:courseId/sections/:sectionId
export const createModule = async (req, res) => {
  const courseId = Number(req.params.courseId);
  const sectionId = Number(req.params.sectionId);
  const { modType, name, intro, externalUrl } = req.body;
  const files = req.files; // Géré par Multer

  if (!courseId || !sectionId) {
    return res.status(400).json({ error: "courseId and sectionId are required" });
  }

  if (!modType || !name) {
    return res.status(400).json({ error: "modType and name are required" });
  }

  const validModTypes = ["assign", "resource", "folder", "url"];
  if (!validModTypes.includes(modType)) {
    return res.status(400).json({ error: `Invalid modType. Must be one of: ${validModTypes.join(", ")}` });
  }

  if (modType === "url" && !externalUrl) {
    return res.status(400).json({ error: "externalUrl is required for modType 'url'" });
  }

  try {
    const module = await moduleService.createModuleLocally(
      req.prisma,
      req.user.email,
      courseId,
      sectionId,
      modType,
      name,
      intro,
      externalUrl,
      files
    );

    res.status(201).json({ message: "Module created locally. Ready for sync.", module });
  } catch (err) {
    console.error("[module.controller] Error creating module:", err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};
