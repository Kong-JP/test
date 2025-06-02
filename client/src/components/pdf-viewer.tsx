import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PdfViewerProps {
  patentId: number;
}

interface PdfFile {
  id: number;
  filename: string;
  originalName: string;
  path: string;
}

export function PdfViewer({ patentId }: PdfViewerProps) {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<PdfFile | null>(null);

  useEffect(() => {
    const fetchPdfFiles = async () => {
      try {
        const response = await fetch(`/api/patents/${patentId}/pdf-files`);
        if (response.ok) {
          const files = await response.json();
          setPdfFiles(files);
          if (files.length > 0) {
            setSelectedFile(files[0]);
          }
        }
      } catch (error) {
        console.error("PDF 파일 조회 실패:", error);
      }
    };

    if (patentId) {
      fetchPdfFiles();
    }
  }, [patentId]);

  if (pdfFiles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">PDF 문서</CardTitle>
      </CardHeader>
      <CardContent>
        {pdfFiles.length > 1 && (
          <div className="mb-4">
            <select
              className="w-full p-2 border rounded"
              value={selectedFile?.id}
              onChange={(e) => {
                const file = pdfFiles.find(f => f.id === parseInt(e.target.value));
                if (file) {
                  setSelectedFile(file);
                }
              }}
            >
              {pdfFiles.map(file => (
                <option key={file.id} value={file.id}>
                  {file.originalName}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {selectedFile && (
          <div className="w-full aspect-[4/3] relative">
            <iframe
              src={`/uploads/${selectedFile.filename}`}
              className="w-full h-full border-0"
              title="PDF 뷰어"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 