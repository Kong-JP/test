import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { insertAnalysisRequestSchema } from "@shared/schema";
import { toast } from "@/components/ui/use-toast";

const analysisFormSchema = insertAnalysisRequestSchema.extend({
  analysisScope: z.object({
    composition: z.boolean(),
    microstructure: z.boolean(),
    properties: z.boolean()
  }).refine(data => data.composition || data.microstructure || data.properties, {
    message: "최소 하나의 분석 범위를 선택해주세요"
  })
}).omit({
  publicationDate: true
});

type AnalysisFormData = z.infer<typeof analysisFormSchema>;

interface AnalysisFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function AnalysisForm({ onSubmit, isLoading = false }: AnalysisFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      targetPatentNumber: "US 9,708,683 B2",
      minMatchRate: 80,
      analysisScope: {
        composition: true,
        microstructure: true,
        properties: true
      }
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "오류",
        description: "PDF 파일만 업로드할 수 있습니다.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (data: AnalysisFormData) => {
    try {
      // 먼저 분석 요청을 제출
      const analysisResponse = await onSubmit(data);

      // 파일이 선택되었다면 업로드
      if (selectedFile && analysisResponse.id) {
        const formData = new FormData();
        formData.append("pdf", selectedFile);
        formData.append("patentId", analysisResponse.id.toString());

        const response = await fetch("/api/upload-pdf", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          throw new Error("파일 업로드에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "오류",
        description: "분석 요청 또는 파일 업로드에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">특허 분석 설정</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetPatentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">대상 특허번호</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: US 9,708,683 B2" 
                      className="text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minMatchRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">최소 일치율 (%)</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value?.toString()} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80">80% 이상</SelectItem>
                        <SelectItem value="85">85% 이상</SelectItem>
                        <SelectItem value="90">90% 이상</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel className="text-sm font-medium text-gray-700">분석 범위</FormLabel>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="analysisScope.composition"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-gray-700">성분 분석</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="analysisScope.microstructure"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-gray-700">미세조직 분석</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="analysisScope.properties"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-gray-700">물성 분석</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              {form.formState.errors.analysisScope && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.analysisScope.message}
                </p>
              )}
            </div>

            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">PDF 파일 업로드</FormLabel>
              <FormControl>
                <Input 
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="text-sm"
                />
              </FormControl>
              <p className="text-sm text-gray-500">PDF 파일만 업로드할 수 있습니다.</p>
            </FormItem>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "분석 중..." : "분석 시작"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
