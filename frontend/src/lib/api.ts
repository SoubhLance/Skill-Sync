import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenGetter: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  tokenGetter = getter;
};

// Request Interceptor to attach Firebase Bearer Token
apiClient.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Failed to attach Firebase token to request", e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// TypeScript API Response Interfaces matching backend schemas exactly
export interface JobMatch {
  job_id: number;
  job_role: string;
  domain: string;
  experience_label: string;
  experience_level: number;
  skills: string;
  skills_list: string[];
  projects: string;
  companies: string;
  salary_range: string;
  salary_min: number;
  salary_max: number;
  salary_avg: number;
  has_salary_data: boolean;
  skill_count: number;
  semantic_score: number;
  blended_score: number;
  skill_overlap: string[];
  skill_gap: string[];
  match_pct: number;
}

export interface RecommendResponse {
  matches: JobMatch[];
  candidate_skills: string[];
  query_ms: number;
  total_jobs: number;
  weights: Record<string, number>;
  student_track: string;
}

export interface ProfileExtractResponse {
  github?: {
    username: string;
    repos: number;
    stars: number;
    languages: string[];
  } | null;
  leetcode?: {
    username: string;
    solved: number;
    easy: number;
    medium: number;
    hard: number;
    ranking: number;
  } | null;
  codechef?: {
    username: string;
    rating: number;
    stars: string;
    global_rank: number;
  } | null;
  hackerrank?: {
    username: string;
    badges: number;
    stars: number;
  } | null;
  profile_score: number;
  base_score: number;
  bonus_applied: Record<string, any>;
  active_platforms: string[];
}

export interface JDMatchResponse {
  match_percent: number;
  skill_overlap: string[];
  skill_gap: string[];
}

export interface HealthResponse {
  status: string;
  model_id: string;
  dimensions: number;
  jobs_indexed: number;
  device: string;
  version: string;
}

export interface ExtractSkillsResponse {
  all_skills: string[];
  primary_skills: string[];
  secondary_skills: string[];
  skill_count: number;
  github_url?: string;
  linkedin_url?: string;
  leetcode_url?: string;
}

// Backend API Service Functions
export const api = {
  getHealth: async (): Promise<HealthResponse> => {
    const res = await apiClient.get<HealthResponse>('/health');
    return res.data;
  },

  getDomains: async (): Promise<string[]> => {
    const res = await apiClient.get<string[]>('/recommend/domains');
    return res.data;
  },

  getJobs: async (params?: { domain?: string; limit?: number }): Promise<JobMatch[]> => {
    const res = await apiClient.get<JobMatch[]>('/recommend/jobs', { params });
    return res.data;
  },

  recommendSkills: async (skills: string, top_k = 10, profile_score = 0.0, domain_filter?: string): Promise<RecommendResponse> => {
    const res = await apiClient.post<RecommendResponse>('/recommend', {
      skills,
      top_k,
      profile_score,
      domain_filter,
    });
    return res.data;
  },

  recommendResumeText: async (resume_text: string, top_k = 10, profile_score = 0.0, domain_filter?: string): Promise<RecommendResponse> => {
    const res = await apiClient.post<RecommendResponse>('/recommend/resume', {
      resume_text,
      top_k,
      profile_score,
      domain_filter,
    });
    return res.data;
  },

  recommendPdf: async (file: File, top_k = 10, profile_score = 0.0, domain_filter?: string): Promise<RecommendResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (top_k) formData.append('top_k', top_k.toString());
    if (profile_score) formData.append('profile_score', profile_score.toString());
    if (domain_filter) formData.append('domain_filter', domain_filter);

    const res = await apiClient.post<RecommendResponse>('/recommend/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  extractSkillsText: async (text: string): Promise<ExtractSkillsResponse> => {
    const res = await apiClient.post<ExtractSkillsResponse>('/extract-skills', { text });
    return res.data;
  },

  extractSkillsPdf: async (file: File): Promise<ExtractSkillsResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ExtractSkillsResponse>('/extract-skills/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  extractProfile: async (payload: {
    github?: string;
    leetcode?: string;
    codechef?: string;
    hackerrank?: string;
    hackathon_wins?: number;
    papers_published?: number;
  }): Promise<ProfileExtractResponse> => {
    const res = await apiClient.post<ProfileExtractResponse>('/extract-profile', payload);
    return res.data;
  },

  jdMatch: async (payload: { resume_text?: string; jd_text?: string }): Promise<JDMatchResponse> => {
    const res = await apiClient.post<JDMatchResponse>('/jd-match', payload);
    return res.data;
  },
};
