/**
 * frontend/src/lib/userProfile.ts
 * ===============================
 * Client-side user profile & skills store.
 * - Empty-first: no sample data, scores default to 0.
 * - Per Firebase user: keys are namespaced by uid so switching
 *   accounts gives an empty dashboard until that user connects DSA.
 * - Single source of truth for Dashboard (reader) <- DSA/Code page (writer)
 *   + Resume/JD skills (writers).
 */

import { useState, useEffect, useCallback } from 'react';
import type { ProfileExtractResponse } from './api';

const BASE_SKILLS = 'user_skills';
const BASE_PROFILE_SCORE = 'profile_score';
const BASE_DSA_SCORE = 'dsa_score';
const BASE_DSA_PROFILE = 'dsa_profile';
const LAST_UID_KEY = 'skillsync_last_uid';
const MOCK_USER_KEY = 'skillsync_mock_user';
const EVENT_NAME = 'skillsync_profile_updated';

export const SAMPLE_PROFILE_SKILLS = [
  'Python',
  'FastAPI',
  'PyTorch',
  'React',
  'TypeScript',
  'Docker',
  'SQL',
];

export interface DsaHandles {
  github?: string;
  leetcode?: string;
  codechef?: string;
  hackerrank?: string;
  portfolioUrl?: string;
}

export interface StoredDsaProfile {
  data: ProfileExtractResponse;
  handles: DsaHandles;
  updatedAt: string;
}

/** Resolve which uid's bucket to use. Components should pass user?.uid explicitly. */
export function resolveUid(provided?: string | null): string {
  if (provided) return provided;
  try {
    const last = localStorage.getItem(LAST_UID_KEY);
    if (last) return last;
    const mockRaw = sessionStorage.getItem(MOCK_USER_KEY);
    if (mockRaw) {
      const parsed = JSON.parse(mockRaw);
      if (parsed?.uid) return parsed.uid;
    }
  } catch {
    /* ignore */
  }
  return 'anon';
}

