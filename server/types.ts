// 원소별 가중치 타입
export interface ElementWeights {
  [element: string]: number;
}

// 범위값 타입
export type RangeValue = 
  | { type: 'exact'; value: number }
  | { type: 'range'; min: number; max: number }
  | { type: 'balance' }
  | { type: 'unknown' }
  | { type: '<='; min: number; max: number }
  | { type: '>='; min: number; max: number }
  | { type: '<'; min: number; max: number }
  | { type: '>'; min: number; max: number };

// 성분 데이터 타입
export interface CompositionData {
  [element: string]: string;
}

// 미세조직 데이터 타입
export interface MicrostructureData {
  phases: { [phase: string]: string };
  grainSize?: string;
  precipitates?: string[];
  other?: { [key: string]: string };
}

// 물성 데이터 타입
export interface PropertyData {
  [property: string]: string | number;
}

// 가중치 설정 타입
export interface AnalysisWeights {
  composition: number;
  microstructure: number;
  properties: number;
}

// 분석 범위 타입
export interface AnalysisScope {
  composition: boolean;
  microstructure: boolean;
  properties: boolean;
} 