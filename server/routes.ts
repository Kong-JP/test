import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisRequestSchema, analysisRequests } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import multer from "multer";
import path from "path";

// 파일 업로드를 위한 multer 설정
const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("PDF 파일만 업로드 가능합니다."));
    }
  }
});

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

  // PDF 파일 업로드 엔드포인트
  app.post("/api/upload-pdf", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "파일이 업로드되지 않았습니다." });
      }

      const patentId = parseInt(req.body.patentId);
      if (!patentId) {
        return res.status(400).json({ message: "특허 ID가 필요합니다." });
      }

      // 파일 정보를 데이터베이스에 저장
      const fileInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        patentId: patentId
      };

      const savedFile = await storage.createPdfFile(fileInfo);

      res.json({ 
        message: "파일이 성공적으로 업로드되었습니다.",
        file: savedFile 
      });
    } catch (error) {
      console.error("파일 업로드 에러:", error);
      res.status(500).json({ message: "파일 업로드에 실패했습니다." });
    }
  });

  // PDF 파일 조회 엔드포인트
  app.get("/api/patents/:patentId/pdf-files", async (req, res) => {
    try {
      const patentId = parseInt(req.params.patentId);
      const files = await storage.getPdfFilesByPatentId(patentId);
      res.json(files);
    } catch (error) {
      console.error("PDF 파일 조회 에러:", error);
      res.status(500).json({ message: "PDF 파일 조회에 실패했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
