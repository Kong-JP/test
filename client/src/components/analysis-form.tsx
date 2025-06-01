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
import { Search, Upload } from "lucide-react";
import { insertAnalysisRequestSchema } from "@shared/schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const analysisFormSchema = insertAnalysisRequestSchema.extend({
  analysisScope: z.object({
    composition: z.boolean(),
    microstructure: z.boolean(),
    properties: z.boolean()
  }).refine(data => data.composition || data.microstructure || data.properties, {
    message: "최소 하나의 분석 범위를 선택해주세요"
  }),
  competitorPatentPdf: z
    .instanceof(FileList)
    .refine((files) => files.length === 0 || files.length === 1, "파일은 1개만 업로드 가능합니다.")
    .refine(
      (files) => files.length === 0 || files[0]?.size <= MAX_FILE_SIZE,
      "파일 크기는 10MB를 초과할 수 없습니다."
    )
    .refine(
      (files) => files.length === 0 || files[0]?.type === "application/pdf",
      "PDF 파일만 업로드 가능합니다."
    )
    .optional()
}).omit({
  publicationDate: true
});

type AnalysisFormData = z.infer<typeof analysisFormSchema>;

interface AnalysisFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function AnalysisForm({ onSubmit, isLoading = false }: AnalysisFormProps) {
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

  const handleSubmit = (data: AnalysisFormData) => {
    const formattedData = {
      ...data,
      publicationDate: new Date("2017-07-18") // Default publication date for target patent
    };
    onSubmit(formattedData);
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
              name="competitorPatentPdf"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">경쟁사 특허 PDF</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => onChange(e.target.files)}
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        {...field}
                      />
                      {value instanceof FileList && value.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onChange(new FileList())}
                          className="text-red-600 hover:text-red-700"
                        >
                          삭제
                        </Button>
                      )}
                    </div>
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

            <Button 
              type="submit" 
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? "분석 중..." : "선행기술 분석 시작"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
