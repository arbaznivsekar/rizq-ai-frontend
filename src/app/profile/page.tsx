'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, updateProfile } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Link2, Github, Linkedin, Globe, Save, Loader2, Plus, X,
  Settings, Award, Edit2, Check, Calendar, Building2, ArrowLeft
} from 'lucide-react';
import { MarkdownEditor } from '@/components/ui/markdown-editor';

interface ProfileData {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  headline: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }>;
  projects: Array<{
    name: string;
    associatedWith: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    url: string;
    technologies: string[];
    media: string[];
    collaborators: string;
  }>;
  preferences: {
    jobTypes: string[];
    locations: string[];
    remotePreference: string;
    salaryExpectation: {
      min: number;
      max: number;
      currency: string;
    };
    availability: string;
  };
  social: {
    linkedin: string;
    github: string;
    portfolio: string;
    twitter: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const scrollRestoreKey = 'profile_scroll_position';

  // Scroll restoration: Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(scrollRestoreKey, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll restoration: Restore scroll position on mount
  useEffect(() => {
    if (!authLoading && isAuthenticated && !loading) {
      const savedScrollPosition = sessionStorage.getItem(scrollRestoreKey);
      if (savedScrollPosition) {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScrollPosition, 10));
          // Clear the saved position after restoring
          sessionStorage.removeItem(scrollRestoreKey);
        });
      } else {
        // Scroll to top on first load
        window.scrollTo(0, 0);
      }
    }
  }, [authLoading, isAuthenticated, loading]);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    headline: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    preferences: {
      jobTypes: [],
      locations: [],
      remotePreference: 'any',
      salaryExpectation: { min: 0, max: 0, currency: 'USD' },
      availability: ''
    },
    social: {
      linkedin: '',
      github: '',
      portfolio: '',
      twitter: ''
    }
  });

  const [newSkill, setNewSkill] = useState('');
  const [newTechnology, setNewTechnology] = useState('');
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number | null>(null);

  // Persist view mode changes to localStorage (works in production)
  useEffect(() => {
    if (showProfileCard !== undefined && !loading) {
      try {
        localStorage.setItem('profileViewMode', showProfileCard ? 'card' : 'edit');
      } catch (error) {
        // localStorage might be disabled in private mode or by browser settings
        // Silently fail - app will still work, just won't persist preference
        console.warn('Could not save view preference to localStorage:', error);
      }
    }
  }, [showProfileCard, loading]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else {
        // Fetch immediately when authenticated
        fetchProfile();
      }
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      if (response.success && response.data?.profile) {
        const fetchedProfile = response.data.profile;
        const hasData = fetchedProfile.name || fetchedProfile.headline || fetchedProfile.skills?.length > 0 || fetchedProfile.projects?.length > 0;
        
        setProfile({
          _id: fetchedProfile._id,
          name: fetchedProfile.name || '',
          email: fetchedProfile.email || '',
          phone: fetchedProfile.phone || '',
          location: fetchedProfile.location || '',
          bio: fetchedProfile.bio || '',
          headline: fetchedProfile.headline || '',
          skills: fetchedProfile.skills || [],
          experience: fetchedProfile.experience || [],
          education: fetchedProfile.education || [],
          projects: fetchedProfile.projects || [],
          preferences: {
            jobTypes: fetchedProfile.preferences?.jobTypes || [],
            locations: fetchedProfile.preferences?.locations || [],
            remotePreference: fetchedProfile.preferences?.remotePreference || 'any',
            salaryExpectation: {
              min: fetchedProfile.preferences?.salaryExpectation?.min || 0,
              max: fetchedProfile.preferences?.salaryExpectation?.max || 0,
              currency: fetchedProfile.preferences?.salaryExpectation?.currency || 'USD'
            },
            availability: fetchedProfile.preferences?.availability || ''
          },
          social: {
            linkedin: fetchedProfile.social?.linkedin || '',
            github: fetchedProfile.social?.github || '',
            portfolio: fetchedProfile.social?.portfolio || '',
            twitter: fetchedProfile.social?.twitter || ''
          }
        });
        
        // Show profile card if user has saved data
        // Check localStorage for user preference (works in production)
        // Default: Show card if data exists, edit form if no data
        try {
          const savedViewMode = localStorage.getItem('profileViewMode');
          if (savedViewMode !== null && savedViewMode !== '') {
            // Respect user's saved preference
            setShowProfileCard(savedViewMode === 'card');
          } else {
            // Default: Show card if profile has data, otherwise show edit form
            setShowProfileCard(hasData);
            // Save default preference to localStorage
            if (hasData) {
              try {
                localStorage.setItem('profileViewMode', 'card');
              } catch (e) {
                // Ignore localStorage errors
              }
            }
          }
        } catch (error) {
          // localStorage might be disabled - fallback to default behavior
          console.warn('Could not read view preference from localStorage:', error);
          setShowProfileCard(hasData);
        }
      } else {
        // No profile data - show edit form by default
        setShowProfileCard(false);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
      // On error, default to edit form
      setShowProfileCard(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Enforce safe length limits before sending to backend to avoid 400 validation errors
    const sanitizedProfile: ProfileData = {
      ...profile,
      // Match UI limits / reasonable defaults
      headline: profile.headline?.slice(0, 100) || '',
      bio: profile.bio?.slice(0, 500) || '',
      experience: profile.experience.map((exp) => ({
        ...exp,
        description: exp.description?.slice(0, 1000) || '',
      })),
      projects: profile.projects.map((project) => ({
        ...project,
        description: project.description?.slice(0, 1000) || '',
      })),
    };

    setSaving(true);
    try {
      console.log('Saving profile with projects:', sanitizedProfile.projects);
      const response = await updateProfile(sanitizedProfile);
      console.log('Save response:', response);
      if (response.success) {
        toast.success('Profile updated successfully!');
        setShowProfileCard(true); // Show profile card after successful save
        await fetchProfile(); // Refresh data
        await refreshUser(); // Refresh user data in AuthContext to update header
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error('Failed to update profile:', err);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleAddExperience = () => {
    setProfile({
      ...profile,
      experience: [
        ...profile.experience,
        {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: ''
        }
      ]
    });
  };

  const handleRemoveExperience = (index: number) => {
    setProfile({
      ...profile,
      experience: profile.experience.filter((_, i) => i !== index)
    });
  };

  const handleAddEducation = () => {
    setProfile({
      ...profile,
      education: [
        ...profile.education,
        {
          degree: '',
          institution: '',
          field: '',
          startDate: '',
          endDate: '',
          current: false
        }
      ]
    });
  };

  const handleRemoveEducation = (index: number) => {
    setProfile({
      ...profile,
      education: profile.education.filter((_, i) => i !== index)
    });
  };

  const handleAddProject = () => {
    setProfile({
      ...profile,
      projects: [
        ...profile.projects,
        {
          name: '',
          associatedWith: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
          url: '',
          technologies: [],
          media: [],
          collaborators: ''
        }
      ]
    });
  };

  const handleRemoveProject = (index: number) => {
    setProfile({
      ...profile,
      projects: profile.projects.filter((_, i) => i !== index)
    });
  };

  const handleAddTechnology = (projectIndex: number, technology: string) => {
    if (technology.trim() && !profile.projects[projectIndex].technologies.includes(technology.trim())) {
      const newProjects = [...profile.projects];
      newProjects[projectIndex].technologies = [...newProjects[projectIndex].technologies, technology.trim()];
      setProfile({ ...profile, projects: newProjects });
    }
  };

  const handleRemoveTechnology = (projectIndex: number, technologyToRemove: string) => {
    const newProjects = [...profile.projects];
    newProjects[projectIndex].technologies = newProjects[projectIndex].technologies.filter(
      tech => tech !== technologyToRemove
    );
    setProfile({ ...profile, projects: newProjects });
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') return 'Present';
    
    // Handle format: "YYYY-MM" (from month input) or "YYYY-MM-DD"
    let parsedDate: Date;
    
    if (dateString.match(/^\d{4}-\d{2}$/)) {
      // Format: "2022-09" - add day to make it valid
      parsedDate = new Date(dateString + '-01');
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Format: "2022-09-15"
      parsedDate = new Date(dateString);
    } else {
      // Try parsing as-is
      parsedDate = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
    
    return parsedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Only show full loading during initial auth check
  // Allow progressive loading for profile data
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="container mx-auto px-4 pt-6 pb-24 max-w-5xl">
        {/* Back to Search Button */}
        <Button 
          variant="ghost" 
          onClick={() => {
            // Check if we have saved search state
            const savedState = sessionStorage.getItem('paginationState');
            if (savedState) {
              try {
                const paginationState = JSON.parse(savedState);
                // Navigate to search page with preserved search parameters
                const searchParams = new URLSearchParams();
                if (paginationState.query) searchParams.set('q', paginationState.query);
                if (paginationState.location) searchParams.set('location', paginationState.location);
                router.push(`/?${searchParams.toString()}`);
              } catch (error) {
                console.error('Failed to parse saved state:', error);
                router.push('/');
              }
            } else {
              // Fallback to home page if no saved state
              router.push('/');
            }
          }} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>

        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Your Profile</h1>
            <p className="text-slate-600">
              {showProfileCard 
                ? 'View and manage your professional information'
                : 'Complete your profile to get started'}
            </p>
          </div>
          {showProfileCard && (
            <Button
              variant="outline"
              onClick={() => setShowProfileCard(false)}
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {loading && !showProfileCard ? (
          // Loading skeleton for profile forms
          <div className="space-y-6">
            <Card className="mb-6">
              <CardHeader>
                <div className="h-6 w-48 bg-slate-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                    <div className="h-10 w-full bg-slate-200 animate-pulse rounded" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : showProfileCard ? (
          // ==================== PROFILE CARD VIEW ====================
          <>
            {/* Profile Header Card */}
            <Card className="mb-8 border-2 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="relative">
                    {loading ? (
                      <div className="w-32 h-32 rounded-full bg-slate-200 animate-pulse" />
                    ) : (
                      <>
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                          {profile.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        {profile.headline && (
                          <div className="absolute -bottom-2 -right-2 bg-green-500 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex-1">
                    {loading ? (
                      <div className="space-y-3">
                        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
                        <div className="h-6 w-48 bg-slate-200 animate-pulse rounded" />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-3xl font-bold text-slate-900">
                          {profile.name || 'Your Name'}
                        </h1>
                        {profile.headline && (
                          <p className="text-lg text-blue-600 font-medium mt-1">
                            {profile.headline}
                          </p>
                        )}
                      </>
                    )}

                    <div className="flex flex-wrap gap-4 mt-4 text-slate-600">
                      {profile.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{profile.email}</span>
                      </div>
                    </div>

                    {profile.bio && (
                      <p className="mt-4 text-slate-700 leading-relaxed">
                        {profile.bio}
                      </p>
                    )}

                    {/* Social Links Integration */}
                    {(profile.social.linkedin || profile.social.github || profile.social.portfolio || profile.social.twitter) && (
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex flex-wrap gap-3">
                          {profile.social.linkedin && (
                            <a
                              href={profile.social.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-slate-50 transition-colors"
                            >
                              <Linkedin className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">LinkedIn</span>
                            </a>
                          )}
                          {profile.social.github && (
                            <a
                              href={profile.social.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-slate-50 transition-colors"
                            >
                              <Github className="h-4 w-4 text-slate-900" />
                              <span className="text-sm font-medium">GitHub</span>
                            </a>
                          )}
                          {profile.social.portfolio && (
                            <a
                              href={profile.social.portfolio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-slate-50 transition-colors"
                            >
                              <Globe className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Portfolio</span>
                            </a>
                          )}
                          {profile.social.twitter && (
                            <a
                              href={profile.social.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-slate-50 transition-colors"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                              <span className="text-sm font-medium">Twitter/X</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience Card */}
            {profile.experience.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <CardTitle>Work Experience</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="relative pl-8 pb-6 border-l-2 border-blue-200 last:pb-0">
                        <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white" />
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{exp.title}</h3>
                          <div className="flex items-center gap-2 text-slate-600 mt-1">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">{exp.company}</span>
                            {exp.location && (
                              <>
                                <span>•</span>
                                <MapPin className="h-4 w-4" />
                                <span>{exp.location}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                            </span>
                            {exp.current && (
                              <Badge variant="outline" className="ml-2">Current</Badge>
                            )}
                          </div>
                          {exp.description && (
                            <p className="mt-3 text-slate-700 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects Card */}
            {profile.projects.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <CardTitle>Projects</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.projects.map((project, index) => (
                      <Card 
                        key={index} 
                        className="border-2 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedProjectIndex(selectedProjectIndex === index ? null : index)}
                      >
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            {/* Project Title */}
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">{project.name}</h3>
                              {project.associatedWith && (
                                <p className="text-sm text-slate-600 mt-1">
                                  <Building2 className="h-3 w-3 inline mr-1" />
                                  {project.associatedWith}
                                </p>
                              )}
                            </div>

                            {/* Duration */}
                            {(project.startDate || project.endDate || project.current) && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {formatDate(project.startDate)} - {project.current ? 'Present' : formatDate(project.endDate)}
                                </span>
                                {project.current && (
                                  <Badge variant="outline" className="ml-2">In Progress</Badge>
                                )}
                              </div>
                            )}

                            {/* Description */}
                            {project.description && (
                              <p className={`text-sm text-slate-700 ${selectedProjectIndex === index ? '' : 'line-clamp-3'}`}>
                                {project.description}
                              </p>
                            )}

                            {/* Technologies */}
                            {project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {project.technologies.map((tech, techIndex) => (
                                  <Badge key={techIndex} variant="secondary" className="text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Project URL */}
                            {project.url && (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Globe className="h-4 w-4" />
                                View Project
                              </a>
                            )}

                            {/* Collaborators */}
                            {project.collaborators && (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-slate-600">
                                  <span className="font-medium">Collaborators:</span> {project.collaborators}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education Card */}
            {profile.education.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <CardTitle>Education</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {profile.education.map((edu, index) => (
                      <div key={index} className="relative pl-8 pb-6 border-l-2 border-purple-200 last:pb-0">
                        <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-purple-600 border-2 border-white" />
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{edu.degree}</h3>
                          <p className="text-slate-700 font-medium mt-1">{edu.institution}</p>
                          {edu.field && (
                            <p className="text-slate-600 mt-1">{edu.field}</p>
                          )}
                          {edu.startDate && (
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                              </span>
                              {edu.current && (
                                <Badge variant="outline" className="ml-2">Current</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills Card */}
            {profile.skills.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <CardTitle>Skills</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </>
        ) : (
          // ==================== PROFILE FORM VIEW ====================
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">
                <User className="h-4 w-4 mr-2" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="experience">
                <Briefcase className="h-4 w-4 mr-2" />
                Experience
              </TabsTrigger>
              <TabsTrigger value="education">
                <GraduationCap className="h-4 w-4 mr-2" />
                Education
              </TabsTrigger>
              <TabsTrigger value="projects">
                <Award className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="social">
                <Link2 className="h-4 w-4 mr-2" />
                Social
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Your personal and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        <User className="h-4 w-4 inline mr-2" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-slate-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="h-4 w-4 inline mr-2" />
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">
                        <MapPin className="h-4 w-4 inline mr-2" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="San Francisco, CA"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="headline">
                      <Award className="h-4 w-4 inline mr-2" />
                      Professional Headline
                    </Label>
                    <Input
                      id="headline"
                      value={profile.headline}
                      onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                      placeholder="Senior Software Engineer | Full Stack Developer"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-sm text-slate-500">
                      {profile.bio.length}/500 characters
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill (e.g., React, Node.js)"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <Button onClick={handleAddSkill} type="button">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1 flex items-center gap-1">
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Removing skill:', skill);
                              handleRemoveSkill(skill);
                            }}
                            className="ml-1 hover:text-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Work Experience</CardTitle>
                      <CardDescription>
                        Add your work history and achievements
                      </CardDescription>
                    </div>
                    <Button onClick={handleAddExperience} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profile.experience.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No experience added yet</p>
                      <p className="text-sm">Click &quot;Add Experience&quot; to get started</p>
                    </div>
                  ) : (
                    profile.experience.map((exp, index) => (
                      <Card key={index} className="border-2">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold">Experience {index + 1}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExperience(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Job Title</Label>
                              <Input
                                value={exp.title}
                                onChange={(e) => {
                                  const newExp = [...profile.experience];
                                  newExp[index].title = e.target.value;
                                  setProfile({ ...profile, experience: newExp });
                                }}
                                placeholder="Software Engineer"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Company</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) => {
                                  const newExp = [...profile.experience];
                                  newExp[index].company = e.target.value;
                                  setProfile({ ...profile, experience: newExp });
                                }}
                                placeholder="Tech Corp"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Location</Label>
                              <Input
                                value={exp.location}
                                onChange={(e) => {
                                  const newExp = [...profile.experience];
                                  newExp[index].location = e.target.value;
                                  setProfile({ ...profile, experience: newExp });
                                }}
                                placeholder="San Francisco, CA"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Start Date</Label>
                              <Input
                                type="month"
                                value={exp.startDate}
                                onChange={(e) => {
                                  const newExp = [...profile.experience];
                                  newExp[index].startDate = e.target.value;
                                  setProfile({ ...profile, experience: newExp });
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input
                                type="month"
                                value={exp.endDate}
                                onChange={(e) => {
                                  const newExp = [...profile.experience];
                                  newExp[index].endDate = e.target.value;
                                  setProfile({ ...profile, experience: newExp });
                                }}
                                disabled={exp.current}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`current-${index}`}
                                checked={exp.current}
                                onChange={(e) => {
                                  const newExp = [...profile.experience];
                                  newExp[index].current = e.target.checked;
                                  if (e.target.checked) {
                                    newExp[index].endDate = '';
                                  }
                                  setProfile({ ...profile, experience: newExp });
                                }}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`current-${index}`}>Current Position</Label>
                            </div>
                          </div>

                          <MarkdownEditor
                            label="Description"
                            value={exp.description}
                            maxLength={1000}
                            onChange={(next) => {
                              const newExp = [...profile.experience];
                              newExp[index].description = next;
                              setProfile({ ...profile, experience: newExp });
                            }}
                            placeholder="Use markdown bullets to describe your responsibilities and achievements (start lines with '-' or '*')."
                          />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Education</CardTitle>
                      <CardDescription>
                        Add your educational background
                      </CardDescription>
                    </div>
                    <Button onClick={handleAddEducation} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profile.education.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <GraduationCap className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No education added yet</p>
                      <p className="text-sm">Click &quot;Add Education&quot; to get started</p>
                    </div>
                  ) : (
                    profile.education.map((edu, index) => (
                      <Card key={index} className="border-2">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold">Education {index + 1}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEducation(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Degree</Label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => {
                                  const newEdu = [...profile.education];
                                  newEdu[index].degree = e.target.value;
                                  setProfile({ ...profile, education: newEdu });
                                }}
                                placeholder="Bachelor of Science"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Institution</Label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => {
                                  const newEdu = [...profile.education];
                                  newEdu[index].institution = e.target.value;
                                  setProfile({ ...profile, education: newEdu });
                                }}
                                placeholder="University Name"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Field of Study</Label>
                              <Input
                                value={edu.field}
                                onChange={(e) => {
                                  const newEdu = [...profile.education];
                                  newEdu[index].field = e.target.value;
                                  setProfile({ ...profile, education: newEdu });
                                }}
                                placeholder="Computer Science"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Start Date</Label>
                              <Input
                                type="month"
                                value={edu.startDate}
                                onChange={(e) => {
                                  const newEdu = [...profile.education];
                                  newEdu[index].startDate = e.target.value;
                                  setProfile({ ...profile, education: newEdu });
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input
                                type="month"
                                value={edu.endDate}
                                onChange={(e) => {
                                  const newEdu = [...profile.education];
                                  newEdu[index].endDate = e.target.value;
                                  setProfile({ ...profile, education: newEdu });
                                }}
                                disabled={edu.current}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`edu-current-${index}`}
                                checked={edu.current}
                                onChange={(e) => {
                                  const newEdu = [...profile.education];
                                  newEdu[index].current = e.target.checked;
                                  if (e.target.checked) {
                                    newEdu[index].endDate = '';
                                  }
                                  setProfile({ ...profile, education: newEdu });
                                }}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`edu-current-${index}`}>Currently Enrolled</Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Projects</CardTitle>
                      <CardDescription>
                        Showcase your projects and achievements
                      </CardDescription>
                    </div>
                    <Button onClick={handleAddProject} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profile.projects.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="font-medium mb-2">No projects added yet</p>
                      <p className="text-sm mb-4">Showcase your work to enhance your job applications</p>
                      <Button onClick={handleAddProject} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Project
                      </Button>
                    </div>
                  ) : (
                    profile.projects.map((project, index) => (
                      <Card key={index} className="border-2">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold">Project {index + 1}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProject(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Project Name *</Label>
                              <Input
                                value={project.name || ''}
                                onChange={(e) => {
                                  const newProjects = [...profile.projects];
                                  newProjects[index].name = e.target.value;
                                  setProfile({ ...profile, projects: newProjects });
                                }}
                                placeholder="E-Commerce Platform"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Associated With</Label>
                              <Input
                                value={project.associatedWith || ''}
                                onChange={(e) => {
                                  const newProjects = [...profile.projects];
                                  newProjects[index].associatedWith = e.target.value;
                                  setProfile({ ...profile, projects: newProjects });
                                }}
                                placeholder="Personal Project, Company Name, etc."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Start Date</Label>
                              <Input
                                type="month"
                                value={project.startDate || ''}
                                onChange={(e) => {
                                  const newProjects = [...profile.projects];
                                  newProjects[index].startDate = e.target.value;
                                  setProfile({ ...profile, projects: newProjects });
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input
                                type="month"
                                value={project.endDate || ''}
                                onChange={(e) => {
                                  const newProjects = [...profile.projects];
                                  newProjects[index].endDate = e.target.value;
                                  setProfile({ ...profile, projects: newProjects });
                                }}
                                disabled={project.current}
                              />
                            </div>

                            <div className="flex items-center space-x-2 md:col-span-2">
                              <input
                                type="checkbox"
                                id={`project-current-${index}`}
                                checked={project.current}
                                onChange={(e) => {
                                  const newProjects = [...profile.projects];
                                  newProjects[index].current = e.target.checked;
                                  if (e.target.checked) {
                                    newProjects[index].endDate = '';
                                  }
                                  setProfile({ ...profile, projects: newProjects });
                                }}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`project-current-${index}`}>Currently working on this project</Label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Description 
                              <span className="text-xs text-slate-500 ml-2">
                                ({project.description?.length || 0}/1000 characters)
                              </span>
                            </Label>
                            <Textarea
                              value={project.description || ''}
                              onChange={(e) => {
                                if (e.target.value.length <= 1000) {
                                  const newProjects = [...profile.projects];
                                  newProjects[index].description = e.target.value;
                                  setProfile({ ...profile, projects: newProjects });
                                }
                              }}
                              placeholder="Describe your project, your role, key achievements, and impact..."
                              rows={4}
                              maxLength={1000}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Project URL</Label>
                            <div className="flex gap-2">
                              <Input
                                type="url"
                                value={project.url || ''}
                                onChange={(e) => {
                                  const newProjects = [...profile.projects];
                                  newProjects[index].url = e.target.value;
                                  setProfile({ ...profile, projects: newProjects });
                                }}
                                placeholder="https://project-demo.com"
                              />
                              {project.url && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => window.open(project.url, '_blank')}
                                >
                                  <Globe className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Technologies & Skills</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {project.technologies?.map((tech, techIndex) => (
                                <Badge key={techIndex} variant="secondary" className="px-3 py-1 flex items-center gap-1">
                                  <span>{tech}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveTechnology(index, tech);
                                    }}
                                    className="ml-1 hover:text-red-600 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newTechnology}
                                onChange={(e) => setNewTechnology(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTechnology(index, newTechnology);
                                    setNewTechnology('');
                                  }
                                }}
                                placeholder="Add a technology (e.g., React, Node.js)"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  handleAddTechnology(index, newTechnology);
                                  setNewTechnology('');
                                }}
                                variant="outline"
                                size="icon"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Collaborators</Label>
                            <Input
                              value={project.collaborators || ''}
                              onChange={(e) => {
                                const newProjects = [...profile.projects];
                                newProjects[index].collaborators = e.target.value;
                                setProfile({ ...profile, projects: newProjects });
                              }}
                              placeholder="e.g., John Doe, Jane Smith"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Preferences</CardTitle>
                  <CardDescription>
                    Set your job search preferences and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Remote Work Preference</Label>
                    <Select
                      value={profile.preferences.remotePreference}
                      onValueChange={(value) =>
                        setProfile({
                          ...profile,
                          preferences: { ...profile.preferences, remotePreference: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote Only</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="any">Any</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Salary (Annual)</Label>
                      <Input
                        type="number"
                        value={profile.preferences.salaryExpectation.min || ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              salaryExpectation: {
                                ...profile.preferences.salaryExpectation,
                                min: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        placeholder="50000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Maximum Salary (Annual)</Label>
                      <Input
                        type="number"
                        value={profile.preferences.salaryExpectation.max || ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              salaryExpectation: {
                                ...profile.preferences.salaryExpectation,
                                max: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        placeholder="150000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Availability</Label>
                    <Input
                      value={profile.preferences.availability}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          preferences: { ...profile.preferences, availability: e.target.value }
                        })
                      }
                      placeholder="Immediate / 2 weeks notice / 1 month notice"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Links Tab */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                  <CardDescription>
                    Connect your professional profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">
                      <Linkedin className="h-4 w-4 inline mr-2" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      value={profile.social.linkedin}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          social: { ...profile.social, linkedin: e.target.value }
                        })
                      }
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github">
                      <Github className="h-4 w-4 inline mr-2" />
                      GitHub
                    </Label>
                    <Input
                      id="github"
                      value={profile.social.github}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          social: { ...profile.social, github: e.target.value }
                        })
                      }
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">
                      <Globe className="h-4 w-4 inline mr-2" />
                      Portfolio Website
                    </Label>
                    <Input
                      id="portfolio"
                      value={profile.social.portfolio}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          social: { ...profile.social, portfolio: e.target.value }
                        })
                      }
                      placeholder="https://yourportfolio.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">
                      <svg className="h-4 w-4 inline mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter/X
                    </Label>
                    <Input
                      id="twitter"
                      value={profile.social.twitter}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          social: { ...profile.social, twitter: e.target.value }
                        })
                      }
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Floating Save Button (Only show in form mode) */}
        {!showProfileCard && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="shadow-2xl px-8 h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
