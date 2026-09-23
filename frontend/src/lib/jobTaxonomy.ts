/**
 * frontend/src/lib/jobTaxonomy.ts
 * ===============================
 * Client-side job taxonomy dataset loader.
 * Bundles the full 405+ role dataset from job_metadata.json and seamlessly
 * merges with live backend API data when the server is reachable.
 */

import { api } from './api';
import jobMetadataRaw from '../assets/job_metadata.json';

export interface JobTaxonomyItem {
  job_id: number;
  job_role: string;
  domain: string;
  experience_label: string;
  experience_level: number;
  skills: string;
  skills_list: string[];
  projects?: string;
  companies?: string;
  salary_range: string;
  salary_min?: number;
  salary_max?: number;
  salary_avg?: number;
  has_salary_data?: boolean;
  skill_count?: number;
}

// Parse bundled 405-role dataset
const PARSED_LOCAL_JOBS: JobTaxonomyItem[] = Object.values(
  jobMetadataRaw as Record<string, any>
).map((item, idx) => {
  const skillsList = Array.isArray(item.skills_list) && item.skills_list.length > 0
    ? item.skills_list
    : (item.skills || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

  return {
    job_id: item.job_id || idx + 1,
    job_role: item.job_role || 'Engineering Specialist',
    domain: item.domain || 'Technical',
    experience_label: item.experience_label || 'Mid-level (2-5 years)',
    experience_level: typeof item.experience_level === 'number' ? item.experience_level : 2,
    skills: item.skills || skillsList.join(', '),
    skills_list: skillsList,
    projects: item.projects || 'Production Service Architecture',
    companies: item.companies || 'Tech Tier 1 / Startups',
    salary_range: item.salary_range || '$110,000 - $160,000',
    salary_min: item.salary_min || 90000,
    salary_max: item.salary_max || 180000,
    salary_avg: item.salary_avg || 135000,
    has_salary_data: item.has_salary_data ?? true,
    skill_count: skillsList.length,
  };
});

export function getDefaultJobs(): JobTaxonomyItem[] {
  return PARSED_LOCAL_JOBS;
}

export function getDefaultDomains(): string[] {
  const unique = Array.from(
    new Set(PARSED_LOCAL_JOBS.map((j) => j.domain).filter(Boolean))
  ).sort();
  return ['All', ...unique];
}

/**
 * Fetch jobs from backend, fallback to offline bundled 405-role dataset.
 */
export async function loadJobTaxonomy(): Promise<{ jobs: JobTaxonomyItem[]; domains: string[] }> {
  try {
    const [remoteDomains, remoteJobs] = await Promise.all([
      api.getDomains().catch(() => []),
      api.getJobs().catch(() => []),
    ]);

    const jobs = remoteJobs.length > 0
      ? remoteJobs.map((j, idx) => ({
          job_id: j.job_id || idx + 1,
          job_role: j.job_role,
          domain: j.domain,
          experience_label: j.experience_label,
          experience_level: j.experience_level,
          skills: j.skills,
          skills_list: j.skills_list && j.skills_list.length > 0 ? j.skills_list : j.skills.split(',').map((s) => s.trim()),
          salary_range: j.salary_range,
          salary_avg: j.salary_avg,
          salary_min: j.salary_min,
          salary_max: j.salary_max,
          has_salary_data: j.has_salary_data,
          skill_count: j.skill_count,
        }))
      : PARSED_LOCAL_JOBS;

    const domains = remoteDomains.length > 0
      ? ['All', ...remoteDomains]
      : getDefaultDomains();

    return { jobs, domains };
  } catch {
    return {
      jobs: PARSED_LOCAL_JOBS,
      domains: getDefaultDomains(),
    };
  }
}
