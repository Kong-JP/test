import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { patentApi } from "@/lib/patent-api";

interface AnalysisProgressProps {
  analysisId: number | null;
}

type ProgressStep = {
  name: string;
  status: "completed" | "in-progress" | "pending";
  progress: number;
};

export function AnalysisProgress({ analysisId }: AnalysisProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([
    { name: "특허 데이터 수집", status: "pending", progress: 0 },
    { name: "유사도 계산", status: "pending", progress: 0 },
    { name: "결과 정리", status: "pending", progress: 0 }
  ]);

  const { data: statusData } = useQuery({
    queryKey: ["/api/analysis", analysisId, "status"],
    queryFn: () => analysisId ? patentApi.getAnalysisStatus(analysisId) : null,
    enabled: !!analysisId,
    refetchInterval: analysisId ? 2000 : false, // Poll every 2 seconds when analysis is running
  });

  useEffect(() => {
    if (!statusData) return;

    const status = statusData.status;
    
    if (status === "pending") {
      setSteps([
        { name: "특허 데이터 수집", status: "pending", progress: 0 },
        { name: "유사도 계산", status: "pending", progress: 0 },
        { name: "결과 정리", status: "pending", progress: 0 }
      ]);
    } else if (status === "in-progress") {
      setSteps([
        { name: "특허 데이터 수집", status: "completed", progress: 100 },
        { name: "유사도 계산", status: "in-progress", progress: 67 },
        { name: "결과 정리", status: "pending", progress: 0 }
      ]);
    } else if (status === "completed") {
      setSteps([
        { name: "특허 데이터 수집", status: "completed", progress: 100 },
        { name: "유사도 계산", status: "completed", progress: 100 },
        { name: "결과 정리", status: "completed", progress: 100 }
      ]);
    }
  }, [statusData]);

  if (!analysisId) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-900">분석 진행상황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700">{step.name}</span>
                  <span className={`
                    ${step.status === "completed" ? "text-green-600" : ""}
                    ${step.status === "in-progress" ? "text-blue-600" : ""}
                    ${step.status === "pending" ? "text-gray-400" : ""}
                  `}>
                    {step.status === "completed" ? "완료" : 
                     step.status === "in-progress" ? "진행중" : "대기중"}
                  </span>
                </div>
                <Progress 
                  value={step.progress} 
                  className={`h-2 ${step.status === "in-progress" ? "animate-pulse" : ""}`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
