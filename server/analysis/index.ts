import { calculateCompositionSimilarity } from './composition';
import { calculateMicrostructureSimilarity } from './microstructure';
import { calculatePropertiesSimilarity } from './properties';
import { AnalysisWeights, AnalysisScope } from '../types';

// 기본 가중치 설정
const defaultWeights: AnalysisWeights = {
  composition: 40,
  microstructure: 30,
  properties: 30
};

// 분석 범위에 따른 가중치 재조정 함수
function adjustWeights(weights: AnalysisWeights, scope: AnalysisScope): AnalysisWeights {
  const activeCategories = Object.entries(scope).filter(([_, active]) => active);
  if (activeCategories.length === 0) {
    throw new Error('적어도 하나의 분석 범위가 선택되어야 합니다.');
  }

  const totalWeight = activeCategories.reduce((sum, [category]) => 
    sum + weights[category as keyof AnalysisWeights], 0);

  return {
    composition: scope.composition ? (weights.composition / totalWeight) * 100 : 0,
    microstructure: scope.microstructure ? (weights.microstructure / totalWeight) * 100 : 0,
    properties: scope.properties ? (weights.properties / totalWeight) * 100 : 0
  };
}

// 종합 유사도 계산 함수
export function calculateOverallSimilarity(
  target: any,
  candidate: any,
  scope: AnalysisScope = { composition: true, microstructure: true, properties: true },
  weights: AnalysisWeights = defaultWeights
): {
  overallSimilarity: number;
  compositionSimilarity: number;
  microstructureSimilarity: number;
  propertiesSimilarity: number;
} {
  // 가중치 조정
  const adjustedWeights = adjustWeights(weights, scope);

  // 각 카테고리별 유사도 계산
  const compositionSim = scope.composition ? 
    calculateCompositionSimilarity(target.composition, candidate.composition) : 0;

  const microstructureSim = scope.microstructure ? 
    calculateMicrostructureSimilarity(target.microstructure, candidate.microstructure) : 0;

  const propertiesSim = scope.properties ? 
    calculatePropertiesSimilarity(target.properties, candidate.properties) : 0;

  // 종합 유사도 계산
  const overallSim = 
    (compositionSim * adjustedWeights.composition +
     microstructureSim * adjustedWeights.microstructure +
     propertiesSim * adjustedWeights.properties) / 100;

  return {
    overallSimilarity: overallSim,
    compositionSimilarity: compositionSim,
    microstructureSimilarity: microstructureSim,
    propertiesSimilarity: propertiesSim
  };
} 