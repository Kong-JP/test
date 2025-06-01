import { Patent } from '../types';
import { CompositionAnalyzer } from './composition-analyzer';

interface SimilarityResult {
  overallSimilarity: number;
  compositionSimilarity: number;
  microstructureSimilarity: number;
  propertiesSimilarity: number;
  details: {
    composition: { [element: string]: number };
    microstructure: { [feature: string]: number };
    properties: { [property: string]: number };
  };
}

export class SimilarityCalculator {
  // 각 항목별 가중치
  private static readonly WEIGHTS = {
    composition: 0.5,      // 성분이 가장 중요
    microstructure: 0.3,   // 미세조직은 두 번째로 중요
    properties: 0.2        // 물성은 세 번째로 중요
  };

  // 미세조직 관련 키워드
  private static readonly MICROSTRUCTURE_KEYWORDS = [
    'ferrite', 'austenite', 'pearlite', 'martensite', 'bainite',
    '페라이트', '오스테나이트', '펄라이트', '마르텐사이트', '베이나이트',
    '결정립', '석출물', '개재물', '입계', '입내'
  ];

  public static calculateSimilarity(targetPatent: Patent, priorArtPatent: Patent): SimilarityResult {
    // 성분 유사도 계산
    const compositionSimilarity = CompositionAnalyzer.calculateSimilarity(targetPatent, priorArtPatent);
    
    // 미세조직 유사도 계산
    const microstructureSimilarity = this.calculateMicrostructureSimilarity(
      targetPatent.microstructure,
      priorArtPatent.microstructure
    );
    
    // 물성 유사도 계산
    const propertiesSimilarity = this.calculatePropertiesSimilarity(
      targetPatent.properties,
      priorArtPatent.properties
    );

    // 전체 유사도 계산 (가중 평균)
    const overallSimilarity = 
      compositionSimilarity * this.WEIGHTS.composition +
      microstructureSimilarity * this.WEIGHTS.microstructure +
      propertiesSimilarity * this.WEIGHTS.properties;

    return {
      overallSimilarity,
      compositionSimilarity,
      microstructureSimilarity,
      propertiesSimilarity,
      details: {
        composition: this.getCompositionDetails(targetPatent, priorArtPatent),
        microstructure: this.getMicrostructureDetails(targetPatent.microstructure, priorArtPatent.microstructure),
        properties: this.getPropertiesDetails(targetPatent.properties, priorArtPatent.properties)
      }
    };
  }

  private static calculateMicrostructureSimilarity(target: string, priorArt: string): number {
    if (!target || !priorArt) return 0;

    // 텍스트 전처리
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    };

    const targetText = normalizeText(target);
    const priorArtText = normalizeText(priorArt);

    // 키워드 기반 유사도 계산
    let matchCount = 0;
    let totalKeywords = 0;

    for (const keyword of this.MICROSTRUCTURE_KEYWORDS) {
      const targetHasKeyword = targetText.includes(keyword);
      const priorArtHasKeyword = priorArtText.includes(keyword);

      if (targetHasKeyword || priorArtHasKeyword) {
        totalKeywords++;
        if (targetHasKeyword && priorArtHasKeyword) {
          matchCount++;
        }
      }
    }

    return totalKeywords > 0 ? (matchCount / totalKeywords) * 100 : 0;
  }

  private static calculatePropertiesSimilarity(
    targetProps: Patent['properties'],
    priorArtProps: Patent['properties']
  ): number {
    if (!targetProps || !priorArtProps) return 0;

    const properties = [
      'tensileStrength',
      'elongation',
      'yieldStrength',
      'impactValue',
      'hardness',
      'corrosionResistance'
    ];

    let totalScore = 0;
    let totalProperties = 0;

    for (const prop of properties) {
      const targetValue = targetProps[prop];
      const priorArtValue = priorArtProps[prop];

      if (targetValue && priorArtValue) {
        totalProperties++;
        totalScore += this.comparePropertyValues(targetValue, priorArtValue);
      }
    }

    return totalProperties > 0 ? (totalScore / totalProperties) * 100 : 0;
  }

  private static comparePropertyValues(target: string, priorArt: string): number {
    // 숫자 범위 추출
    const extractRange = (value: string) => {
      const numbers = value.match(/[\d.]+/g);
      if (!numbers) return null;
      
      if (numbers.length === 1) {
        const num = parseFloat(numbers[0]);
        return { min: num * 0.95, max: num * 1.05 };
      }
      
      return {
        min: Math.min(...numbers.map(n => parseFloat(n))),
        max: Math.max(...numbers.map(n => parseFloat(n)))
      };
    };

    const targetRange = extractRange(target);
    const priorArtRange = extractRange(priorArt);

    if (!targetRange || !priorArtRange) {
      // 숫자가 없는 경우 텍스트 기반 비교
      return target.toLowerCase() === priorArt.toLowerCase() ? 1 : 0;
    }

    // 범위 겹침 계산
    const overlapStart = Math.max(targetRange.min, priorArtRange.min);
    const overlapEnd = Math.min(targetRange.max, priorArtRange.max);

    if (overlapEnd < overlapStart) {
      // 겹치지 않는 경우
      const gap = overlapStart - overlapEnd;
      const rangeSize = Math.max(
        targetRange.max - targetRange.min,
        priorArtRange.max - priorArtRange.min
      );
      return Math.max(0, 1 - (gap / rangeSize));
    }

    // 겹치는 경우
    const overlap = overlapEnd - overlapStart;
    const union = Math.max(targetRange.max, priorArtRange.max) -
                 Math.min(targetRange.min, priorArtRange.min);

    return overlap / union;
  }

  private static getCompositionDetails(target: Patent, priorArt: Patent): { [element: string]: number } {
    const details: { [element: string]: number } = {};
    const analyzer = new CompositionAnalyzer();
    
    // CompositionAnalyzer의 결과를 요소별로 분해
    for (const element of Object.keys(target.composition)) {
      if (target.composition[element] && priorArt.composition[element]) {
        details[element] = this.comparePropertyValues(
          target.composition[element],
          priorArt.composition[element]
        ) * 100;
      }
    }
    
    return details;
  }

  private static getMicrostructureDetails(target: string, priorArt: string): { [feature: string]: number } {
    const details: { [feature: string]: number } = {};
    
    for (const keyword of this.MICROSTRUCTURE_KEYWORDS) {
      const targetHas = target.toLowerCase().includes(keyword);
      const priorArtHas = priorArt.toLowerCase().includes(keyword);
      
      if (targetHas || priorArtHas) {
        details[keyword] = (targetHas && priorArtHas) ? 100 : 0;
      }
    }
    
    return details;
  }

  private static getPropertiesDetails(
    targetProps: Patent['properties'],
    priorArtProps: Patent['properties']
  ): { [property: string]: number } {
    const details: { [property: string]: number } = {};
    
    for (const prop of Object.keys(targetProps)) {
      if (targetProps[prop] && priorArtProps[prop]) {
        details[prop] = this.comparePropertyValues(
          targetProps[prop],
          priorArtProps[prop]
        ) * 100;
      }
    }
    
    return details;
  }
} 