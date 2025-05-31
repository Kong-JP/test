import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, FileText } from "lucide-react";
import type { PatentAnalysisResponse } from "@shared/schema";

interface ResultsTableProps {
  analysisData: PatentAnalysisResponse | null;
  onShowDetails: (patentId: number) => void;
  onExportResults: () => void;
  onGenerateReport: () => void;
}

export function ResultsTable({ 
  analysisData, 
  onShowDetails, 
  onExportResults, 
  onGenerateReport 
}: ResultsTableProps) {
  if (!analysisData || analysisData.results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">선행기술 분석 결과</h2>
              <p className="text-sm text-gray-600 mt-1">분석을 시작하면 결과가 여기에 표시됩니다.</p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-blue-600 text-white";
      case 2: return "bg-gray-600 text-white";
      case 3: return "bg-amber-500 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return "text-green-600";
    if (similarity >= 80) return "text-green-600";
    if (similarity >= 70) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">선행기술 분석 결과</h2>
            <p className="text-sm text-gray-600 mt-1">
              총 <span className="font-medium">{analysisData.totalCount}개</span>의 관련 특허 발견 (일치율 80% 이상)
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExportResults}
              className="text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              결과 내보내기
            </Button>
            <Button 
              size="sm" 
              onClick={onGenerateReport}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              보고서 생성
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">특허번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공개일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전체 일치율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">세부 분석</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analysisData.results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getRankBadgeColor(result.rank || 0)}`}>
                      {result.rank}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {result.priorArtPatent.patentNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {result.priorArtPatent.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(result.priorArtPatent.publicationDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-lg font-semibold ${getSimilarityColor(result.overallSimilarity)}`}>
                      {result.overallSimilarity.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>성분:</span>
                        <span className={`font-medium ${getSimilarityColor(result.compositionSimilarity)}`}>
                          {result.compositionSimilarity.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>미세조직:</span>
                        <span className={`font-medium ${getSimilarityColor(result.microstructureSimilarity)}`}>
                          {result.microstructureSimilarity.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>물성:</span>
                        <span className={`font-medium ${getSimilarityColor(result.propertiesSimilarity)}`}>
                          {result.propertiesSimilarity.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onShowDetails(result.priorArtPatent.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      상세보기
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Analysis Summary */}
        <div className="px-6 py-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">분석 요약</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-600 text-xl mr-3">✓</div>
                <div>
                  <h4 className="font-medium text-green-900">강력한 선행기술 발견</h4>
                  <p className="text-sm text-green-700 mt-1">
                    {analysisData.results[0]?.overallSimilarity.toFixed(1)}% 일치율의 {analysisData.results[0]?.priorArtPatent.patentNumber} 특허가 등록저지에 효과적일 것으로 분석됩니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-blue-600 text-xl mr-3">📊</div>
                <div>
                  <h4 className="font-medium text-blue-900">통계 분석</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    총 특허 검토 완료, {analysisData.totalCount}개 특허가 80% 이상 일치율 조건을 충족합니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-amber-600 text-xl mr-3">⚠️</div>
                <div>
                  <h4 className="font-medium text-amber-900">검토 필요</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    추가 법리 검토 및 전문가 의견이 필요한 경계 사례가 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
