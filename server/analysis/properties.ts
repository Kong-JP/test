import { PropertyData } from '../types';

// 물성별 가중치 정의
const propertyWeights = {
  tensileStrength: 10,    // 인장강도
  yieldStrength: 9,      // 항복강도
  elongation: 8,         // 연신율
  hardness: 7,           // 경도
  impact: 7,             // 충격값
  corrosionResistance: 8,// 내식성
  weldability: 7,        // 용접성
  formability: 6,        // 성형성
  default: 5
} as const;

// 수치 범위 추출 함수
function extractNumberRange(value: string | number): { min: number; max: number } | null {
  if (typeof value === 'number') {
    return { min: value, max: value };
  }

  // 숫자 추출
  const numbers = value.match(/-?\d+(\.\d+)?/g);
  if (!numbers) return null;

  const numericValues = numbers.map(Number);
  
  // 단일 값인 경우
  if (numericValues.length === 1) {
    return { min: numericValues[0], max: numericValues[0] };
  }
  
  // 범위값인 경우
  return {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues)
  };
}

// 범위 겹침 계산 함수
function calculateRangeOverlap(range1: { min: number; max: number }, range2: { min: number; max: number }): number {
  const overlapStart = Math.max(range1.min, range2.min);
  const overlapEnd = Math.min(range1.max, range2.max);
  
  if (overlapStart > overlapEnd) {
    return 0;
  }

  const overlap = overlapEnd - overlapStart;
  const range = Math.max(range1.max - range1.min, range2.max - range2.min);
  
  return (overlap / range) * 100;
}

// 텍스트 유사도 계산 함수
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return (intersection.size / union.size) * 100;
}

// 물성 유사도 계산 함수
export function calculatePropertiesSimilarity(target: PropertyData, candidate: PropertyData): number {
  let totalScore = 0;
  let totalWeight = 0;

  // 모든 물성에 대해 반복
  for (const property in target) {
    if (candidate[property]) {
      const weight = propertyWeights[property as keyof typeof propertyWeights] || propertyWeights.default;
      
      const targetValue = target[property];
      const candidateValue = candidate[property];
      
      let similarity = 0;
      
      // 수치형 데이터 처리
      const targetRange = extractNumberRange(targetValue);
      const candidateRange = extractNumberRange(candidateValue);
      
      if (targetRange && candidateRange) {
        similarity = calculateRangeOverlap(targetRange, candidateRange);
      }
      // 텍스트형 데이터 처리
      else if (typeof targetValue === 'string' && typeof candidateValue === 'string') {
        similarity = calculateTextSimilarity(targetValue, candidateValue);
      }
      
      totalScore += similarity * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
} 