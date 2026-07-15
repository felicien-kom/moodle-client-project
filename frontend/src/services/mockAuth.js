/**
 * Mock data pour l'authentification locale
 */

export const SHARED_TEST_PASSWORD = "Password";

export const MOCK_USERS = {
  "tamo.gregoire@test.local": {
    id: "1",
    email: "tamo.gregoire@test.local",
    name: "Tamo Gregoire",
    password: SHARED_TEST_PASSWORD,
    role: "teacher",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tamo",
  },
  "tarick.keni@test.local": {
    id: "2",
    email: "tarick.keni@test.local",
    name: "Tarick Keni",
    password: SHARED_TEST_PASSWORD,
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tarick",
  },
  "nono.jorge@test.local": {
    id: "3",
    email: "nono.jorge@test.local",
    name: "Nono Jorge",
    password: SHARED_TEST_PASSWORD,
    role: "student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nono",
  },
};

/**
 * Simule une authentification locale
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
 */
export async function mockLogin(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const normalizedPassword = String(password || "").trim();
      const user = MOCK_USERS[normalizedEmail];
      const passwordMatches =
        user && normalizedPassword.toLowerCase() === user.password.toLowerCase();

      if (!passwordMatches) {
        reject(new Error("Email ou mot de passe incorrect"));
        return;
      }

      // Créer un objet utilisateur sans le mot de passe
      const { password: _, ...userWithoutPassword } = user;

      resolve({
        user: userWithoutPassword,
        accessToken: `mock_token_${user.id}_${Date.now()}`,
        refreshToken: `mock_refresh_${user.id}_${Date.now()}`,
      });
    }, 500); // Simule un délai réseau
  });
}