export function setLastUid(uid: string | null): void {
  try {
    if (uid) localStorage.setItem(LAST_UID_KEY, uid);
    else localStorage.removeItem(LAST_UID_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

function keyFor(uid: string | undefined | null, base: string): string {
  return `skillsync_${resolveUid(uid ?? undefined)}_${base}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ── Skills (resume + JD) ─────────────────────────────────────────────

export function getStoredSkills(uid?: string | null): string[] {
  const parsed = readJson<string[]>(keyFor(uid, BASE_SKILLS), []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveStoredSkills(skills: string[], uid?: string | null): void {
  try {
    localStorage.setItem(keyFor(uid, BASE_SKILLS), JSON.stringify(skills));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (err) {
    console.warn('Failed to save skills to localStorage:', err);
  }
}

// ── Scores (empty-first: default 0, not 0.75/0.8) ────────────────────

export function getStoredProfileScore(uid?: string | null): number {
  try {
    const val = localStorage.getItem(keyFor(uid, BASE_PROFILE_SCORE));
    if (val === null || val === '') return 0;
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function getStoredDsaScore(uid?: string | null): number {
  try {
    const val = localStorage.getItem(keyFor(uid, BASE_DSA_SCORE));
    if (val === null || val === '') return 0;
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

// ── DSA profile (full /extract-profile response + handles) ──────────

export function getDsaProfile(uid?: string | null): StoredDsaProfile | null {
  const parsed = readJson<StoredDsaProfile | null>(keyFor(uid, BASE_DSA_PROFILE), null);
  if (!parsed || !parsed.data) return null;
  return parsed;
}

export function saveDsaProfile(
  data: ProfileExtractResponse,
  handles: DsaHandles,
  uid?: string | null,
): StoredDsaProfile {
  const stored: StoredDsaProfile = {
    data,
    handles,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(keyFor(uid, BASE_DSA_PROFILE), JSON.stringify(stored));
    // Keep numeric scores in sync for legacy readers.
    localStorage.setItem(keyFor(uid, BASE_PROFILE_SCORE), String(data.profile_score ?? 0));
    localStorage.setItem(keyFor(uid, BASE_DSA_SCORE), String(data.profile_score ?? 0));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (err) {
    console.warn('Failed to save DSA profile to localStorage:', err);
  }
  return stored;
}

export function clearDsaProfile(uid?: string | null): void {
  try {
    localStorage.removeItem(keyFor(uid, BASE_DSA_PROFILE));
    localStorage.removeItem(keyFor(uid, BASE_PROFILE_SCORE));
    localStorage.removeItem(keyFor(uid, BASE_DSA_SCORE));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    /* ignore */
  }
}

export function useDsaProfile(uid?: string | null) {
  const resolved = resolveUid(uid ?? undefined);
  const [profile, setProfile] = useState<StoredDsaProfile | null>(() => getDsaProfile(resolved));

  useEffect(() => {
    setProfile(getDsaProfile(resolved));
    const handleUpdate = () => setProfile(getDsaProfile(resolved));
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [resolved]);

  const save = useCallback(
    (data: ProfileExtractResponse, handles: DsaHandles) => {
      const stored = saveDsaProfile(data, handles, resolved);
      setProfile(stored);
      return stored;
    },
    [resolved],
  );

  const clear = useCallback(() => {
    clearDsaProfile(resolved);
    setProfile(null);
  }, [resolved]);

  return { dsa: profile, hasDsaData: !!profile, saveDsa: save, clearDsa: clear };
}

export function useUserProfile(uid?: string | null) {
  const resolved = resolveUid(uid ?? undefined);
  const [skills, setSkillsState] = useState<string[]>(() => getStoredSkills(resolved));
  const [profileScore, setProfileScoreState] = useState<number>(() => getStoredProfileScore(resolved));
  const [dsaScore, setDsaScoreState] = useState<number>(() => getStoredDsaScore(resolved));

  useEffect(() => {
    // Re-read when account switches.
    setSkillsState(getStoredSkills(resolved));
    setProfileScoreState(getStoredProfileScore(resolved));
    setDsaScoreState(getStoredDsaScore(resolved));

    const handleUpdate = () => {
      setSkillsState(getStoredSkills(resolved));
      setProfileScoreState(getStoredProfileScore(resolved));
      setDsaScoreState(getStoredDsaScore(resolved));
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [resolved]);

  const setSkills = useCallback(
    (newSkills: string[]) => {
      saveStoredSkills(newSkills, resolved);
      setSkillsState(newSkills);
    },
    [resolved],
  );

  const addSkills = useCallback(
    (skillsToAdd: string[]) => {
      const current = getStoredSkills(resolved);
      const currentLower = new Set(current.map((s) => s.toLowerCase()));
      const toAppend = (skillsToAdd || [])
        .map((s) => (s || '').trim())
        .filter((s) => s && !currentLower.has(s.toLowerCase()));
      if (!toAppend.length) return;
      const merged = [...current, ...toAppend];
      saveStoredSkills(merged, resolved);
      setSkillsState(merged);
    },
    [resolved],
  );

  const clearSkills = useCallback(() => {
    saveStoredSkills([], resolved);
    setSkillsState([]);
  }, [resolved]);

  const loadSampleProfile = useCallback(() => {
    saveStoredSkills(SAMPLE_PROFILE_SKILLS, resolved);
    setSkillsState(SAMPLE_PROFILE_SKILLS);
  }, [resolved]);

  const setScores = useCallback(
    (newProfileScore?: number, newDsaScore?: number) => {
      try {
        if (newProfileScore !== undefined) {
          localStorage.setItem(keyFor(resolved, BASE_PROFILE_SCORE), newProfileScore.toString());
          setProfileScoreState(newProfileScore);
        }
        if (newDsaScore !== undefined) {
          localStorage.setItem(keyFor(resolved, BASE_DSA_SCORE), newDsaScore.toString());
          setDsaScoreState(newDsaScore);
        }
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(EVENT_NAME));
    },
    [resolved],
  );

  return {
    skills,
    profileScore,
    dsaScore,
    hasSkillsOnFile: skills.length > 0,
    setSkills,
    addSkills,
    clearSkills,
    loadSampleProfile,
    setScores,
  };
}
