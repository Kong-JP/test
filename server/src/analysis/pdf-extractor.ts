import { Patent } from '../types';
import * as pdfjs from 'pdfjs-dist';

interface ExtractedData {
  composition?: { [key: string]: string };
  microstructure?: string;
  properties?: {
    tensileStrength?: string;
    elongation?: string;
    yieldStrength?: string;
    impactValue?: string;
    hardness?: string;
    corrosionResistance?: string;
  };
}

export class PDFExtractor {
  private static readonly COMPOSITION_PATTERNS = {
    C: /탄소|C\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/,
    Si: /규소|실리콘|Si\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/,
    Mn: /망간|Mn\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/,
    P: /인|P\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/,
    S: /황|S\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/,
    Cr: /크롬|Cr\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/,
    Mo: /몰리브덴|Mo\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/,
    Ti: /티타늄|Ti\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/,
    Nb: /니오븀|Nb\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/,
    V: /바나듐|V\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%|wt%|중량%)?/
  };

  private static readonly MICROSTRUCTURE_PATTERNS = [
    /미세\s*조직\s*[:：]?\s*([^.]*)/,
    /미세\s*구조\s*[:：]?\s*([^.]*)/,
    /조직\s*구성\s*[:：]?\s*([^.]*)/
  ];

  private static readonly PROPERTY_PATTERNS = {
    tensileStrength: /인장\s*강도|tensile\s*strength\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(MPa|kgf\/mm²)?/i,
    elongation: /연신율|elongation\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(%)?/i,
    yieldStrength: /항복\s*강도|yield\s*strength\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(MPa|kgf\/mm²)?/i,
    impactValue: /충격\s*값|impact\s*value\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(J|kgf·m)?/i,
    hardness: /경도|hardness\s*[:：]?\s*([\d.]+\s*[-~]\s*[\d.]+|[<>≤≥]?\s*[\d.]+)\s*(HV|HB|HRC)?/i,
    corrosionResistance: /내식성|corrosion\s*resistance\s*[:：]?\s*([^.]*)/i
  };

  public static async extractFromPDF(pdfPath: string): Promise<ExtractedData> {
    const doc = await pdfjs.getDocument(pdfPath).promise;
    const numPages = doc.numPages;
    let extractedText = '';

    // PDF의 모든 페이지에서 텍스트 추출
    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      extractedText += pageText + ' ';
    }

    return {
      composition: this.extractComposition(extractedText),
      microstructure: this.extractMicrostructure(extractedText),
      properties: this.extractProperties(extractedText)
    };
  }

  private static extractComposition(text: string): { [key: string]: string } {
    const composition: { [key: string]: string } = {};
    
    for (const [element, pattern] of Object.entries(this.COMPOSITION_PATTERNS)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        composition[element] = this.normalizeValue(match[1]);
      }
    }

    return composition;
  }

  private static extractMicrostructure(text: string): string {
    for (const pattern of this.MICROSTRUCTURE_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  }

  private static extractProperties(text: string): ExtractedData['properties'] {
    const properties: ExtractedData['properties'] = {};
    
    for (const [property, pattern] of Object.entries(this.PROPERTY_PATTERNS)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        properties[property as keyof ExtractedData['properties']] = this.normalizeValue(match[1]);
      }
    }

    return properties;
  }

  private static normalizeValue(value: string): string {
    // 값 정규화 (공백 제거, 단위 통일 등)
    return value.trim()
      .replace(/\s+/g, '')  // 공백 제거
      .replace(/，/g, ',')  // 전각 쉼표를 반각으로
      .replace(/．/g, '.')  // 전각 점을 반각으로
      .replace(/~/g, '-');  // 물결표를 하이픈으로
  }
} 