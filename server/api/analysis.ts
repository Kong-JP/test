import { FastifyInstance } from "fastify";
import { storage } from "../storage";
import { insertAnalysisRequestSchema, insertAnalysisResultSchema } from "@shared/schema";
import { processPatentAnalysis } from "../services/analysis";
import { uploadPdf } from "../services/upload";
import { Type } from "@sinclair/typebox";
import multipart from "@fastify/multipart";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export default async function analysisRoutes(fastify: FastifyInstance) {
  // 업로드 디렉토리 생성
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Multipart 설정
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  });

  // 분석 요청 생성
  fastify.post("/api/analysis", async (request, reply) => {
    try {
      const data = await request.file();
      let pdfPath = null;

      if (data) {
        if (data.mimetype !== "application/pdf") {
          throw new Error("PDF 파일만 업로드 가능합니다.");
        }

        pdfPath = await uploadPdf(data, UPLOAD_DIR);
      }

      const analysisRequest = {
        ...request.body,
        competitorPatentPdf: pdfPath
      };

      const validatedData = insertAnalysisRequestSchema.parse(analysisRequest);
      const result = await storage.createAnalysisRequest(validatedData);

      // 분석 프로세스 시작
      processPatentAnalysis(result.id);

      return { id: result.id };
    } catch (error) {
      console.error("Analysis request error:", error);
      reply.status(400).send({ error: error.message });
    }
  });

  // 분석 결과 조회
  fastify.get("/api/analysis/:id", {
    schema: {
      params: Type.Object({
        id: Type.Number()
      })
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };
      const result = await storage.getAnalysisResult(id);
      
      if (!result) {
        reply.status(404).send({ error: "Analysis result not found" });
        return;
      }

      return result;
    }
  });

  // 분석 상태 조회
  fastify.get("/api/analysis/:id/status", {
    schema: {
      params: Type.Object({
        id: Type.Number()
      })
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };
      const status = await storage.getAnalysisStatus(id);
      
      if (!status) {
        reply.status(404).send({ error: "Analysis not found" });
        return;
      }

      return { status };
    }
  });
} 