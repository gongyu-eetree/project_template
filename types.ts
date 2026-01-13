export enum RiskLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Task {
  name: string;
  description: string;
  output: string;
  role: string;
  dependencies?: string[];
}

export interface Phase {
  name: string;
  goal: string;
  keyOutput: string;
  isMilestone: boolean;
  tasks: Task[];
}

export interface PhaseDuration {
  phaseName: string;
  days: number;
}

export interface TeamMember {
  role: string;
  count: number;
}

export interface Risk {
  description: string;
  impactPhase: string;
  level: RiskLevel;
  strategy: string;
}

export interface TemplateInfo {
  name: string;
  type: string;
  iconSuggestion: string;
  scenario: string;
  features: string[];
}

export interface UsageGuide {
  suitability: string;
  notes: string;
  complexity: string;
}

export interface Estimates {
  totalDuration: string;
  phaseDurations: PhaseDuration[];
  teamStructure: TeamMember[];
}

export interface HardwareSpecs {
  scheme: string;
  components: string[];
  designPoints: string[];
}

export interface SoftwareSpecs {
  languages: string[];
  frameworks: string[];
  architecture: string;
}

export interface TechnicalSolution {
  hardware?: HardwareSpecs;
  software?: SoftwareSpecs;
}

export interface ProjectTemplate {
  basicInfo: TemplateInfo;
  technicalSolution?: TechnicalSolution;
  phases: Phase[];
  estimates: Estimates;
  risks: Risk[];
  usage: UsageGuide;
}