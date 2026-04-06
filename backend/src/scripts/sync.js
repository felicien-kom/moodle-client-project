// scripts/sync.js
// Script terminal pour lancer une sync depuis la ligne de commande.
// Usage :
//   node scripts/sync.js                    → sync du premier profil trouvé
//   node scripts/sync.js alice@univ.fr      → sync d'un profil spécifique
//   node scripts/sync.js --list             → liste tous les profils disponibles

import "dotenv/config";
import { masterDb, getDb, disconnectAll } from "../src/config/db.js";
import { SyncEngine } from "../src/sync/engine.js";

const STYLING_HYPHENS = 55;

const run = async () => {
  const arg = process.argv[2];

  // ── --list : afficher tous les profils ───────────────────

  if (arg === "--list") {
    const profiles = await masterDb.profile.findMany({
      orderBy: { lastLoginAt: "desc" },
    });

    if (profiles.length === 0) {
      console.log("No local profiles found. Create one via POST /api/auth/profile");
    } else {
      console.log("\n📋 Local profiles:\n");
      for (const p of profiles) {
        const lastLogin = p.lastLoginAt
          ? new Date(p.lastLoginAt).toLocaleString()
          : "never";
        console.log(`  • ${p.username} (${p.email})`);
        console.log(`    Role       : ${p.role}`);
        console.log(`    Last login : ${lastLogin}\n`);
      }
    }
    await disconnectAll();
    process.exit(0);
  }

  // ── Trouver le profil à synchroniser ─────────────────────

  let profile;

  if (arg) {
    // Chercher par email ou username
    profile = await masterDb.profile.findFirst({
      where: { OR: [{ email: arg }, { username: arg }] },
    });

    if (!profile) {
      console.error(`❌ No local profile found for: ${arg}`);
      console.error(`   Run "node scripts/sync.js --list" to see available profiles.`);
      await disconnectAll();
      process.exit(1);
    }
  } else {
    profile = await masterDb.profile.findFirst({ orderBy: { lastLoginAt: "desc" } });
    if (!profile) {
      console.error("❌ No local profiles found.");
      console.error("   Create one via POST /api/auth/profile");
      await disconnectAll();
      process.exit(1);
    }
  }

  // ── Lancer la sync ────────────────────────────────────────

  console.log(`\n🔄 Starting sync for: ${profile.username} <${profile.email}>`);
  console.log(`   Role     : ${profile.role}`);
  console.log("─".repeat(STYLING_HYPHENS));

  const engine = new SyncEngine(profile.email);

  // Affichage des events dans le terminal
  engine.on("progress", (event) => {
    switch (event.step) {
      case "INIT":
        if (event.status === "checking_server") {
          console.log("🌐 Checking Moodle server connection...");
        } else if (event.status === "fetching_server_time") {
          console.log("🕐 Fetching server time...");
        } else if (event.status === "ready") {
          console.log(`✅ Server reachable — ${event.siteName}`);
          console.log(`   Servertime : ${event.servertime} | Role : ${event.role}`);
        } else if (event.cursor !== undefined) {
          console.log(`📍 Cursor: ${event.cursor} (0 = first sync)`);
        }
        break;

      case "PHASE":
        console.log(`\n${"─".repeat(STYLING_HYPHENS)}`);
        console.log(`📦 Phase: ${event.phase}`);
        console.log("─".repeat(STYLING_HYPHENS));
        break;

      case "PULL":
        if (event.status === "start") {
          process.stdout.write(`  ↓ Pulling ${event.entity}...`);
        } else if (event.status === "done") {
          console.log(` ${event.pulled ?? 0} pulled`);
        } else if (event.status === "local_only") {
          console.log(`  ℹ️  ${event.entity}: ${event.note}`);
        } else {
          process.stdout.write(".");
        }
        break;

      case "PUSH":
        if (event.status === "start") {
          process.stdout.write(`  ↑ Pushing ${event.entity}...`);
        } else if (event.status === "done") {
          console.log(` ${event.pushed ?? 0} pushed`);
        } else if (event.status === "local_only") {
          console.log(`  ℹ️  ${event.entity}: ${event.note}`);
        } else {
          process.stdout.write(".");
        }
        break;

      case "CONFLICT":
        console.log(`\n  ⚠️  Conflict on ${event.entity} #${event.id} → resolved: ${event.resolution}`);
        break;

      case "PUSH_ERROR":
        console.log(`\n  ❌ Push error on ${event.entity}: ${event.error}`);
        break;
    }
  });

  engine.on("error", (event) => {
    console.error(`\n❌ Sync failed: ${event.message}`);
  });

  try {
    const result = await engine.run();
    console.log("\n" + "─".repeat(STYLING_HYPHENS));
    console.log("✅ Sync completed successfully");
    console.log(`   ↑ Pushed    : ${result.pushed}`);
    console.log(`   ↓ Pulled    : ${result.pulled}`);
    console.log(`   ⚠  Conflicts: ${result.conflicts}`);
    console.log(`   📍 New cursor: ${result.newCursor}`);
    console.log("─".repeat(STYLING_HYPHENS) + "\n");
  } catch {
    // Erreur déjà affichée via l'event "error"
  } finally {
    await disconnectAll();
    process.exit(0);
  }
};

run();