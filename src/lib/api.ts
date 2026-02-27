import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

type AuthSuccessResponse = {
  success: true;
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: unknown;
};

type AuthErrorResponse = {
  success: false;
  error: string;
};

type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  /**
   * Absolute expiry timestamp in ms (optional safety net)
   */
  expiresAt?: number;
};

const TOKEN_STORAGE_KEY = 'rizq_auth_tokens';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<void> | null = null;

const isBrowser = typeof window !== 'undefined';

/**
 * Persist tokens to localStorage (browser only).
 */
function persistTokens(tokens: StoredTokens | null) {
  if (!isBrowser) return;
  if (!tokens) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function loadAuthTokensFromStorage() {
  if (!isBrowser) return;
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as StoredTokens;
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      // Expired - clear
      persistTokens(null);
      accessToken = null;
      refreshToken = null;
      return;
    }
    accessToken = parsed.accessToken;
    refreshToken = parsed.refreshToken;
  } catch {
    // Corrupted storage - clear it
    persistTokens(null);
    accessToken = null;
    refreshToken = null;
  }
}

export function setAuthTokens(data: { accessToken: string; refreshToken: string; expiresIn?: number }) {
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;

  const expiresAt =
    typeof data.expiresIn === 'number' && data.expiresIn > 0
      ? Date.now() + data.expiresIn * 1000
      : undefined;

  persistTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt,
  });
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
  persistTokens(null);
}

export function getAuthTokens(): { accessToken: string | null; refreshToken: string | null } {
  return { accessToken, refreshToken };
}

/**
 * Ensure we have a fresh access token using the stored refresh token.
 * Uses a single-flight promise so concurrent 401s share the same refresh.
 */
async function ensureAccessTokenRefreshed(): Promise<string | null> {
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await authApi.post<AuthResponse>('/auth/refresh', {
          refreshToken,
        });

        const data = response.data;
        if (data && (data as AuthSuccessResponse).success) {
          const success = data as AuthSuccessResponse;
          setAuthTokens({
            accessToken: success.token,
            refreshToken: success.refreshToken,
            expiresIn: success.expiresIn,
          });
        } else {
          clearAuthTokens();
        }
      } catch (error) {
        clearAuthTokens();
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Failed to refresh access token', error);
        }
      } finally {
        refreshPromise = null;
      }
    })();
  }

  await refreshPromise;
  return accessToken;
}

