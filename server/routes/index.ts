import { Express } from "express";
import { createServer } from "http";
import trainingRoutes from "./training";

export function registerRoutes(app: Express) {
  const server = createServer(app);

  // Register API routes
  app.use("/api", trainingRoutes);

  return server;
} 