import { apiRequest } from "./queryClient";
import type { PatentAnalysisResponse, InsertAnalysisRequest, Patent } from "@shared/schema";

export const patentApi = {
  // Get all patents
  getPatents: async (): Promise<Patent[]> => {
    const response = await apiRequest("GET", "/api/patents");
    return response.json();
  },

  // Get patent by number
  getPatentByNumber: async (patentNumber: string): Promise<Patent> => {
    const response = await apiRequest("GET", `/api/patents/${encodeURIComponent(patentNumber)}`);
    return response.json();
  },

  // Create analysis request
  createAnalysisRequest: async (request: InsertAnalysisRequest): Promise<{ id: number }> => {
    const response = await apiRequest("POST", "/api/analysis", request);
    return response.json();
  },

  // Get analysis result
  getAnalysisResult: async (id: number): Promise<PatentAnalysisResponse> => {
    const response = await apiRequest("GET", `/api/analysis/${id}`);
    return response.json();
  },

  // Get analysis status
  getAnalysisStatus: async (id: number): Promise<{ status: string }> => {
    const response = await apiRequest("GET", `/api/analysis/${id}/status`);
    return response.json();
  }
};
