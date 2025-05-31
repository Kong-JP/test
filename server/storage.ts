import { 
  patents, 
  analysisResults, 
  analysisRequests,
  type Patent, 
  type InsertPatent,
  type AnalysisResult,
  type InsertAnalysisResult,
  type AnalysisRequest,
  type InsertAnalysisRequest,
  type PatentAnalysisResponse
} from "@shared/schema";

export interface IStorage {
  // Patent operations
  getPatent(id: number): Promise<Patent | undefined>;
  getPatentByNumber(patentNumber: string): Promise<Patent | undefined>;
  createPatent(patent: InsertPatent): Promise<Patent>;
  getAllPatents(): Promise<Patent[]>;
  
  // Analysis request operations
  createAnalysisRequest(request: InsertAnalysisRequest): Promise<AnalysisRequest>;
  getAnalysisRequest(id: number): Promise<AnalysisRequest | undefined>;
  updateAnalysisRequestStatus(id: number, status: string): Promise<void>;
  
  // Analysis result operations
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  getAnalysisResultsByRequest(requestId: number): Promise<Array<AnalysisResult & { priorArtPatent: Patent }>>;
  
  // Complex queries
  searchPriorArt(targetPatent: Patent, minMatchRate: number): Promise<Patent[]>;
  getPatentAnalysisResponse(requestId: number): Promise<PatentAnalysisResponse | undefined>;
}

export class MemStorage implements IStorage {
  private patents: Map<number, Patent> = new Map();
  private analysisResults: Map<number, AnalysisResult> = new Map();
  private analysisRequests: Map<number, AnalysisRequest> = new Map();
  private currentPatentId = 1;
  private currentAnalysisResultId = 1;
  private currentAnalysisRequestId = 1;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample patents for demonstration
    const samplePatents: InsertPatent[] = [
      {
        patentNumber: "US 9,708,683 B2",
        title: "Advanced corrosion-resistant steel composition",
        publicationDate: new Date("2017-07-18"),
        composition: {
          Fe: "balance",
          C: "0.05-0.15%",
          Cr: "18-22%",
          Ni: "8-12%",
          Mo: "2-3%"
        },
        microstructure: "Austenite + Ferrite dual-phase structure",
        properties: {
          tensileStrength: "650-750 MPa",
          elongation: "35-45%",
          corrosionResistance: "PREN > 40"
        },
        abstract: "An advanced corrosion-resistant steel composition with improved mechanical properties for marine applications.",
        claims: "A steel composition comprising Fe, C (0.05-0.15%), Cr (18-22%), Ni (8-12%), Mo (2-3%)...",
        country: "US"
      },
      {
        patentNumber: "US 8,945,234 A1",
        title: "High-strength steel composition with improved corrosion resistance",
        publicationDate: new Date("2015-02-03"),
        composition: {
          Fe: "balance",
          C: "0.08-0.12%",
          Cr: "19-21%",
          Ni: "9-11%",
          Mo: "2.2-2.8%"
        },
        microstructure: "Austenite + minor Ferrite structure",
        properties: {
          tensileStrength: "680-720 MPa",
          elongation: "38-42%",
          corrosionResistance: "PREN > 42"
        },
        abstract: "A high-strength steel composition with enhanced corrosion resistance for industrial applications.",
        claims: "A steel composition comprising Fe, C (0.08-0.12%), Cr (19-21%), Ni (9-11%), Mo (2.2-2.8%)...",
        country: "US"
      },
      {
        patentNumber: "JP 2014-156789 A",
        title: "Anti-corrosive steel alloy for marine applications",
        publicationDate: new Date("2014-08-28"),
        composition: {
          Fe: "balance",
          C: "0.06-0.14%",
          Cr: "17-23%",
          Ni: "7-13%",
          Mo: "1.8-3.2%"
        },
        microstructure: "Austenite dominant with dispersed Ferrite",
        properties: {
          tensileStrength: "620-780 MPa",
          elongation: "32-48%",
          corrosionResistance: "PREN > 38"
        },
        abstract: "An anti-corrosive steel alloy specifically designed for harsh marine environments.",
        claims: "A steel alloy comprising Fe, C (0.06-0.14%), Cr (17-23%), Ni (7-13%), Mo (1.8-3.2%)...",
        country: "JP"
      },
      {
        patentNumber: "KR 10-2013-0089456 A",
        title: "고강도 내식성 강재 조성물 및 제조방법",
        publicationDate: new Date("2013-08-12"),
        composition: {
          Fe: "balance",
          C: "0.07-0.13%",
          Cr: "18.5-21.5%",
          Ni: "8.5-11.5%",
          Mo: "2.1-2.9%"
        },
        microstructure: "Austenite 기지에 소량의 Ferrite 분산",
        properties: {
          tensileStrength: "640-760 MPa",
          elongation: "36-44%",
          corrosionResistance: "PREN > 39"
        },
        abstract: "고강도와 우수한 내식성을 갖는 강재 조성물 및 그 제조방법에 관한 발명",
        claims: "Fe, C (0.07-0.13%), Cr (18.5-21.5%), Ni (8.5-11.5%), Mo (2.1-2.9%)를 포함하는 강재 조성물...",
        country: "KR"
      }
    ];

