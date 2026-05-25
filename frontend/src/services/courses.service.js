
// Vidéos de prévisualisation libres de droits (Google Common Data Storage)
const PREVIEW_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
];

const COURSE_IMAGES = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
];

// Mock data en attendant le backend
const mockCourses = [
  {
    id: "1",
    title: "Techniques d'optimisation avancées",
    description: "Maîtrisez les stratégies de performance applicative, l'analyse algorithmique et les meilleures pratiques d'architecture logicielle.",
    category: "Developpement",
    level: "Avancé",
    duration: "12h 30min",
    rating: 4.8,
    reviewCount: 124,
    image: COURSE_IMAGES[0],
    previewVideo: PREVIEW_VIDEOS[0],
    startDate: "2026-03-29",
    endDate: null,
    createdBy: "1",
    createdByName: "Tamo Gregoire",
    enrolledUserIds: ["3"],
    sections: [
      {
        id: "s1",
        title: "Fondamentaux de la performance",
        activities: [
          { id: "a1", type: "video", title: "Introduction au profiling", duration: "12 min" },
          { id: "a2", type: "resource", title: "Guide PDF — Complexité algorithmique", duration: "Lecture" },
          { id: "a3", type: "task", title: "Exercice : Analyser un algorithme O(n²)", duration: "30 min" },
        ],
      },
      {
        id: "s2",
        title: "Optimisation avancée",
        activities: [
          { id: "a4", type: "video", title: "Lazy loading et code splitting", duration: "20 min" },
          { id: "a5", type: "quiz", title: "Quiz de validation", duration: "15 min" },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Architecture des applications web modernes",
    description: "De la conception à la mise en production, concevez des systèmes robustes, évolutifs et maintenables.",
    category: "Architecture",
    level: "Intermédiaire",
    duration: "18h 00min",
    rating: 4.6,
    reviewCount: 89,
    image: COURSE_IMAGES[1],
    previewVideo: PREVIEW_VIDEOS[1],
    startDate: "2026-04-01",
    endDate: null,
    createdBy: "2",
    createdByName: "Tarick Keni",
    enrolledUserIds: ["1", "3"],
    sections: [
      {
        id: "s3",
        title: "Modèles d'architecture",
        activities: [
          { id: "a6", type: "video", title: "MVC vs Hexagonal Architecture", duration: "25 min" },
          { id: "a7", type: "resource", title: "Guide de référence — Clean Architecture", duration: "Lecture" },
        ],
      },
    ],
  },
  {
    id: "3",
    title: "Analyse de données avec Python",
    description: "De la collecte à la visualisation : nettoyage, exploration et interprétation des données avec Pandas, NumPy et Seaborn.",
    category: "Data Science",
    level: "Débutant",
    duration: "9h 45min",
    rating: 4.9,
    reviewCount: 256,
    image: COURSE_IMAGES[2],
    previewVideo: PREVIEW_VIDEOS[2],
    startDate: "2026-04-05",
    endDate: null,
    createdBy: "2",
    createdByName: "Tarick Keni",
    enrolledUserIds: ["1"],
    sections: [],
  },
  {
    id: "4",
    title: "Pédagogie numérique inclusive",
    description: "Concevez des formations accessibles et engageantes adaptées à tous les profils d'apprenants, même en connectivité limitée.",
    category: "Education",
    level: "Intermédiaire",
    duration: "6h 15min",
    rating: 4.7,
    reviewCount: 43,
    image: COURSE_IMAGES[3],
    previewVideo: PREVIEW_VIDEOS[3],
    startDate: "2026-04-10",
    endDate: null,
    createdBy: "1",
    createdByName: "Tamo Gregoire",
    enrolledUserIds: [],
    sections: [],
  },
];

let allCourses = structuredClone(mockCourses);

function withViewerState(course, viewerUserId) {
  const normalizedViewerId = String(viewerUserId || "");

  return {
    ...course,
    isEnrolled:
      normalizedViewerId.length > 0 &&
      Array.isArray(course.enrolledUserIds) &&
      course.enrolledUserIds.includes(normalizedViewerId),
  };
}

function mapWithViewerState(courses, viewerUserId) {
  return courses.map((course) => withViewerState(course, viewerUserId));
}

function getCourseById(courseId) {
  return allCourses.find((course) => String(course.id) === String(courseId));
}

function getImageValue(imageInput) {
  if (imageInput instanceof File) {
    return URL.createObjectURL(imageInput);
  }

  if (typeof imageInput === "string" && imageInput.trim().length > 0) {
    return imageInput;
  }

  return COURSE_IMAGES[Math.floor(Math.random() * COURSE_IMAGES.length)];
}

export async function fetchAllCourses({ viewerUserId } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mapWithViewerState(allCourses, viewerUserId)), 300);
  });
}

