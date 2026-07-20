import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, scriptsTable } from "@workspace/db";
import { insertScriptSchema } from "@workspace/db/schema";

const router: IRouter = Router();

// GET /scripts — list all saved scripts, newest first
router.get("/scripts", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(scriptsTable)
      .orderBy(desc(scriptsTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list scripts");
    res.status(500).json({ error: "Не удалось загрузить сценарии." });
  }
});

// POST /scripts — save a script
router.post("/scripts", async (req, res) => {
  const parseResult = insertScriptSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  try {
    const [saved] = await db
      .insert(scriptsTable)
      .values(parseResult.data)
      .returning();
    res.status(201).json(saved);
  } catch (err) {
    req.log.error({ err }, "Failed to save script");
    res.status(500).json({ error: "Не удалось сохранить сценарий." });
  }
});

// DELETE /scripts/:id — delete a script
router.delete("/scripts/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid script ID." });
    return;
  }

  try {
    const deleted = await db
      .delete(scriptsTable)
      .where(eq(scriptsTable.id, id))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: "Сценарий не найден." });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete script");
    res.status(500).json({ error: "Не удалось удалить сценарий." });
  }
});

export default router;
