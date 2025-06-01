export interface Patent {
  id: number;
  patentNumber: string;
  title: string;
  publicationDate: Date;
  composition: {
    [element: string]: string;
  };
  microstructure: string;
  properties: {
    tensileStrength?: string;
    elongation?: string;
    yieldStrength?: string;
    impactValue?: string;
    hardness?: string;
    corrosionResistance?: string;
  };
  abstract: string;
  claims: string;
  country: string;
} 