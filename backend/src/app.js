// src/app.js
import express from "express";
import { corsOptions } from "./config/cors.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import router from "./routes/index.js";

const app = express();

app.use(corsOptions);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", router);

// 404 — route non trouvée
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Handler global d'erreurs — TOUJOURS en dernier
app.use(errorHandler);

export default app;