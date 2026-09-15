export type Degree =
  | "B.Tech"
  | "B.E."
  | "BCA"
  | "B.Sc"
  | "BBA"
  | "B.Com"
  | "BA"
  | "Other";

export type Branch =
  | "CSE"
  | "AIML"
  | "Data Science"
  | "IT"
  | "ECE"
  | "EEE"
  | "Mechanical"
  | "Civil"
  | "Chemical"
  | "Biotechnology"
  | "Automobile"
  | "Aerospace"
  | "Biomedical"
  | "Mechatronics"
  | "Robotics"
  | "Other";

export type GradYear = 2026 | 2027 | 2028 | 2029;

export type LanguageCode =
  | "en"
  | "te"
  | "hi"
  | "ta"
  | "kn"
  | "ml"
  | "bn"
  | "mr";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  degree: Degree;
  branch: Branch;
  college: string;
  gradYear: GradYear;
  interests: string[];
  skills: Record<string, SkillLevel>;
  targetCareerId: string | null;
  onboarded: boolean;
  language: LanguageCode;
  createdAt: string;
}

export type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = none, 1 = aware, 2 = beginner, 3 = intermediate, 4 = advanced, 5 = expert

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  0: "None",
  1: "Aware",
  2: "Beginner",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

export interface Career {
  id: string;
  title: string;
  family: string;
  tagline: string;
  /** Degree families this career is realistically open to */
  degrees: Degree[];
  /** Branches where this career is a natural fit (others get a lower affinity, not a ban) */
  branches: Branch[];
  /** Secondary branches — eligible with a note about extra effort */
  openToAllBranches: boolean;
  demand: "High" | "Very High" | "Growing" | "Stable";
  avgSalaryLPA: string;
  requiredSkills: Array<{ name: string; weight: number; level: SkillLevel }>;
  interests: string[];
  projects: string[];
  roadmap: RoadmapStage[];
  whyTemplate: string;
}

export interface RoadmapStage {
  id: string;
  title: string;
  duration: string;
  goals: string[];
  tasks: string[];
  projects: string[];
}

export interface CareerMatch {
  career: Career;
  score: number; // 0-100
  reasons: string[];
  have: string[];
  improving: string[];
  missing: string[];
}

export type ProjectDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface ProjectRec {
  id: string;
  name: string;
  difficulty: ProjectDifficulty;
  technologies: string[];
  skills: string[];
  why: string;
  careers: string[];
  outcome: string;
  steps: string[];
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: Array<{
    label: string;
    interests: string[];
    skills?: Partial<Record<string, SkillLevel>>;
  }>;
}

export interface ResumeAnalysis {
  fileName: string;
  uploadedAt: string;
  resumeScore: number;
  atsScore: number;
  careerAlignment: number;
  wordCount: number;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  missingKeywords: string[];
  suggestions: string[];
  skillsDetected: string[];
  sectionsFound: string[];
  aiSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  at: string;
}

export interface RoadmapProgress {
  stageId: string;
  doneTasks: string[];
}

export interface SkillGapReport {
  target: Career;
  strong: string[];
  improve: Array<{ name: string; level: SkillLevel; needed: SkillLevel }>;
  missing: string[];
  priority: Array<{ name: string; level: SkillLevel; needed: SkillLevel }>;
  readiness: number;
}

export interface AppState {
  userId: string;
  profile: StudentProfile | null;
  matches: CareerMatch[] | null;
  roadmapProgress: RoadmapProgress[];
  resumeAnalysis: ResumeAnalysis | null;
  chat: ChatMessage[];
  selectedProjectIds: string[];
}
