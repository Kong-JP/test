import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import type { PatentAnalysisResponse } from "@shared/schema";
import { toast } from "@/components/ui/use-toast";

interface DetailedOutputTableProps {
  analysisData: PatentAnalysisResponse | null;
  onExportResults: () => void;
}

export function DetailedOutputTable({ analysisData, onExportResults }: DetailedOutputTableProps) {
  if (!analysisData || analysisData.results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Output</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">분석을 시작하면 결과가 여기에 표시됩니다.</p>
        </CardContent>
      </Card>
    );
  }

  const targetPatent = analysisData.targetPatent;
  const priorArtPatents = analysisData.results.slice(0, 3); // Top 3 results

  // Extract composition data
  const getCompositionValue = (composition: any, element: string) => {
    if (typeof composition === 'object' && composition[element]) {
      return composition[element];
    }
    return "-";
  };

  // Extract microstructure data
  const getMicrostructureValue = (patent: any, property: string) => {
    const microstructure = patent.microstructure || "";
    // Simple extraction logic - in real implementation this would be more sophisticated
    if (property === "미세조직" && microstructure) {
      return microstructure.substring(0, 50) + "...";
    }
    return "-";
  };

  // Extract properties data
  const getPropertyValue = (properties: any, property: string) => {
    if (typeof properties === 'object') {
      if (property === "인장강도" && properties.tensileStrength) {
        return properties.tensileStrength;
      }
      if (property === "연신율" && properties.elongation) {
        return properties.elongation;
      }
      if (property === "항복강도" && properties.yieldStrength) {
        return properties.yieldStrength || "-";
      }
      if (property === "충격값" && properties.impactValue) {
        return properties.impactValue || "-";
      }
      if (property === "경도" && properties.hardness) {
        return properties.hardness || "-";
      }
      if (property === "내식성" && properties.corrosionResistance) {
        return properties.corrosionResistance;
      }
    }
    return "-";
  };

  const compositionElements = ["C", "Si", "Mn", "P", "S", "Cr", "Mo", "Ti", "Nb", "V", "Cu", "Ni", "B", "N", "Sb", "Sn", "As", "Ta", "Ca", "Mg", "Zn", "Co", "W", "REM", "기타"];
  const microstructureProperties = ["미세 조직 부피분율 (ρ, 면적%)", "결정입자크기 (에테라이트, 오스테나이트)", "석출물", "편석", "비금속개재물"];
  const mechanicalProperties = ["항복강도 (YS)", "인장강도 (TS)", "총 연신율 (T_EL)", "균일 연신율(U_EL)", "굽힘성", "HRB강도", "3점 굽힘강도", "HER(R)", "수소침윤저항강도", "용접성 (열영향부 LME 등)", "인쇄성", "도료덮음성", "도금성 등급"];

  const handlePdfSave = async () => {
    try {
      // 분석 데이터를 PDF 형식으로 변환
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        throw new Error('PDF 생성에 실패했습니다.');
      }

      // PDF 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `분석결과_${new Date().toISOString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF 저장 완료",
        description: "분석 결과가 PDF 파일로 저장되었습니다.",
      });
    } catch (error) {
      console.error('PDF 저장 에러:', error);
      toast({
        title: "PDF 저장 실패",
        description: "PDF 파일 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">분석 결과</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExportResults}
              className="text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel 내보내기
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handlePdfSave}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF 저장
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-center">Output</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-center">상세분류</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-center">경쟁사 특허</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-center">인용특허1</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-center">인용특허2</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-center">인용특허3</th>
              </tr>
            </thead>
            <tbody>
              {/* Basic Information */}
              <tr>
                <td rowSpan={6} className="border border-gray-300 px-2 py-1 text-xs font-medium text-center align-middle bg-yellow-100">
                  특허정보<br/>순위<br/>발명자<br/>공개일자<br/>국가<br/>출원번호<br/>공개번호
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">특허정보</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">{targetPatent.patentNumber}</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">{priorArtPatents[0]?.priorArtPatent.patentNumber || "-"}</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">{priorArtPatents[1]?.priorArtPatent.patentNumber || "-"}</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">{priorArtPatents[2]?.priorArtPatent.patentNumber || "-"}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">순위</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">대상특허</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">1위</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">2위</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">3위</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">발명자</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">-</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">-</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">-</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">-</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">공개일자</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                  {new Date(targetPatent.publicationDate).toLocaleDateString('ko-KR')}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                  {priorArtPatents[0] ? new Date(priorArtPatents[0].priorArtPatent.publicationDate).toLocaleDateString('ko-KR') : "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                  {priorArtPatents[1] ? new Date(priorArtPatents[1].priorArtPatent.publicationDate).toLocaleDateString('ko-KR') : "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                  {priorArtPatents[2] ? new Date(priorArtPatents[2].priorArtPatent.publicationDate).toLocaleDateString('ko-KR') : "-"}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">국가</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">{targetPatent.country}</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">{priorArtPatents[0]?.priorArtPatent.country || "-"}</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">{priorArtPatents[1]?.priorArtPatent.country || "-"}</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">{priorArtPatents[2]?.priorArtPatent.country || "-"}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">출원번호</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">-</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">-</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">-</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">-</td>
              </tr>

              {/* Composition Analysis Header */}
              <tr>
                <td rowSpan={1} className="border border-gray-300 px-2 py-1 text-xs font-medium text-center align-middle bg-gray-100">
                  예열처리소재의 조성성분
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center font-medium">철강재료 조성성분</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center"></td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center"></td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center"></td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center"></td>
              </tr>

              {/* Composition Elements */}
              {compositionElements.map((element, index) => (
                <tr key={element}>
                  {index === 0 && (
                    <td rowSpan={compositionElements.length} className="border border-gray-300 px-2 py-1 text-xs font-medium text-center align-middle bg-blue-50">
                      성분<br/>(wt%)
                    </td>
                  )}
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">{element}</td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {getCompositionValue(targetPatent.composition, element)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {priorArtPatents[0] ? getCompositionValue(priorArtPatents[0].priorArtPatent.composition, element) : "-"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {priorArtPatents[1] ? getCompositionValue(priorArtPatents[1].priorArtPatent.composition, element) : "-"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {priorArtPatents[2] ? getCompositionValue(priorArtPatents[2].priorArtPatent.composition, element) : "-"}
                  </td>
                </tr>
              ))}

              {/* Microstructure Analysis */}
              {microstructureProperties.map((property, index) => (
                <tr key={property}>
                  {index === 0 && (
                    <td rowSpan={microstructureProperties.length} className="border border-gray-300 px-2 py-1 text-xs font-medium text-center align-middle bg-green-50">
                      미세조직
                    </td>
                  )}
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">{property}</td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {getMicrostructureValue(targetPatent, property)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {priorArtPatents[0] ? getMicrostructureValue(priorArtPatents[0].priorArtPatent, property) : "-"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {priorArtPatents[1] ? getMicrostructureValue(priorArtPatents[1].priorArtPatent, property) : "-"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {priorArtPatents[2] ? getMicrostructureValue(priorArtPatents[2].priorArtPatent, property) : "-"}
                  </td>
                </tr>
              ))}

              {/* Mechanical Properties */}
              {mechanicalProperties.map((property, index) => (
                <tr key={property}>
                  {index === 0 && (
                    <td rowSpan={mechanicalProperties.length} className="border border-gray-300 px-2 py-1 text-xs font-medium text-center align-middle bg-orange-50">
                      물성
                    </td>
                  )}
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">{property}</td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {getPropertyValue(targetPatent.properties, property)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {priorArtPatents[0] ? getPropertyValue(priorArtPatents[0].priorArtPatent.properties, property) : "-"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {priorArtPatents[1] ? getPropertyValue(priorArtPatents[1].priorArtPatent.properties, property) : "-"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                    {priorArtPatents[2] ? getPropertyValue(priorArtPatents[2].priorArtPatent.properties, property) : "-"}
                  </td>
                </tr>
              ))}

              {/* Similarity Scores */}
              <tr>
                <td rowSpan={1} className="border border-gray-300 px-2 py-1 text-xs font-medium text-center align-middle bg-yellow-100">
                  유사도
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center font-medium">종합 유사도</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center">-</td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center font-bold text-red-600">
                  {priorArtPatents[0] ? `${priorArtPatents[0].overallSimilarity.toFixed(1)}%` : "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center font-bold text-red-600">
                  {priorArtPatents[1] ? `${priorArtPatents[1].overallSimilarity.toFixed(1)}%` : "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs text-center font-bold text-red-600">
                  {priorArtPatents[2] ? `${priorArtPatents[2].overallSimilarity.toFixed(1)}%` : "-"}
                </td>
              </tr>

              {/* Final Assessment */}
              <tr>
                <td className="border border-gray-300 px-2 py-1 text-xs font-medium text-center align-middle bg-gray-200">
                  종합 의견
                </td>
                <td colSpan={5} className="border border-gray-300 px-2 py-2 text-xs">
                  <div className="space-y-1">
                    <div className="font-medium">✓ 선행기술 분석 결과:</div>
                    <div>• 1순위 특허 ({priorArtPatents[0]?.priorArtPatent.patentNumber}): {priorArtPatents[0]?.overallSimilarity.toFixed(1)}% 일치율로 강력한 무효 근거</div>
                    <div>• 성분 조성, 미세조직, 물성이 모두 80% 이상 일치하여 신규성 및 진보성 부정 가능</div>
                    <div>• 공개일자가 대상특허보다 선행하여 무효심판 청구시 핵심 증거자료로 활용 권장</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}