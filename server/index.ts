import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.VITE_PRODUCTION_BASE_URL || 'http://codsphere.in:5000',
        process.env.VITE_PRODUCTION_DOMAIN || 'http://codsphere.in'
      ]
    : process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Info'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize the database
    await initializeDatabase();
    log("Database initialized successfully");
  } catch (error) {
    log(`Error initializing database: ${error}`);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Development mode setup
  if (app.get("env") === "development") {
    // Setup Vite middleware first
    await setupVite(app, server);
    
    // Add a development-specific route for training feedback
    app.get("/training-feedback/:id", async (req, res) => {
      try {
        const indexPath = path.join(process.cwd(), 'client', 'index.html');
        console.log("Serving development feedback form from:", indexPath);
        
        if (!fs.existsSync(indexPath)) {
          console.error("Development index.html not found at:", indexPath);
          return res.status(500).json({ error: "Client files not found" });
        }
        
        res.sendFile(indexPath);
      } catch (error) {
        console.error("Error serving feedback form:", error);
        res.status(500).json({ error: "Failed to serve feedback form" });
      }
    });
  } else {
    // Production mode setup
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
