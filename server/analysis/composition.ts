import { ElementWeights, RangeValue, CompositionData } from '../types';

// 원소별 가중치 정의
export const elementWeights: ElementWeights = {
  C: 10,    // 탄소: 기계적 성질에 매우 중요
  Si: 7,    // 규소: 탈산제로서 중요
  Mn: 8,    // 망간: 강도와 인성에 중요
  P: 5,     // 인: 불순물이지만 영향도 고려
  S: 5,     // 황: 불순물이지만 영향도 고려
  Cr: 9,    // 크롬: 내식성에 매우 중요
  Mo: 8,    // 몰리브덴: 고온강도에 중요
  Ni: 9,    // 니켈: 인성과 내식성에 중요
  V: 7,     // 바나듐: 결정립 미세화
  Ti: 7,    // 티타늄: 결정립 미세화
  Nb: 7,    // 니오븀: 결정립 미세화
  B: 6,     // 보론: 소량으로도 큰 영향
  N: 6,     // 질소: 강도에 영향
  Cu: 7,    // 구리: 내식성에 영향
  Al: 6,    // 알루미늄: 탈산과 결정립 미세화
  W: 7,     // 텅스텐: 고온강도
  Co: 7,    // 코발트: 고온강도
  default: 5 // 기타 원소 기본 가중치
};

// 범위값 파싱 함수
export function parseRange(value: string): RangeValue {
  // ≤, ≥, <, > 등 다양한 부등호 처리
  const operators = {
    '≤': '<=',
    '≥': '>=',
    '<': '<',
    '>': '>',
    '~': 'range'
  };

  let operator = 'range';
  let min = 0;
  let max = 0;

  // "balance" 처리
  if (value.toLowerCase().includes('balance')) {
    return { type: 'balance' };
  }

  // 부등호 처리
  for (const [symbol, op] of Object.entries(operators)) {
    if (value.includes(symbol)) {
      operator = op;
      const numStr = value.replace(symbol, '').replace('%', '').trim();
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        if (op === '<=' || op === '<') {
          max = num;
          min = 0;
        } else if (op === '>=' || op === '>') {
          min = num;
          max = 100;
        }
      }
      return { type: operator, min, max };
    }
  }

  // 범위 처리 (예: "0.1-0.3%" 또는 "0.1~0.3%")
  const rangeMatch = value.match(/([\d.]+)(?:-|~)([\d.]+)/);
  if (rangeMatch) {
    min = parseFloat(rangeMatch[1]);
    max = parseFloat(rangeMatch[2]);
    return { type: 'range', min, max };
  }

  // 단일 값 처리
  const singleValue = parseFloat(value.replace('%', ''));
  if (!isNaN(singleValue)) {
    return { type: 'exact', value: singleValue };
  }

  return { type: 'unknown' };
}

// 범위 겹침 계산 함수
export function calculateRangeOverlap(range1: RangeValue, range2: RangeValue): number {
  if (range1.type === 'unknown' || range2.type === 'unknown') {
    return 0;
  }

  if (range1.type === 'balance' && range2.type === 'balance') {
    return 100;
  }

  if (range1.type === 'exact' && range2.type === 'exact') {
    return range1.value === range2.value ? 100 : 0;
  }

  let min1: number, max1: number, min2: number, max2: number;

  // range1 처리
  if (range1.type === 'exact') {
    min1 = max1 = range1.value;
  } else if (range1.type === 'range' || range1.type === '<=' || range1.type === '>=') {
    min1 = range1.min;
    max1 = range1.max;
  } else {
    return 0;
  }

  // range2 처리
  if (range2.type === 'exact') {
    min2 = max2 = range2.value;
  } else if (range2.type === 'range' || range2.type === '<=' || range2.type === '>=') {
    min2 = range2.min;
    max2 = range2.max;
  } else {
    return 0;
  }

  // 겹침 계산
  const overlapStart = Math.max(min1, min2);
  const overlapEnd = Math.min(max1, max2);
  
  if (overlapStart > overlapEnd) {
    return 0;
  }

  const overlap = overlapEnd - overlapStart;
  const range = Math.max(max1 - min1, max2 - min2);
  
  return (overlap / range) * 100;
}

// 성분 유사도 계산 함수
export function calculateCompositionSimilarity(target: CompositionData, candidate: CompositionData): number {
  let totalWeight = 0;
  let weightedSimilarity = 0;
  
  // 모든 원소에 대해 반복
  const allElements = new Set([...Object.keys(target), ...Object.keys(candidate)]);
  
  for (const element of allElements) {
    // 원소가 둘 다 있는 경우만 비교
    if (target[element] && candidate[element]) {
      const weight = elementWeights[element] || elementWeights.default;
      const range1 = parseRange(target[element]);
      const range2 = parseRange(candidate[element]);
      
      const similarity = calculateRangeOverlap(range1, range2);
      weightedSimilarity += similarity * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? (weightedSimilarity / totalWeight) : 0;
} 