import { MicrostructureData } from '../types';

// 미세조직 키워드 가중치
const phaseWeights = {
  'austenite': 10,
  'ferrite': 10,
  'martensite': 9,
  'bainite': 9,
  'pearlite': 8,
  'cementite': 8,
  'carbide': 7,
  'nitride': 7,
  'sigma': 6,
  'delta': 6,
  default: 5
};

// 결정립 크기 범위 매칭 함수
function matchGrainSize(size1: string, size2: string): number {
  const extractNumber = (str: string): number[] => {
    const matches = str.match(/\d+(\.\d+)?/g);
    return matches ? matches.map(Number) : [];
  };

  const numbers1 = extractNumber(size1);
  const numbers2 = extractNumber(size2);

  if (numbers1.length === 0 || numbers2.length === 0) {
    return 0;
  }

  const avg1 = numbers1.reduce((a, b) => a + b) / numbers1.length;
  const avg2 = numbers2.reduce((a, b) => a + b) / numbers2.length;
  
  // 결정립 크기 차이에 따른 유사도 계산
  const diff = Math.abs(avg1 - avg2);
  const maxSize = Math.max(avg1, avg2);
  
  return Math.max(0, (1 - diff / maxSize)) * 100;
}

// Jaccard 유사도 계산
function calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return (intersection.size / union.size) * 100;
}

// 미세조직 유사도 계산 함수
export function calculateMicrostructureSimilarity(
  target: MicrostructureData,
  candidate: MicrostructureData
): number {
  let totalScore = 0;
  let totalWeight = 0;

  // 상(Phase) 분석 (70% 가중치)
  const phaseWeight = 70;
  if (target.phases && candidate.phases) {
    let phaseScore = 0;
    let phaseCount = 0;
    
    for (const phase in target.phases) {
      if (candidate.phases[phase]) {
        const weight = phaseWeights[phase.toLowerCase()] || phaseWeights.default;
        const volumeMatch = matchGrainSize(target.phases[phase], candidate.phases[phase]);
        phaseScore += volumeMatch * weight;
        phaseCount += weight;
      }
    }
    
    if (phaseCount > 0) {
      totalScore += (phaseScore / phaseCount) * phaseWeight;
      totalWeight += phaseWeight;
    }
  }

  // 결정립 크기 분석 (15% 가중치)
  const grainSizeWeight = 15;
  if (target.grainSize && candidate.grainSize) {
    const grainSizeScore = matchGrainSize(target.grainSize, candidate.grainSize);
    totalScore += grainSizeScore * grainSizeWeight;
    totalWeight += grainSizeWeight;
  }

  // 석출물 분석 (15% 가중치)
  const precipitatesWeight = 15;
  if (target.precipitates && candidate.precipitates) {
    const targetSet = new Set(target.precipitates.map(p => p.toLowerCase()));
    const candidateSet = new Set(candidate.precipitates.map(p => p.toLowerCase()));
    
    const precipitateScore = calculateJaccardSimilarity(targetSet, candidateSet);
    totalScore += precipitateScore * precipitatesWeight;
    totalWeight += precipitatesWeight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
} 