    samplePatents.forEach(patent => {
      this.createPatent(patent);
    });
  }

  async getPatent(id: number): Promise<Patent | undefined> {
    return this.patents.get(id);
  }

  async getPatentByNumber(patentNumber: string): Promise<Patent | undefined> {
    return Array.from(this.patents.values()).find(
      patent => patent.patentNumber === patentNumber
    );
  }

  async createPatent(insertPatent: InsertPatent): Promise<Patent> {
    const id = this.currentPatentId++;
    const patent: Patent = { ...insertPatent, id };
    this.patents.set(id, patent);
    return patent;
  }

  async getAllPatents(): Promise<Patent[]> {
    return Array.from(this.patents.values());
  }

  async createAnalysisRequest(insertRequest: InsertAnalysisRequest): Promise<AnalysisRequest> {
    const id = this.currentAnalysisRequestId++;
    const request: AnalysisRequest = { 
      ...insertRequest, 
      id, 
      status: "pending",
      createdAt: new Date()
    };
    this.analysisRequests.set(id, request);
    return request;
  }

  async getAnalysisRequest(id: number): Promise<AnalysisRequest | undefined> {
    return this.analysisRequests.get(id);
  }

  async updateAnalysisRequestStatus(id: number, status: string): Promise<void> {
    const request = this.analysisRequests.get(id);
    if (request) {
      request.status = status;
      this.analysisRequests.set(id, request);
    }
  }

  async createAnalysisResult(insertResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const id = this.currentAnalysisResultId++;
    const result: AnalysisResult = { 
      id,
      targetPatentId: insertResult.targetPatentId!,
      priorArtPatentId: insertResult.priorArtPatentId!,
      overallSimilarity: insertResult.overallSimilarity,
      compositionSimilarity: insertResult.compositionSimilarity,
      microstructureSimilarity: insertResult.microstructureSimilarity,
      propertiesSimilarity: insertResult.propertiesSimilarity,
      rank: insertResult.rank!,
      createdAt: new Date()
    };
    this.analysisResults.set(id, result);
    return result;
  }

  async getAnalysisResultsByRequest(requestId: number): Promise<Array<AnalysisResult & { priorArtPatent: Patent }>> {
    const results = Array.from(this.analysisResults.values())
      .filter(result => result.targetPatentId === requestId);
    
    return results.map(result => {
      const priorArtPatent = this.patents.get(result.priorArtPatentId);
      return {
        ...result,
        priorArtPatent: priorArtPatent!
      };
    });
  }

  async searchPriorArt(targetPatent: Patent, minMatchRate: number): Promise<Patent[]> {
    const allPatents = Array.from(this.patents.values());
    
    return allPatents.filter(patent => 
      patent.id !== targetPatent.id && 
      patent.publicationDate < targetPatent.publicationDate
    );
  }

  private calculateSimilarity(target: any, candidate: any): number {
    // Simple similarity calculation for demonstration
    // In a real implementation, this would be much more sophisticated
    if (typeof target === 'string' && typeof candidate === 'string') {
      const targetWords = target.toLowerCase().split(/\s+/);
      const candidateWords = candidate.toLowerCase().split(/\s+/);
      const commonWords = targetWords.filter(word => candidateWords.includes(word));
      return (commonWords.length / Math.max(targetWords.length, candidateWords.length)) * 100;
    }
    
    if (typeof target === 'object' && typeof candidate === 'object') {
      const targetKeys = Object.keys(target);
      const candidateKeys = Object.keys(candidate);
      const commonKeys = targetKeys.filter(key => candidateKeys.includes(key));
      
      if (commonKeys.length === 0) return 0;
      
      const similarities = commonKeys.map(key => {
        const targetVal = target[key];
        const candidateVal = candidate[key];
        
        if (typeof targetVal === 'string' && typeof candidateVal === 'string') {
          // For percentage ranges, extract numbers and compare
          const targetNums = targetVal.match(/[\d.]+/g) || [];
          const candidateNums = candidateVal.match(/[\d.]+/g) || [];
          
          if (targetNums.length > 0 && candidateNums.length > 0) {
            const targetAvg = targetNums.reduce((sum, num) => sum + parseFloat(num), 0) / targetNums.length;
            const candidateAvg = candidateNums.reduce((sum, num) => sum + parseFloat(num), 0) / candidateNums.length;
            const diff = Math.abs(targetAvg - candidateAvg);
            const maxVal = Math.max(targetAvg, candidateAvg);
            return Math.max(0, (1 - diff / maxVal)) * 100;
          }
        }
        
        return targetVal === candidateVal ? 100 : 50; // Exact match or partial credit
      });
      
      return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    }
    
    return 0;
  }

  async performAnalysis(requestId: number): Promise<void> {
    const request = await this.getAnalysisRequest(requestId);
    if (!request) return;

    await this.updateAnalysisRequestStatus(requestId, "in-progress");

    const targetPatent = await this.getPatentByNumber(request.targetPatentNumber);
    if (!targetPatent) {
      await this.updateAnalysisRequestStatus(requestId, "failed");
      return;
    }

    const priorArtPatents = await this.searchPriorArt(targetPatent, request.minMatchRate);
    
    const analysisScope = request.analysisScope as { composition: boolean; microstructure: boolean; properties: boolean };
    
    const resultsWithScores = priorArtPatents.map(priorArt => {
      const compositionSim = analysisScope.composition ? 
        this.calculateSimilarity(targetPatent.composition, priorArt.composition) : 0;
      const microstructureSim = analysisScope.microstructure ? 
        this.calculateSimilarity(targetPatent.microstructure, priorArt.microstructure) : 0;
      const propertiesSim = analysisScope.properties ? 
        this.calculateSimilarity(targetPatent.properties, priorArt.properties) : 0;
      
      const activeScopeCount = Object.values(analysisScope).filter(Boolean).length;
      const overallSim = (compositionSim + microstructureSim + propertiesSim) / activeScopeCount;
      
      return {
        priorArt,
        compositionSimilarity: compositionSim,
        microstructureSimilarity: microstructureSim,
        propertiesSimilarity: propertiesSim,
        overallSimilarity: overallSim
      };
    });

    // Filter by minimum match rate and sort by overall similarity
    const filteredResults = resultsWithScores
      .filter(result => result.overallSimilarity >= request.minMatchRate)
      .sort((a, b) => b.overallSimilarity - a.overallSimilarity)
      .slice(0, 3); // Top 3 results

    // Save analysis results
    for (let i = 0; i < filteredResults.length; i++) {
      const result = filteredResults[i];
      await this.createAnalysisResult({
        targetPatentId: targetPatent.id,
        priorArtPatentId: result.priorArt.id,
        overallSimilarity: result.overallSimilarity,
        compositionSimilarity: result.compositionSimilarity,
        microstructureSimilarity: result.microstructureSimilarity,
        propertiesSimilarity: result.propertiesSimilarity,
        rank: i + 1
      });
    }

    await this.updateAnalysisRequestStatus(requestId, "completed");
  }

  async getPatentAnalysisResponse(requestId: number): Promise<PatentAnalysisResponse | undefined> {
    const request = await this.getAnalysisRequest(requestId);
    if (!request) return undefined;

    const targetPatent = await this.getPatentByNumber(request.targetPatentNumber);
    if (!targetPatent) return undefined;

    const results = await this.getAnalysisResultsByRequest(targetPatent.id);

    return {
      id: requestId,
      targetPatent,
      results: results.sort((a, b) => (a.rank || 0) - (b.rank || 0)),
      totalCount: results.length,
      status: request.status
    };
  }
}

export const storage = new MemStorage();
