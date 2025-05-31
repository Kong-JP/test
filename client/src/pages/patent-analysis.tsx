import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AnalysisForm } from "@/components/analysis-form";
import { AnalysisProgress } from "@/components/analysis-progress";
import { DetailedOutputTable } from "@/components/detailed-output-table";
import { DetailModal } from "@/components/detail-modal";
import { patentApi } from "@/lib/patent-api";
import type { InsertAnalysisRequest, Patent, AnalysisResult } from "@shared/schema";
import { Scale, Bell, User } from "lucide-react";

export default function PatentAnalysis() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [selectedPatentId, setSelectedPatentId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();

  // Create analysis mutation
  const createAnalysisMutation = useMutation({
    mutationFn: (data: InsertAnalysisRequest) => patentApi.createAnalysisRequest(data),
    onSuccess: (response) => {
      setCurrentAnalysisId(response.id);
      toast({
        title: "분석 시작됨",
        description: "특허 선행기술 분석이 시작되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "분석 실패",
        description: "분석을 시작할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  });

  // Get analysis results
  const { data: analysisData } = useQuery({
    queryKey: ["/api/analysis", currentAnalysisId],
    queryFn: () => currentAnalysisId ? patentApi.getAnalysisResult(currentAnalysisId) : null,
    enabled: !!currentAnalysisId,
    refetchInterval: currentAnalysisId ? 3000 : false
  });

  // Get selected patent for detail modal
  const { data: selectedPatent } = useQuery({
    queryKey: ["/api/patents", selectedPatentId],
    queryFn: () => selectedPatentId ? patentApi.getPatentByNumber("") : null,
    enabled: false // We'll get this from the analysis results
  });

  const handleAnalysisSubmit = (data: any) => {
    createAnalysisMutation.mutate(data);
  };

  const handleShowDetails = (patentId: number) => {
    setSelectedPatentId(patentId);
    setIsDetailModalOpen(true);
  };

  const handleExportResults = () => {
    toast({
      title: "내보내기 시작됨",
      description: "분석 결과를 PDF로 내보내는 중...",
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "보고서 생성 중",
      description: "상세 분석 보고서를 생성하고 있습니다...",
    });
  };

  const handleAddToReport = () => {
    toast({
      title: "보고서에 추가됨",
      description: "선택한 특허 비교가 보고서에 추가되었습니다.",
    });
    setIsDetailModalOpen(false);
  };

  // Get the selected patent and analysis result for the detail modal
  const getSelectedPatentData = () => {
    if (!analysisData || !selectedPatentId) return { patent: null, result: null };
    
    const result = analysisData.results.find(r => r.priorArtPatent.id === selectedPatentId);
    return {
      patent: result?.priorArtPatent || null,
      result: result || null
    };
  };

  const { patent: selectedPriorArtPatent, result: selectedAnalysisResult } = getSelectedPatentData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Scale className="text-blue-600 text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">특허 선행기술 분석 시스템</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700">
                <Bell className="text-lg" />
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <User className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Panel - Search Form and Progress */}
          <div className="lg:col-span-1">
            <AnalysisForm 
              onSubmit={handleAnalysisSubmit}
              isLoading={createAnalysisMutation.isPending}
            />
            
            <AnalysisProgress analysisId={currentAnalysisId} />
          </div>
          
          {/* Right Panel - Results */}
          <div className="lg:col-span-3">
            <DetailedOutputTable 
              analysisData={analysisData || null}
              onExportResults={handleExportResults}
            />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        targetPatent={analysisData?.targetPatent || null}
        priorArtPatent={selectedPriorArtPatent}
        analysisResult={selectedAnalysisResult}
        onAddToReport={handleAddToReport}
      />
    </div>
  );
}