export const api = axios.create({
  baseURL: API_BASE,
  // We no longer rely on cookies; all auth is via Authorization header.
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate instance without interceptors for refresh calls to avoid recursion.
const authApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

function attachAuthHeader(config: InternalAxiosRequestConfig) {
  if (accessToken) {
    if (!config.headers) {
      config.headers = {};
    }
    (config.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }
  return config;
}

// Request interceptor - attach Authorization header if we have a token
api.interceptors.request.use(
  (config) => attachAuthHeader(config),
  (error) => Promise.reject(error)
);

// Response interceptor to transparently refresh access tokens on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const response = error.response;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = response.status;

    // Do not attempt refresh for these endpoints
    const url = originalRequest.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint && refreshToken) {
      originalRequest._retry = true;

      const newToken = await ensureAccessTokenRefreshed();
      if (newToken) {
        attachAuthHeader(originalRequest);
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// Job Search
export const searchJobs = async (params: {
  query?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  jobType?: string[];
  companySize?: string;
  postedWithin?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'salary' | 'match';
}) => {
  const response = await api.get('/workflow/search', { params });
  return response.data;
};

// Get Single Job
export const getJob = async (jobId: string) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
};

// Get Recommendations (New intelligent system)
export const getRecommendations = async (params?: {
  limit?: number;
  minScore?: number;
  diversify?: boolean;
}) => {
  const response = await api.get('/recommendations', { params });
  return response.data;
};

// Get Quick Recommendations (for dashboard)
export const getQuickRecommendations = async () => {
  const response = await api.get('/recommendations/quick');
  return response.data;
};

// Refresh Recommendations
export const refreshRecommendations = async () => {
  const response = await api.post('/recommendations/refresh');
  return response.data;
};

// Get Dashboard Data
export const getDashboard = async () => {
  const response = await api.get('/workflow/dashboard');
  return response.data;
};

// Get Applications
export const getApplications = async (params?: { status?: string; limit?: number; offset?: number }) => {
  const response = await api.get('/applications', { params });
  return response.data;
};

// Apply to Jobs - OLD METHOD (kept for backward compatibility)
export const applyToJobs = async (jobIds: string[]) => {
  const response = await api.post('/workflow/apply', { jobIds });
  return response.data;
};

// NEW: Bulk Apply using Orchestrator (hides email discovery)
export const bulkApplyToJobs = async (
  jobIds: string[], 
  customMessage?: string,
  jobSummaries?: Record<string, string>
) => {
  const response = await api.post('/workflow/apply', {
    jobIds,
    customMessage,
    includeResume: true,
    jobSummaries
  });
  return response.data;
};

// NEW: Get bulk application progress
export const getBulkApplicationProgress = async (progressId: string) => {
  const response = await api.get(`/workflow/apply/status/${progressId}`);
  return response.data;
};

// Generate batch resumes using document automation API
export const generateBatchResumes = async (
  jobs: Array<{
    jobId: string;
    jobTitle: string;
    professionalSummary: string;
  }>
) => {
  const response = await api.post('/resumes/generate-batch', { jobs });
  return response.data;
};

// Generate Professional Summary for a job
export const generateProfessionalSummary = async (
  jobTitle: string,
  jobDescription: string,
  companyName: string
) => {
  try {
    console.log('🔍 Starting summary generation for:', jobTitle, 'at', companyName);
    
    // Get user profile data
    let profileResponse;
    let profile;
    
    try {
      console.log('📥 Fetching user profile...');
      profileResponse = await api.get('/profile');
      profile = profileResponse.data?.profile || profileResponse.data;
      console.log('✅ Profile fetched successfully');
    } catch (profileError: any) {
      console.error('❌ Failed to fetch profile:', profileError);
      console.error('Profile error details:', profileError.response?.data);
      throw new Error('Failed to fetch user profile. Please ensure you are logged in.');
    }

    // Safely structure work experience - ensure required fields
    const workExperience = Array.isArray(profile?.experience) 
      ? profile.experience
          .filter((exp: any) => exp?.title && exp?.company) // Only include valid entries
          .map((exp: any) => ({
            title: exp.title,
            company: exp.company,
            location: exp.location || undefined,
            startDate: exp.startDate || exp.start || undefined,
            endDate: exp.endDate || exp.end || undefined,
            responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : undefined,
            achievements: Array.isArray(exp.achievements) ? exp.achievements : undefined,
          }))
      : [];

    // Safely structure education - ensure required fields
    const education = Array.isArray(profile?.education)
      ? profile.education
          .filter((edu: any) => edu?.school) // Only include entries with school
          .map((edu: any) => ({
            degree: edu.degree || undefined,
            school: edu.school,
            location: edu.location || undefined,
            graduationDate: edu.graduationDate || edu.graduation || undefined,
          }))
      : [];

    // Safely structure skills
    const skills = Array.isArray(profile?.skills)
      ? profile.skills.filter((s: any) => typeof s === 'string')
      : [];

    console.log('📊 Profile data structured:', {
      workExperience: workExperience.length,
      education: education.length,
      skills: skills.length
    });

    // Build AI resume input with job context
    const aiResumeInput = {
      personalInfo: {
        fullName: profile?.fullName || profile?.name || 'Professional',
        title: profile?.headline || profile?.currentRole || jobTitle,
        location: profile?.location || undefined,
        email: profile?.email || undefined,
        phone: profile?.phone || undefined,
        summaryPreferences: `Generate a professional summary tailored for a ${jobTitle} position at ${companyName}. ${jobDescription ? `Job requirements: ${jobDescription.substring(0, 500)}` : ''}`
      },
      workExperience: workExperience.length > 0 ? workExperience : undefined,
      education: education.length > 0 ? education : undefined,
      skills: skills.length > 0 ? skills : undefined,
      additionalNotes: `This summary is for an application to ${jobTitle} at ${companyName}.`
    };

    console.log('🤖 Calling AI generation endpoint with input:', JSON.stringify(aiResumeInput, null, 2));

    // Call AI resume generation endpoint
    try {
      const response = await api.post('/resumes/ai-generate', aiResumeInput);
      console.log('✅ AI generation successful');
      
      // Extract professional summary from response
      const summary = response.data?.resume?.professionalSummary || '';
      console.log('📝 Generated summary length:', summary.length);
      
      return summary;
    } catch (aiError: any) {
      console.error('❌ AI generation failed:', aiError);
      console.error('AI error response:', aiError.response?.data);
      console.error('AI error status:', aiError.response?.status);
      throw new Error(aiError.response?.data?.error || 'Failed to generate professional summary');
    }
  } catch (error: any) {
    console.error('❌ Overall generation failed:', error);
    throw error;
  }
};

// Authentication
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (email: string, password: string, name: string) => {
  const response = await api.post('/auth/register', { email, password, name });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Email Discovery & Outreach - OLD METHODS (kept for now, but not recommended)
// These expose email discovery to users - use bulkApplyToJobs instead
export const discoverCompanyEmails = async (jobIds: string[]) => {
  const response = await api.post('/email/discover-emails', { job_ids: jobIds });
  return response.data;
};

export const getEmailDiscoveryStatus = async (jobId: string) => {
  const response = await api.get(`/email/discovery-status/${jobId}`);
  return response.data;
};

export const sendBulkApplications = async (applications: Array<{
  jobId: string;
  recipientEmail: string;
  subject: string;
  body: string;
}>) => {
  const response = await api.post('/email-outreach/one-click-apply', { 
    jobIds: applications.map(app => app.jobId) 
  });
  return response.data;
};

export const getGmailStatus = async () => {
  const response = await api.get('/auth/gmail/status');
  return response.data;
};

export const startGmailOAuth = async () => {
  const response = await api.get('/email-outreach/oauth/google/start');
  return response.data;
};

// Profile Management
export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateProfile = async (data: unknown) => {
  const response = await api.put('/profile', data);
  return response.data;
};

export const uploadResume = async (data: { resumeUrl?: string; resumeText?: string }) => {
  const response = await api.post('/profile/resume', data);
  return response.data;
};

export const deleteAccount = async (password: string) => {
  const response = await api.delete('/profile/account', { data: { password } });
  return response.data;
};

// Application Eligibility Check
export const checkApplicationEligibility = async (jobIds: string[]) => {
  const params = new URLSearchParams();
  jobIds.forEach(id => params.append('jobIds', id));
  const response = await api.get(`/workflow/apply/check-eligibility?${params.toString()}`);
  return response.data;
};

// Email Preview Methods
export const generateEmailPreview = async (
  jobIds: string[],
  customMessage?: string,
  jobSummaries?: Record<string, string>
) => {
  const response = await api.post('/workflow/apply', {
    jobIds,
    customMessage,
    includeResume: true,
    jobSummaries,
    previewMode: true
  });
  return response.data;
};

export const getEmailPreview = async (progressId: string) => {
  try {
    const response = await api.get(`/workflow/apply/preview/${progressId}`);
    return response.data;
  } catch (error: any) {
    // Re-throw with more context
    if (error.response?.status === 404) {
      throw new Error('Email preview not found or still being generated');
    }
    throw error;
  }
};

export const updateEmail = async (
  progressId: string,
  emailIndex: number,
  subject: string,
  body: string,
  recipientEmail?: string
) => {
  const response = await api.put(`/workflow/apply/preview/${progressId}/email/${emailIndex}`, {
    subject,
    body,
    ...(recipientEmail && { recipientEmail })
  });
  return response.data;
};

export const regenerateEmail = async (progressId: string, emailIndex: number) => {
  const response = await api.post(`/workflow/apply/preview/${progressId}/regenerate/${emailIndex}`);
  return response.data;
};

export const finalizeEmails = async (
  progressId: string,
  resumeDownloads?: Record<string, string>,
  jobIds?: string[]
) => {
  const response = await api.post(`/workflow/apply/preview/${progressId}/finalize`, {
    ...(resumeDownloads && Object.keys(resumeDownloads).length > 0
      ? { resumeDownloads }
      : {}),
    ...(jobIds && jobIds.length > 0 ? { jobIds } : {})
  });
  return response.data;
};
