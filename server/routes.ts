import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisRequestSchema, analysisRequests } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// PDF 업로드를 위한 디렉토리 생성
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

  // PDF 파일 업로드 처리
  app.post("/api/upload-pdf", async (req, res) => {
    try {
      if (!req.files || !req.files.pdf) {
        return res.status(400).json({ message: "PDF 파일이 없습니다." });
      }

      const pdfFile = req.files.pdf;
      const fileName = `${Date.now()}-${pdfFile.name}`;
      const filePath = path.join(uploadDir, fileName);

      await pdfFile.mv(filePath);

      res.json({
        message: "PDF 파일이 성공적으로 업로드되었습니다.",
        fileName: fileName
      });
    } catch (error) {
      console.error("PDF 업로드 에러:", error);
      res.status(500).json({ message: "PDF 업로드에 실패했습니다." });
    }
  });

  // PDF 생성 엔드포인트
  app.post("/api/generate-pdf", async (req, res) => {
    try {
      const analysisData = req.body;

      // PDF 문서 생성
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      
      // 폰트 설정
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      
      // 제목 추가
      page.drawText('특허 분석 결과 보고서', {
        x: 50,
        y: height - 50,
        size: 20,
        font,
        color: rgb(0, 0, 0),
      });

      // 대상 특허 정보
      page.drawText(`대상 특허: ${analysisData.targetPatent.patentNumber}`, {
        x: 50,
        y: height - 100,
        size: fontSize,
        font,
      });

      // 분석 결과 추가
      let yPosition = height - 150;
      analysisData.results.forEach((result: any, index: number) => {
        yPosition -= 30;
        page.drawText(`${index + 1}. 유사 특허: ${result.priorArtPatent.patentNumber}`, {
          x: 50,
          y: yPosition,
          size: fontSize,
          font,
        });
        
        yPosition -= 20;
        page.drawText(`   유사도: ${(result.overallSimilarity * 100).toFixed(2)}%`, {
          x: 50,
          y: yPosition,
          size: fontSize,
          font,
        });
      });

      // PDF 파일 생성
      const pdfBytes = await pdfDoc.save();
      
      // 응답 헤더 설정
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=analysis-report.pdf');
      
      // PDF 파일 전송
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("PDF 생성 에러:", error);
      res.status(500).json({ message: "PDF 생성에 실패했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
