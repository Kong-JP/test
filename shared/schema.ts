import { pgTable, text, serial, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patents = pgTable("patents", {
  id: serial("id").primaryKey(),
  patentNumber: text("patent_number").notNull().unique(),
  title: text("title").notNull(),
  publicationDate: timestamp("publication_date").notNull(),
  composition: jsonb("composition").notNull(), // Chemical composition data
  microstructure: text("microstructure").notNull(),
  properties: jsonb("properties").notNull(), // Physical properties data
  abstract: text("abstract").notNull(),
  claims: text("claims").notNull(),
  country: text("country").notNull(),
  pdfPath: text("pdf_path"), // Optional path to uploaded PDF file
});

export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  targetPatentId: serial("target_patent_id").references(() => patents.id),
  priorArtPatentId: serial("prior_art_patent_id").references(() => patents.id),
  overallSimilarity: real("overall_similarity").notNull(),
  compositionSimilarity: real("composition_similarity").notNull(),
  microstructureSimilarity: real("microstructure_similarity").notNull(),
  propertiesSimilarity: real("properties_similarity").notNull(),
  rank: serial("rank"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analysisRequests = pgTable("analysis_requests", {
  id: serial("id").primaryKey(),
  targetPatentNumber: text("target_patent_number").notNull(),
  publicationDate: timestamp("publication_date").notNull(),
  minMatchRate: real("min_match_rate").notNull(),
  analysisScope: jsonb("analysis_scope").notNull(), // {composition: boolean, microstructure: boolean, properties: boolean}
  status: text("status").notNull().default("pending"), // pending, in-progress, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  competitorPatentPdf: jsonb("competitor_patent_pdf"), // PDF 파일 업로드를 위한 필드
});

export const insertPatentSchema = createInsertSchema(patents);

export const insertAnalysisRequestSchema = z.object({
  targetPatentNumber: z.string().min(1, "특허번호를 입력해주세요"),
  minMatchRate: z.number().min(0).max(100),
  publicationDate: z.date(),
  analysisScope: z.object({
    composition: z.boolean(),
    microstructure: z.boolean(),
    properties: z.boolean()
  }),
  competitorPatentPdf: z.any().optional() // PDF 파일 업로드를 위한 필드
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true,
  createdAt: true,
});

export type Patent = typeof patents.$inferSelect;
export type InsertPatent = typeof patents.$inferInsert;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;
export type AnalysisRequest = typeof analysisRequests.$inferSelect;
export type InsertAnalysisRequest = z.infer<typeof insertAnalysisRequestSchema>;

// Additional types for API responses
export type PatentAnalysisResponse = {
  id: number;
  targetPatent: Patent;
  results: Array<AnalysisResult & { priorArtPatent: Patent }>;
  totalCount: number;
  status: string;
};

export type SimilarityScores = {
  composition: number;
  microstructure: number;
  properties: number;
  overall: number;
};
