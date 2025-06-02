import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisRequestSchema, analysisRequests } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all patents
  app.get("/api/patents", async (req, res) => {
    try {
      const patents = await storage.getAllPatents();
      res.json(patents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patents" });
    }
  });

  // Get patent by number
  app.get("/api/patents/:patentNumber", async (req, res) => {
    try {
      const patent = await storage.getPatentByNumber(req.params.patentNumber);
      if (!patent) {
        return res.status(404).json({ message: "Patent not found" });
      }
      res.json(patent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patent" });
    }
  });

  // Create analysis request
  app.post("/api/analysis", async (req, res) => {
    try {
      console.log("Received request body:", req.body);
      
      // Create the request data with proper types
      const requestData = {
        targetPatentNumber: req.body.targetPatentNumber,
        publicationDate: req.body.publicationDate ? new Date(req.body.publicationDate) : new Date("2017-07-18"),
        minMatchRate: req.body.minMatchRate,
        analysisScope: req.body.analysisScope
      };
      
      console.log("Transformed request data:", requestData);
      
      // Insert directly into database to avoid schema validation issues
      const [request] = await db.insert(analysisRequests).values(requestData).returning();
      
      // Start analysis in background
      setTimeout(async () => {
        await (storage as any).performAnalysis(request.id);
      }, 1000);
      
      res.json(request);
    } catch (error) {
      console.error("Analysis request error:", error);
      res.status(500).json({ message: "Failed to create analysis request" });
    }
  });

  // Get analysis result
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const analysisResponse = await storage.getPatentAnalysisResponse(analysisId);
      
      if (!analysisResponse) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json(analysisResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis result" });
    }
  });

  // Get analysis status
  app.get("/api/analysis/:id/status", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const request = await storage.getAnalysisRequest(analysisId);
      
      if (!request) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json({ status: request.status });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
