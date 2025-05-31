import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import type { Patent, AnalysisResult } from "@shared/schema";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPatent: Patent | null;
  priorArtPatent: Patent | null;
  analysisResult: AnalysisResult | null;
  onAddToReport: () => void;
}

export function DetailModal({ 
  isOpen, 
  onClose, 
  targetPatent, 
  priorArtPatent, 
  analysisResult,
  onAddToReport 
}: DetailModalProps) {
  if (!targetPatent || !priorArtPatent || !analysisResult) {
    return null;
  }

  const formatComposition = (composition: any) => {
    if (typeof composition === 'object') {
      return Object.entries(composition)
        .map(([element, range]) => `${element} (${range})`)
        .join(', ');
    }
    return composition;
  };

  const formatProperties = (properties: any) => {
    if (typeof properties === 'object') {
      return Object.entries(properties)
        .map(([property, value]) => `${property}: ${value}`)
        .join(', ');
    }
    return properties;
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return "bg-green-500";
    if (similarity >= 80) return "bg-green-500";
    if (similarity >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              특허 상세 비교 분석
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Target Patent */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                대상 특허 ({targetPatent.patentNumber})
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">발명의 명칭:</span>
                  <p className="text-sm text-gray-900 mt-1">{targetPatent.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">주요 성분:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatComposition(targetPatent.composition)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">미세조직:</span>
                  <p className="text-sm text-gray-900 mt-1">{targetPatent.microstructure}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">주요 물성:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatProperties(targetPatent.properties)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Prior Art Patent */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                선행기술 특허 ({priorArtPatent.patentNumber})
              </h4>
              <div className="bg-green-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">발명의 명칭:</span>
                  <p className="text-sm text-gray-900 mt-1">{priorArtPatent.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">주요 성분:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatComposition(priorArtPatent.composition)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">미세조직:</span>
                  <p className="text-sm text-gray-900 mt-1">{priorArtPatent.microstructure}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">주요 물성:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatProperties(priorArtPatent.properties)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comparison Chart */}
          <div className="mt-8">
            <h4 className="font-medium text-gray-900 mb-4">유사도 상세 분석</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">성분 조성 일치율</span>
                  <span className="text-sm font-semibold text-green-600">
                    {analysisResult.compositionSimilarity.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={analysisResult.compositionSimilarity} 
                  className="h-3"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">미세조직 일치율</span>
                  <span className="text-sm font-semibold text-green-600">
                    {analysisResult.microstructureSimilarity.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={analysisResult.microstructureSimilarity} 
                  className="h-3"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">물성 일치율</span>
                  <span className="text-sm font-semibold text-green-600">
                    {analysisResult.propertiesSimilarity.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={analysisResult.propertiesSimilarity} 
                  className="h-3"
                />
              </div>
            </div>
          </div>
          
          {/* Legal Assessment */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">법적 평가</h4>
            <p className="text-sm text-blue-800">
              이 선행기술은 대상 특허의 신규성 및 진보성을 부정하는 강력한 증거가 될 수 있습니다. 
              성분 조성과 미세조직이 매우 유사하며, 물성 역시 중복되는 범위를 보입니다. 
              특허심판원 이의신청 시 핵심 증거로 활용 가능합니다.
            </p>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button onClick={onAddToReport} className="bg-blue-600 hover:bg-blue-700">
            보고서에 추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
