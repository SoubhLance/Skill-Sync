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
    username?: string;
    public_repos?: number;
    repos?: number;
    followers?: number;
    following?: number;
    total_stars?: number;
    stars?: number;
    top_3_languages?: string[];
    languages?: string[];
    account_age_years?: number;
    pinned_with_desc?: number;
  } | null;
  leetcode?: {
    username?: string;
    total_solved?: number;
    solved?: number;
    easy_solved?: number;
    easy?: number;
    medium_solved?: number;
    medium?: number;
    hard_solved?: number;
    hard?: number;
    ranking?: number;
    contest_rating?: number;
    contest_global_rank?: number;
    contests_attended?: number;
    has_cp_signal?: boolean;
  } | null;
  codechef?: {
    username?: string;
    rating?: number;
    stars_count?: number;
    stars?: string | number;
    problems_solved?: number;
    highest_rating?: number;
    global_rank?: number;
    country_rank?: number;
    has_cp_signal?: boolean;
  } | null;
  hackerrank?: {
    username?: string;
    badges_count?: number;
    badges?: string[] | number;
    problems_solved?: number;
    stars?: number;
    has_cp_signal?: boolean;
  } | null;
  portfolio?: {
    url?: string | null;
    has_portfolio?: boolean;
    bonus?: number;
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
  candidate_skills?: string[];
  jd_skills?: string[];
  skill_score?: number;
  semantic_score?: number;
  match_label?: string;
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
  emails?: string[];
  phone_numbers?: string[];
  achievements?: string[];
  projects?: any[];
  name?: string;
  education?: { school: string; degree: string; year: string; score: string }[];
  experience?: { role: string; company: string; dates: string; bullets: string[] }[];
  is_low_confidence?: boolean;
  warnings?: string[];
}

export interface LinkedInScoreResponse {
  score: number;
  breakdown: Record<string, number>;
  gaps: string[];
  sections_detected: string[];
}

/** Read error detail from a Blob response (axios returns Blob on error when responseType is 'blob'). */
async function blobErrorDetail(e: any): Promise<string | null> {
  try {
    const blob = e?.response?.data;
    if (blob instanceof Blob) {
      const text = await blob.text();
      const json = JSON.parse(text);
      return json?.detail || null;
    }
    return e?.response?.data?.detail || null;
  } catch {
    return null;
  }
}

// Backend API Service Functions
export const api = {
  getHealth: async (): Promise<HealthResponse> => {
    const res = await apiClient.get<HealthResponse>('/health');
    return res.data;
  },

  getDomains: async (): Promise<string[]> => {
    const res = await apiClient.get<any>('/recommend/domains');
    return Array.isArray(res.data) ? res.data : (res.data?.domains || []);
  },

  getJobs: async (params?: { domain?: string; limit?: number; search?: string }): Promise<JobMatch[]> => {
    const res = await apiClient.get<any>('/recommend/jobs', { params });
    return Array.isArray(res.data) ? res.data : (res.data?.jobs || []);
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
    portfolio_url?: string;
    hackathon_wins?: number;
    papers_published?: number;
  }): Promise<ProfileExtractResponse> => {
    const res = await apiClient.post<ProfileExtractResponse>('/extract-profile', payload);
    return res.data;
  },

  jdMatch: async (payload: { resume_text?: string; jd_text?: string } | FormData): Promise<JDMatchResponse> => {
    let res;
    if (payload instanceof FormData) {
      res = await apiClient.post<JDMatchResponse>('/jd-match', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      res = await apiClient.post<JDMatchResponse>('/jd-match', payload);
    }
    return res.data;
  },

  optimizeLinkedinPdf: async (file: File): Promise<LinkedInScoreResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<LinkedInScoreResponse>('/api/optimizer/linkedin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  resumeLatex: async (template_id: string, data: any): Promise<{ latex: string; template_id: string }> => {
    const res = await apiClient.post('/resume/latex', { template_id, data });
    return res.data;
  },

  resumePdfBlob: async (template_id: string, data: any): Promise<Blob> => {
    try {
      const res = await apiClient.post('/resume/export-pdf', { template_id, data }, { responseType: 'blob' });
      const blob = res.data as Blob;
      // Backend errors sometimes arrive as JSON blobs with 200 in dev proxies.
      // Detect and surface them instead of downloading garbage.
      if (blob?.type?.includes('json')) {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json?.detail || 'PDF export failed.');
        } catch (err: any) {
          if (err?.message && !err.message.includes('Unexpected token') && !err.message.includes('is not valid JSON')) throw err;
        }
      }
      return new Blob([blob], { type: 'application/pdf' });
    } catch (e: any) {
      if (e?.message && !e.message.includes('backend running')) throw e;
      const detail = await blobErrorDetail(e);
      throw new Error(detail || 'PDF export failed. Is the backend running?');
    }
  },

  resumeDocxBlob: async (template_id: string, data: any): Promise<Blob> => {
    try {
      const res = await apiClient.post('/resume/export-docx', { template_id, data }, { responseType: 'blob' });
      const blob = res.data as Blob;
      if (blob?.type?.includes('json')) {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json?.detail || 'Word export failed.');
        } catch (err: any) {
          if (err?.message && !err.message.includes('Unexpected token') && !err.message.includes('is not valid JSON')) throw err;
        }
      }
      return new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    } catch (e: any) {
      if (e?.message && !e.message.includes('backend running') && !e.message.includes('Word export failed')) throw e;
      const detail = await blobErrorDetail(e);
      throw new Error(detail || 'Word export failed. Is the backend running?');
    }
  },

  getGithubContributions: async (username: string): Promise<{
    username: string;
    total_last_year: number;
    weeks: number[][];
    days: { date: string; count: number; level: number }[];
  }> => {
    const res = await apiClient.get('/github/contributions', { params: { username } });
    return res.data;
  },
};

