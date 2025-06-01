import { Patent } from '../types';

interface CompositionRange {
  min: number;
  max: number;
}

interface CompositionData {
  [element: string]: CompositionRange;
}

export class CompositionAnalyzer {
  private static readonly IMPORTANT_ELEMENTS = ['C', 'Si', 'Mn', 'P', 'S', 'Cr', 'Mo', 'Ti', 'Nb', 'V'] as const;
  private static readonly ELEMENT_WEIGHTS: Record<typeof CompositionAnalyzer.IMPORTANT_ELEMENTS[number], number> = {
    C: 1.5,   // 탄소는 매우 중요
    Si: 1.2,  // 실리콘은 중요
    Mn: 1.2,  // 망간은 중요
    P: 0.8,   // 인은 덜 중요
    S: 0.8,   // 황은 덜 중요
    Cr: 1.3,  // 크롬은 매우 중요
    Mo: 1.1,  // 몰리브덴
    Ti: 1.0,  // 티타늄
    Nb: 1.0,  // 니오븀
    V: 1.0    // 바나듐
  };

  public static calculateSimilarity(targetPatent: Patent, priorArtPatent: Patent): number {
    const targetComposition = this.parseComposition(targetPatent.composition);
    const priorArtComposition = this.parseComposition(priorArtPatent.composition);
    
    let totalWeight = 0;
    let weightedSimilarity = 0;
    
    for (const element of this.IMPORTANT_ELEMENTS) {
      const weight = this.ELEMENT_WEIGHTS[element] || 1.0;
      totalWeight += weight;
      
      const targetRange = targetComposition[element];
      const priorArtRange = priorArtComposition[element];
      
      if (targetRange && priorArtRange) {
        const overlapScore = this.calculateRangeOverlap(targetRange, priorArtRange);
        weightedSimilarity += overlapScore * weight;
      }
    }
    
    return (weightedSimilarity / totalWeight) * 100;
  }

  private static parseComposition(composition: any): CompositionData {
    const result: CompositionData = {};
    
    for (const [element, value] of Object.entries(composition)) {
      if (typeof value === 'string') {
        const range = this.parseRange(value);
        if (range) {
          result[element] = range;
        }
      }
    }
    
    return result;
  }

  private static parseRange(value: string): CompositionRange | null {
    // Remove all spaces and % symbols
    const cleanValue = value.replace(/\s+/g, '').replace(/%/g, '');
    
    // Handle different range formats
    const patterns = [
      /^(\d+\.?\d*)-(\d+\.?\d*)$/, // Basic range: 0.5-1.2
      /^≤(\d+\.?\d*)$/, // Upper limit: ≤1.2
      /^<(\d+\.?\d*)$/, // Upper limit: <1.2
      /^≥(\d+\.?\d*)$/, // Lower limit: ≥0.5
      /^>(\d+\.?\d*)$/, // Lower limit: >0.5
      /^(\d+\.?\d*)$/ // Single value: 1.2
    ];

    for (const pattern of patterns) {
      const match = cleanValue.match(pattern);
      if (match) {
        if (match.length === 3) {
          // Range format
          return {
            min: parseFloat(match[1]),
            max: parseFloat(match[2])
          };
        } else if (match.length === 2) {
          const value = parseFloat(match[1]);
          if (cleanValue.startsWith('≤') || cleanValue.startsWith('<')) {
            return { min: 0, max: value };
          } else if (cleanValue.startsWith('≥') || cleanValue.startsWith('>')) {
            return { min: value, max: value * 1.5 }; // Assume reasonable upper limit
          } else {
            // Single value - assume small range around it
            return {
              min: value * 0.95,
              max: value * 1.05
            };
          }
        }
      }
    }
    
    return null;
  }

  private static calculateRangeOverlap(range1: CompositionRange, range2: CompositionRange): number {
    const overlapStart = Math.max(range1.min, range2.min);
    const overlapEnd = Math.min(range1.max, range2.max);
    
    if (overlapEnd < overlapStart) {
      // No overlap
      const gap = overlapStart - overlapEnd;
      const rangeSize = Math.max(range1.max - range1.min, range2.max - range2.min);
      return Math.max(0, 1 - (gap / rangeSize));
    }
    
    const overlap = overlapEnd - overlapStart;
    const range1Size = range1.max - range1.min;
    const range2Size = range2.max - range2.min;
    
    // Calculate Jaccard similarity coefficient
    const union = Math.max(range1.max, range2.max) - Math.min(range1.min, range2.min);
    const overlapRatio = overlap / union;
    
    // Consider range sizes in similarity
    const sizeSimilarity = Math.min(range1Size, range2Size) / Math.max(range1Size, range2Size);
    
    return (overlapRatio * 0.7 + sizeSimilarity * 0.3);
  }
} 