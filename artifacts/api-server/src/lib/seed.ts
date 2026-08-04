/**
 * Seeds the default admin user (admin / admin) if no users exist yet.
 * Called once at server startup.
 */
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export async function seedAdminIfEmpty(): Promise<void> {
  try {
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
    if (existing) return; // already seeded

    const hash = await bcrypt.hash("admin", 12);
    await db.insert(usersTable).values({
      username: "admin",
      displayName: "Administrator",
      passwordHash: hash,
      mustChangePassword: true,
    });
    logger.info("Default admin user created (username: admin, password: admin)");
  } catch (err) {
    logger.error({ err }, "Failed to seed admin user");
  }
}