export async function fetchCourseById(courseId, { viewerUserId } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const course = getCourseById(courseId);

      if (!course) {
        reject(new Error("Cours non trouve"));
        return;
      }

      resolve(withViewerState(course, viewerUserId));
    }, 300);
  });
}

export async function fetchUserCourses(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const normalizedUserId = String(userId || "");
      const userCourses = allCourses.filter(
        (course) => String(course.createdBy) === normalizedUserId
      );

      resolve(mapWithViewerState(userCourses, normalizedUserId));
    }, 300);
  });
}

export async function fetchEnrolledCourses(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const normalizedUserId = String(userId || "");
      const enrolledCourses = allCourses.filter(
        (course) =>
          String(course.createdBy) !== normalizedUserId &&
          Array.isArray(course.enrolledUserIds) &&
          course.enrolledUserIds.includes(normalizedUserId)
      );

      resolve(mapWithViewerState(enrolledCourses, normalizedUserId));
    }, 300);
  });
}

export async function fetchDiscoverCourses(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const normalizedUserId = String(userId || "");
      const discoverCourses = allCourses.filter(
        (course) =>
          String(course.createdBy) !== normalizedUserId &&
          (!Array.isArray(course.enrolledUserIds) ||
            !course.enrolledUserIds.includes(normalizedUserId))
      );

      resolve(mapWithViewerState(discoverCourses, normalizedUserId));
    }, 300);
  });
}

export async function createCourse(courseData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const authorId = String(courseData.createdBy || "");

      const newCourse = {
        id: String(Date.now()),
        title: courseData.title,
        description: courseData.description || "",
        category: courseData.category || "General",
        image: getImageValue(courseData.image),
        startDate: courseData.startDate || null,
        endDate: courseData.endDate || null,
        createdBy: authorId,
        createdByName: courseData.createdByName || "Inconnu",
        enrolledUserIds: [],
        sections: [],
        createdAt: new Date().toISOString(),
      };

      allCourses = [newCourse, ...allCourses];
      resolve(withViewerState(newCourse, authorId));
    }, 300);
  });
}

export async function updateCourse(courseId, courseData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const course = getCourseById(courseId);

      if (!course) {
        reject(new Error("Cours non trouve"));
        return;
      }

      Object.assign(course, {
        ...courseData,
        image:
          Object.prototype.hasOwnProperty.call(courseData, "image")
            ? getImageValue(courseData.image)
            : course.image,
      });

      resolve(course);
    }, 300);
  });
}

export async function deleteCourse(courseId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = allCourses.findIndex(
        (course) => String(course.id) === String(courseId)
      );

      if (index === -1) {
        reject(new Error("Cours non trouve"));
        return;
      }

      allCourses.splice(index, 1);
      resolve();
    }, 300);
  });
}

export async function enrollInCourse(courseId, userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const course = getCourseById(courseId);
      const normalizedUserId = String(userId || "");

      if (!course || !normalizedUserId) {
        reject(new Error("Impossibilite de s'inscrire"));
        return;
      }

      if (String(course.createdBy) === normalizedUserId) {
        reject(new Error("Vous etes deja proprietaire de ce cours"));
        return;
      }

      if (!Array.isArray(course.enrolledUserIds)) {
        course.enrolledUserIds = [];
      }

      if (!course.enrolledUserIds.includes(normalizedUserId)) {
        course.enrolledUserIds.push(normalizedUserId);
      }

      resolve(withViewerState(course, normalizedUserId));
    }, 300);
  });
}

export async function unenrollFromCourse(courseId, userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const course = getCourseById(courseId);
      const normalizedUserId = String(userId || "");

      if (!course || !normalizedUserId) {
        reject(new Error("Impossibilite de se desinscrire"));
        return;
      }

      course.enrolledUserIds = (course.enrolledUserIds || []).filter(
        (id) => id !== normalizedUserId
      );

      resolve(withViewerState(course, normalizedUserId));
    }, 300);
  });
}

export async function addSection(courseId, sectionData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const course = getCourseById(courseId);

      if (!course) {
        reject(new Error("Cours non trouve"));
        return;
      }

      const newSection = {
        id: `s${Date.now()}`,
        ...sectionData,
        activities: [],
      };

      course.sections.push(newSection);
      resolve(newSection);
    }, 300);
  });
}

export async function addActivity(courseId, sectionId, activityData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const course = getCourseById(courseId);

      if (!course) {
        reject(new Error("Cours non trouve"));
        return;
      }

      const section = course.sections.find(
        (item) => String(item.id) === String(sectionId)
      );

      if (!section) {
        reject(new Error("Section non trouvee"));
        return;
      }

      const newActivity = {
        id: `a${Date.now()}`,
        ...activityData,
      };

      section.activities.push(newActivity);
      resolve(newActivity);
    }, 300);
  });
}
