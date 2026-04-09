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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Link2, Github, Linkedin, Globe, Save, Loader2, Plus, X,
  Settings, Award, Edit2, Check, Calendar, Building2, ArrowLeft,
  MoreHorizontal, Share2, Download, ExternalLink, ChevronRight,
} from 'lucide-react';


import dynamic from 'next/dynamic';

const MarkdownEditor = dynamic(
  () => import('@/components/ui/markdown-editor').then(m => ({ default: m.MarkdownEditor })),
  {
    ssr: false,
    loading: () => <textarea className="w-full h-24 text-sm border rounded-md p-2 resize-none" placeholder="Describe your responsibilities..." />
  }
);
// ─── Types ────────────────────────────────────────────────────────────────────

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
    salaryExpectation: { min: number; max: number; currency: string };
    availability: string;
  };
  social: {
    linkedin: string;
    github: string;
    portfolio: string;
    twitter: string;
  };
}

const emptyProfile: ProfileData = {
  name: '', email: '', phone: '', location: '', bio: '', headline: '',
  skills: [], experience: [], education: [], projects: [],
  preferences: {
    jobTypes: [], locations: [], remotePreference: 'any',
    salaryExpectation: { min: 0, max: 0, currency: 'USD' },
    availability: '',
  },
  social: { linkedin: '', github: '', portfolio: '', twitter: '' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  if (!dateString?.trim()) return 'Present';
  let d: Date;
  if (/^\d{4}-\d{2}$/.test(dateString)) d = new Date(dateString + '-01');
  else d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─── Sub‑components (Profile Card View) ───────────────────────────────────────

function ProfileHero({
  profile,
  user,
  onEdit,
}: {
  profile: ProfileData;
  user: { name?: string } | null;
  onEdit: () => void;
}) {
  const initials = (profile.name || user?.name || 'U').charAt(0).toUpperCase();
  const hasVerified = !!profile.headline;

  return (
    <div className="relative w-full">
      <div className="h-28 w-full bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 rounded-t-2xl" />

      <Card className="mx-4 -mt-12 rounded-2xl shadow-xl border-0 overflow-visible">
        <CardContent className="pt-0 pb-5 px-4">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-background shadow-lg">
                {initials}
              </div>
              {hasVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <Button size="sm" variant="outline" onClick={onEdit} className="rounded-full gap-1.5 h-8 px-3">
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>

          <h1 className="text-xl font-bold text-foreground leading-tight">
            {profile.name || 'Your Name'}
          </h1>
          {profile.headline && (
            <p className="text-sm text-violet-600 font-medium mt-0.5 leading-snug">
              {profile.headline}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {profile.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />{profile.location}
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />{profile.phone}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />{profile.email}
            </span>
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm text-foreground leading-relaxed line-clamp-3">
              {profile.bio}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileStats({ profile }: { profile: ProfileData }) {
  const stats = [
    { value: profile.experience?.length ?? 0, label: 'Roles' },
    { value: profile.skills?.length ?? 0, label: 'Skills' },
    { value: profile.projects?.length ?? 0, label: 'Projects' },
    { value: profile.education?.length ?? 0, label: 'Education' },
  ];

  return (
    <div className="mx-4 mt-3">
      <Card className="rounded-2xl border-0 shadow-sm bg-muted/50">
        <CardContent className="py-3 px-2">
          <div className="grid grid-cols-4 divide-x divide-border">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5 px-2">
                <span className="text-lg font-bold text-foreground">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileActions({
  profile,
  onMore,
}: {
  profile: ProfileData;
  onMore: () => void;
}) {
  return (
    <div className="mx-4 mt-3 flex gap-2">
      {profile.social?.linkedin && (
        <Button variant="outline" size="icon" className="rounded-xl h-10 w-10" asChild>
          <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin className="h-4 w-4 text-blue-600" />
          </a>
        </Button>
      )}
      {profile.social?.github && (
        <Button variant="outline" size="icon" className="rounded-xl h-10 w-10" asChild>
          <a href={profile.social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github className="h-4 w-4" />
          </a>
        </Button>
      )}
      {profile.social?.portfolio && (
        <Button variant="outline" size="icon" className="rounded-xl h-10 w-10" asChild>
          <a href={profile.social.portfolio} target="_blank" rel="noopener noreferrer" aria-label="Portfolio">
            <Globe className="h-4 w-4 text-blue-600" />
          </a>
        </Button>
      )}
      
      <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 ml-auto" onClick={onMore} aria-label="More options">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ExperienceItem({ exp }: { exp: ProfileData['experience'][number] }) {
  return (
    <div className="relative pl-7">
      <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-violet-500 border-2 border-background shadow" />
      <div className="absolute left-[5px] top-4 bottom-0 w-px bg-violet-100" />

      <p className="text-sm font-semibold text-foreground leading-snug">{exp.title}</p>
      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />{exp.company}
        </span>
        {exp.location && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />{exp.location}
          </span>
        )}
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
        <Calendar className="h-3 w-3" />
        {formatDate(exp.startDate)} — {exp.current ? 'Present' : formatDate(exp.endDate)}
        {exp.current && <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4">Now</Badge>}
      </span>
      {exp.description && (() => {
        const bullets = exp.description
          .split('\n')
          .map(l => l.replace(/^[\s]*[-*•]\s*/, '').trim())
          .filter(l => l.length > 0);
        return bullets.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {bullets.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                <span className="mt-[5px] w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        ) : null;
      })()}
    </div>
  );
}

function EducationItem({ edu }: { edu: ProfileData['education'][number] }) {
  return (
    <div className="relative pl-7">
      <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-indigo-400 border-2 border-background shadow" />
      <div className="absolute left-[5px] top-4 bottom-0 w-px bg-indigo-100" />

      <p className="text-sm font-semibold text-foreground">{edu.degree}</p>
      <p className="text-xs font-medium text-muted-foreground mt-0.5">{edu.institution}</p>
      {edu.field && <p className="text-xs text-muted-foreground">{edu.field}</p>}
      {edu.startDate && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Calendar className="h-3 w-3" />
          {formatDate(edu.startDate)} — {edu.current ? 'Present' : formatDate(edu.endDate)}
          {edu.current && <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4">Now</Badge>}
        </span>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: ProfileData['projects'][number] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="rounded-2xl border shadow-sm overflow-hidden">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-snug">{project.name}</p>
            {project.associatedWith && (
              <p className="text-xs text-muted-foreground mt-0.5">
                <Building2 className="h-3 w-3 inline mr-1" />{project.associatedWith}
              </p>
            )}
          </div>
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 text-blue-600 hover:text-blue-700">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {(project.startDate || project.current) && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(project.startDate)} — {project.current ? 'Present' : formatDate(project.endDate)}
          </span>
        )}

        {project.description && (
          <p className={`text-xs text-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {project.description}
          </p>
        )}
        {project.description && (project.description?.length ?? 0) > 120 && (
          <button onClick={() => setExpanded(!expanded)}
            className="text-xs text-violet-600 font-medium">
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

{Array.isArray(project.technologies) && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {project.technologies?.map((t, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0">{t}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Profile Card View ────────────────────────────────────────────────────────

function ProfileCardView({
  profile,
  user,
  onEdit,
}: {
  profile: ProfileData;
  user: { name?: string } | null;
  onEdit: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="pb-32">
      <ProfileHero profile={profile} user={user} onEdit={onEdit} />
      <ProfileStats profile={profile} />
      <ProfileActions profile={profile} onMore={() => setMoreOpen(true)} />

      <div className="mx-4 mt-4">
        <Tabs defaultValue="overview">
          <TabsList className="w-full rounded-2xl bg-muted p-1 h-auto grid grid-cols-4 gap-1">
            {[
              { value: 'overview', label: 'About' },
              { value: 'experience', label: 'Work' },
              { value: 'education', label: 'Study' },
              { value: 'skills', label: 'Skills' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl text-xs font-medium py-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-3 space-y-3">
            {profile.bio && (
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">About</p>
                  <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {(profile.social?.linkedin || profile.social?.github || profile.social?.portfolio || profile.social?.twitter) && (
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Links</p>
                  <div className="space-y-2">
                    {[
                      { url: profile.social?.linkedin, icon: <Linkedin className="h-4 w-4 text-blue-600" />, label: 'LinkedIn' },
                      { url: profile.social?.github, icon: <Github className="h-4 w-4" />, label: 'GitHub' },
                      { url: profile.social?.portfolio, icon: <Globe className="h-4 w-4 text-blue-600" />, label: 'Portfolio' },
                      { url: profile.social?.twitter, icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>, label: 'Twitter/X' },
                    ].filter(l => l.url).map(link => (
                      <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                        <div className="flex items-center gap-2">
                          {link.icon}
                          <span className="text-sm font-medium">{link.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(profile.projects?.length ?? 0) > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Projects</p>
                  <div className="space-y-3">
                    {profile.projects?.map((p, i) => <ProjectCard key={i} project={p} />)}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="experience" className="mt-3">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-4">
                {(profile.experience?.length ?? 0) === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No experience added yet.
                    <br />
                    <button onClick={onEdit} className="text-violet-600 font-medium mt-1 text-xs">Add experience →</button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {profile.experience?.map((exp, i) => <ExperienceItem key={i} exp={exp} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="mt-3">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-4">
                {(profile.education?.length ?? 0) === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No education added yet.
                    <br />
                    <button onClick={onEdit} className="text-violet-600 font-medium mt-1 text-xs">Add education →</button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {profile.education?.map((edu, i) => <EducationItem key={i} edu={edu} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="mt-3">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-4">
                {(profile.skills?.length ?? 0) === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No skills added yet.
                    <br />
                    <button onClick={onEdit} className="text-violet-600 font-medium mt-1 text-xs">Add skills →</button>
                  </div>
                ) : (
                  <ScrollArea className="max-h-72">
                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1 text-xs rounded-full">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base">More Options</SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {[
              { icon: <Share2 className="h-4 w-4" />, label: 'Share Profile', action: () => { navigator.share?.({ title: profile.name, url: window.location.href }); setMoreOpen(false); } },
              { icon: <Edit2 className="h-4 w-4" />, label: 'Edit Profile', action: () => { onEdit(); setMoreOpen(false); } },
              { icon: <Download className="h-4 w-4" />, label: 'Download Resume', action: () => setMoreOpen(false) },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left">
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="flex gap-3 items-end">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [newSkill, setNewSkill] = useState('');
  const [newTechnology, setNewTechnology] = useState('');
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number | null>(null);
  const [activeEditTab, setActiveEditTab] = useState('basic');
  useEffect(() => {
    const activeTab = document.querySelector(
      `[data-edit-tab="${activeEditTab}"]`
    ) as HTMLElement | null
  
    activeTab?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    })
  }, [activeEditTab])
  const scrollRestoreKey = 'profile_scroll_position';

  useEffect(() => {
    const h = () => sessionStorage.setItem(scrollRestoreKey, window.scrollY.toString());
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !loading) {
      const saved = sessionStorage.getItem(scrollRestoreKey);
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(saved, 10));
          sessionStorage.removeItem(scrollRestoreKey);
        });
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [authLoading, isAuthenticated, loading]);

  useEffect(() => {
    if (!loading) {
      try { localStorage.setItem('profileViewMode', showProfileCard ? 'card' : 'edit'); } catch { }
    }
  }, [showProfileCard, loading]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push('/auth/login');
      else fetchProfile();
    }
  }, [isAuthenticated, authLoading]);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
  
      if (response.success && response.data?.profile) {
        const p = response.data.profile;
  
        const normalizedProjects = Array.isArray(p.projects)
          ? p.projects.map((project: any) => ({
              name: project?.name || '',
              associatedWith: project?.associatedWith || '',
              startDate: project?.startDate || '',
              endDate: project?.endDate || '',
              current: !!project?.current,
              description: project?.description || '',
              url: project?.url || '',
              technologies: Array.isArray(project?.technologies) ? project.technologies : [],
              media: Array.isArray(project?.media) ? project.media : [],
              collaborators: project?.collaborators || '',
            }))
          : [];
  
        const normalizedExperience = Array.isArray(p.experience)
          ? p.experience.map((exp: any) => ({
              title: exp?.title || '',
              company: exp?.company || '',
              location: exp?.location || '',
              startDate: exp?.startDate || '',
              endDate: exp?.endDate || '',
              current: !!exp?.current,
              description: exp?.description || '',
            }))
          : [];
  
        const normalizedEducation = Array.isArray(p.education)
          ? p.education.map((edu: any) => ({
              degree: edu?.degree || '',
              institution: edu?.institution || '',
              field: edu?.field || '',
              startDate: edu?.startDate || '',
              endDate: edu?.endDate || '',
              current: !!edu?.current,
            }))
          : [];
  
        const hasData =
          !!p.name ||
          !!p.headline ||
          (Array.isArray(p.skills) && p.skills.length > 0) ||
          normalizedProjects.length > 0;
  
        setProfile({
          _id: p._id,
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          location: p.location || '',
          bio: p.bio || '',
          headline: p.headline || '',
          skills: Array.isArray(p.skills) ? p.skills : [],
          experience: normalizedExperience,
          education: normalizedEducation,
          projects: normalizedProjects,
          preferences: {
            jobTypes: Array.isArray(p.preferences?.jobTypes) ? p.preferences.jobTypes : [],
            locations: Array.isArray(p.preferences?.locations) ? p.preferences.locations : [],
            remotePreference: p.preferences?.remotePreference || 'any',
            salaryExpectation: {
              min: p.preferences?.salaryExpectation?.min || 0,
              max: p.preferences?.salaryExpectation?.max || 0,
              currency: p.preferences?.salaryExpectation?.currency || 'USD',
            },
            availability: p.preferences?.availability || '',
          },
          social: {
            linkedin: p.social?.linkedin || '',
            github: p.social?.github || '',
            portfolio: p.social?.portfolio || '',
            twitter: p.social?.twitter || '',
          },
        });
  
        try {
          const savedView = localStorage.getItem('profileViewMode');
          setShowProfileCard(savedView !== null ? savedView === 'card' : !!hasData);
        } catch {
          setShowProfileCard(!!hasData);
        }
      } else {
        setShowProfileCard(false);
      }
    } catch {
      toast.error('Failed to load profile');
      setShowProfileCard(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const sanitized: ProfileData = {
      ...profile,
      headline: profile.headline?.slice(0, 100) || '',
      bio: profile.bio?.slice(0, 500) || '',
      experience: profile.experience.map(e => ({ ...e, description: e.description?.slice(0, 1000) || '' })),
      projects: profile.projects.map(p => ({ ...p, description: p.description?.slice(0, 1000) || '' })),
    };
    setSaving(true);
    try {
      const res = await updateProfile(sanitized);
      if (res.success) {
        toast.success('Profile updated!');
        await fetchProfile();
        await refreshUser();
        setShowProfileCard(true);
        try {
          localStorage.setItem('profileViewMode', 'card');
        } catch { }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };
  const handleRemoveSkill = (s: string) =>
    setProfile({ ...profile, skills: profile.skills.filter(x => x !== s) });

  const handleAddExperience = () =>
    setProfile({ ...profile, experience: [...profile.experience, { title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' }] });
  const handleRemoveExperience = (i: number) =>
    setProfile({ ...profile, experience: profile.experience.filter((_, idx) => idx !== i) });

  const handleAddEducation = () =>
    setProfile({ ...profile, education: [...profile.education, { degree: '', institution: '', field: '', startDate: '', endDate: '', current: false }] });
  const handleRemoveEducation = (i: number) =>
    setProfile({ ...profile, education: profile.education.filter((_, idx) => idx !== i) });

  const handleAddProject = () =>
    setProfile({ ...profile, projects: [...profile.projects, { name: '', associatedWith: '', startDate: '', endDate: '', current: false, description: '', url: '', technologies: [], media: [], collaborators: '' }] });
  const handleRemoveProject = (i: number) =>
    setProfile({ ...profile, projects: profile.projects.filter((_, idx) => idx !== i) });
  const handleAddTechnology = (pi: number, tech: string) => {
    const value = tech.trim();
    if (!value) return;
  
    const np = [...profile.projects];
    if (!np[pi]) return;
  
    np[pi] = {
      ...np[pi],
      technologies: Array.isArray(np[pi].technologies) ? np[pi].technologies : [],
    };
  
    if (np[pi].technologies.includes(value)) return;
  
    np[pi].technologies = [...np[pi].technologies, value];
    setProfile({ ...profile, projects: np });
  };
  const handleRemoveTechnology = (pi: number, tech: string) => {
    const np = [...profile.projects];
    if (!np[pi]) return;
  
    np[pi] = {
      ...np[pi],
      technologies: Array.isArray(np[pi].technologies) ? np[pi].technologies : [],
    };
  
    np[pi].technologies = np[pi].technologies.filter(t => t !== tech);
    setProfile({ ...profile, projects: np });
  };
  const handleBack = () => {
    const saved = sessionStorage.getItem('paginationState');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        const p = new URLSearchParams();
        if (s.query) p.set('q', s.query);
        if (s.location) p.set('location', s.location);
        router.push(`/?${p.toString()}`);
      } catch { router.push('/'); }
    } else router.push('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-16"><Loader2 className="h-10 w-10 animate-spin text-violet-600" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />

      <div className="w-full max-w-lg mx-auto">

        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-9 w-9" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground">
            {showProfileCard ? 'Your Profile' : 'Edit Profile'}
          </span>
        </div>

        {loading ? (
          <ProfileSkeleton />
        ) : showProfileCard ? (
          <ProfileCardView profile={profile} user={user} onEdit={() => setShowProfileCard(false)} />
        ) : (
          <div className="px-4 pb-32 space-y-4">

<Tabs value={activeEditTab} onValueChange={setActiveEditTab}>
  <div className="-mx-4 mb-1 overflow-x-auto px-4 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
    <TabsList className="flex w-max min-w-full flex-nowrap gap-2 rounded-2xl bg-muted p-1 h-auto">
      {[
        { value: 'basic', icon: <User className="h-3 w-3" />, label: 'Basic' },
        { value: 'experience', icon: <Briefcase className="h-3 w-3" />, label: 'Work' },
        { value: 'education', icon: <GraduationCap className="h-3 w-3" />, label: 'Education' },
        { value: 'projects', icon: <Award className="h-3 w-3" />, label: 'Projects' },
        { value: 'preferences', icon: <Settings className="h-3 w-3" />, label: 'Prefs' },
        { value: 'social', icon: <Link2 className="h-3 w-3" />, label: 'Social' },
      ].map(tab => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          data-edit-tab={tab.value}
          className="shrink-0 rounded-xl text-xs font-medium px-3 py-2 gap-1.5 whitespace-nowrap data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
        >
          {tab.icon}{tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </div>

              {/* ── Basic tab ── */}
              <TabsContent value="basic" className="space-y-4 mt-3">
                <Card className="rounded-2xl shadow-sm border-0">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Personal Info</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'name', label: 'Full Name', icon: <User className="h-3.5 w-3.5" />, value: profile.name, placeholder: 'John Doe', onChange: (v: string) => setProfile({ ...profile, name: v }) },
                        { id: 'phone', label: 'Phone', icon: <Phone className="h-3.5 w-3.5" />, value: profile.phone, placeholder: '+91 98765 43210', onChange: (v: string) => setProfile({ ...profile, phone: v }) },
                        { id: 'location', label: 'Location', icon: <MapPin className="h-3.5 w-3.5" />, value: profile.location, placeholder: 'Mumbai, India', onChange: (v: string) => setProfile({ ...profile, location: v }) },
                      ].map(f => (
                        <div key={f.id} className="space-y-1.5">
                          <Label htmlFor={f.id} className="text-xs flex items-center gap-1">{f.icon}{f.label}</Label>
                          <Input id={f.id} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} className="h-9 text-sm" />
                        </div>
                      ))}
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Email</Label>
                        <Input id="email" value={profile.email} disabled className="h-9 text-sm bg-muted" />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                      <Label htmlFor="headline" className="text-xs flex items-center gap-1"><Award className="h-3.5 w-3.5" />Headline</Label>
                      <Input id="headline" value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value })} placeholder="Senior Engineer | ML Enthusiast" maxLength={100} className="h-9 text-sm" />
                      <p className="text-[10px] text-muted-foreground text-right">{profile.headline?.length ?? 0}/100</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bio" className="text-xs">Bio</Label>
                      <Textarea id="bio" value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} maxLength={500} className="text-sm resize-none" />
                      <p className="text-[10px] text-muted-foreground text-right">{profile.bio?.length ?? 0}/500</p>
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                      <Label className="text-xs">Skills</Label>
                      <div className="flex gap-2">
                        <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="e.g. React, Python" onKeyDown={e => e.key === 'Enter' && handleAddSkill()} className="h-9 text-sm" />
                        <Button onClick={handleAddSkill} size="sm" className="h-9 px-3"><Plus className="h-4 w-4" /></Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {profile.skills?.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="pl-3 pr-1.5 py-1 text-xs rounded-full flex items-center gap-1">
                            {skill}
                            <button onClick={() => handleRemoveSkill(skill)} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Experience tab ── */}
              <TabsContent value="experience" className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Work Experience</span>
                  <Button onClick={handleAddExperience} variant="outline" size="sm" className="h-8 gap-1 rounded-xl text-xs">
                    <Plus className="h-3.5 w-3.5" />Add
                  </Button>
                </div>
                {(profile.experience?.length ?? 0) === 0 ? (
                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="py-10 flex flex-col items-center text-center gap-2">
                      <Briefcase className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No experience yet</p>
                      <Button onClick={handleAddExperience} variant="outline" size="sm" className="rounded-xl mt-1"><Plus className="h-3 w-3 mr-1" />Add Experience</Button>
                    </CardContent>
                  </Card>
                ) : profile.experience?.map((exp, i) => (
                  <Card key={i} className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role {i + 1}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveExperience(i)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Job Title', value: exp.title, ph: 'Software Engineer', key: 'title' },
                          { label: 'Company', value: exp.company, ph: 'Tech Corp', key: 'company' },
                          { label: 'Location', value: exp.location, ph: 'Mumbai, India', key: 'location' },
                        ].map(f => (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-xs">{f.label}</Label>
                            <Input value={f.value} placeholder={f.ph} className="h-8 text-sm"
                              onChange={e => { const n = [...profile.experience]; (n[i] as any)[f.key] = e.target.value; setProfile({ ...profile, experience: n }); }} />
                          </div>
                        ))}
                        <div className="space-y-1">
                          <Label className="text-xs">Start Date</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{4}-\d{2}"
                            placeholder="YYYY-MM"
                            value={exp.startDate}
                            className="h-8 text-sm"
                            onChange={e => { const n = [...profile.experience]; n[i].startDate = e.target.value; setProfile({ ...profile, experience: n }); }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End Date</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{4}-\d{2}"
                            placeholder="YYYY-MM"
                            value={exp.endDate}
                            disabled={exp.current}
                            className="h-8 text-sm"
                            onChange={e => { const n = [...profile.experience]; n[i].endDate = e.target.value; setProfile({ ...profile, experience: n }); }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id={`cur-${i}`} checked={exp.current}
                            onChange={e => { const n = [...profile.experience]; n[i].current = e.target.checked; if (e.target.checked) n[i].endDate = ''; setProfile({ ...profile, experience: n }); }}
                            className="h-4 w-4 rounded" />
                          <Label htmlFor={`cur-${i}`} className="text-xs">Current Role</Label>
                        </div>
                      </div>
                      <MarkdownEditor label="Description" value={exp.description ?? ''} maxLength={1000}
                        onChange={v => { const n = [...profile.experience]; n[i].description = v; setProfile({ ...profile, experience: n }); }}
                        placeholder="Describe your responsibilities and achievements..." />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* ── Education tab ── */}
              <TabsContent value="education" className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Education</span>
                  <Button onClick={handleAddEducation} variant="outline" size="sm" className="h-8 gap-1 rounded-xl text-xs"><Plus className="h-3.5 w-3.5" />Add</Button>
                </div>
                {(profile.education?.length ?? 0) === 0 ? (
                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="py-10 flex flex-col items-center text-center gap-2">
                      <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No education yet</p>
                      <Button onClick={handleAddEducation} variant="outline" size="sm" className="rounded-xl mt-1"><Plus className="h-3 w-3 mr-1" />Add Education</Button>
                    </CardContent>
                  </Card>
                ) : profile.education?.map((edu, i) => (
                  <Card key={i} className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Degree {i + 1}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveEducation(i)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Degree', value: edu.degree, ph: 'B.Sc Computer Science', key: 'degree' },
                          { label: 'Institution', value: edu.institution, ph: 'University Name', key: 'institution' },
                          { label: 'Field of Study', value: edu.field, ph: 'Computer Science', key: 'field' },
                        ].map(f => (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-xs">{f.label}</Label>
                            <Input value={f.value} placeholder={f.ph} className="h-8 text-sm"
                              onChange={e => { const n = [...profile.education]; (n[i] as any)[f.key] = e.target.value; setProfile({ ...profile, education: n }); }} />
                          </div>
                        ))}
                        <div className="space-y-1">
                          <Label className="text-xs">Start Date</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{4}-\d{2}"
                            placeholder="YYYY-MM"
                            value={edu.startDate}
                            className="h-8 text-sm"
                            onChange={e => { const n = [...profile.education]; n[i].startDate = e.target.value; setProfile({ ...profile, education: n }); }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End Date</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{4}-\d{2}"
                            placeholder="YYYY-MM"
                            value={edu.endDate}
                            disabled={edu.current}
                            className="h-8 text-sm"
                            onChange={e => { const n = [...profile.education]; n[i].endDate = e.target.value; setProfile({ ...profile, education: n }); }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id={`edu-cur-${i}`} checked={edu.current}
                            onChange={e => { const n = [...profile.education]; n[i].current = e.target.checked; if (e.target.checked) n[i].endDate = ''; setProfile({ ...profile, education: n }); }}
                            className="h-4 w-4 rounded" />
                          <Label htmlFor={`edu-cur-${i}`} className="text-xs">Currently Enrolled</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* ── Projects tab ── */}
              <TabsContent value="projects" className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Projects</span>
                  <Button onClick={handleAddProject} variant="outline" size="sm" className="h-8 gap-1 rounded-xl text-xs"><Plus className="h-3.5 w-3.5" />Add</Button>
                </div>
                {(profile.projects?.length ?? 0) === 0 ? (
                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="py-10 flex flex-col items-center text-center gap-2">
                      <Award className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No projects yet</p>
                      <Button onClick={handleAddProject} variant="outline" size="sm" className="rounded-xl mt-1"><Plus className="h-3 w-3 mr-1" />Add Project</Button>
                    </CardContent>
                  </Card>
                ) : profile.projects?.map((project, i) => (
                  <Card key={i} className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project {i + 1}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveProject(i)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Project Name *', value: project.name, ph: 'E-Commerce Platform', key: 'name' },
                          { label: 'Associated With', value: project.associatedWith, ph: 'Personal / Company', key: 'associatedWith' },
                        ].map(f => (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-xs">{f.label}</Label>
                            <Input value={f.value} placeholder={f.ph} className="h-8 text-sm"
                              onChange={e => { const n = [...profile.projects]; (n[i] as any)[f.key] = e.target.value; setProfile({ ...profile, projects: n }); }} />
                          </div>
                        ))}
                        <div className="space-y-1">
                          <Label className="text-xs">Start Date</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{4}-\d{2}"
                            placeholder="YYYY-MM"
                            value={project.startDate}
                            className="h-8 text-sm"
                            onChange={e => { const n = [...profile.projects]; n[i].startDate = e.target.value; setProfile({ ...profile, projects: n }); }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End Date</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{4}-\d{2}"
                            placeholder="YYYY-MM"
                            value={project.endDate}
                            disabled={project.current}
                            className="h-8 text-sm"
                            onChange={e => { const n = [...profile.projects]; n[i].endDate = e.target.value; setProfile({ ...profile, projects: n }); }} />
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <input type="checkbox" id={`proj-cur-${i}`} checked={project.current}
                            onChange={e => { const n = [...profile.projects]; n[i].current = e.target.checked; if (e.target.checked) n[i].endDate = ''; setProfile({ ...profile, projects: n }); }}
                            className="h-4 w-4 rounded" />
                          <Label htmlFor={`proj-cur-${i}`} className="text-xs">Currently working on this</Label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Description <span className="text-muted-foreground">({project.description?.length ?? 0}/1000)</span></Label>
                        <Textarea value={project.description ?? ''} placeholder="Describe your project..." rows={3} maxLength={1000} className="text-sm resize-none"
                          onChange={e => { if (e.target.value.length <= 1000) { const n = [...profile.projects]; n[i].description = e.target.value; setProfile({ ...profile, projects: n }); } }} />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Project URL</Label>
                        <div className="flex gap-2">
                          <Input type="url" value={project.url ?? ''} placeholder="https://project.com" className="h-8 text-sm"
                            onChange={e => { const n = [...profile.projects]; n[i].url = e.target.value; setProfile({ ...profile, projects: n }); }} />
                          {project.url && (
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.open(project.url, '_blank')}><Globe className="h-3.5 w-3.5" /></Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Technologies</Label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {Array.isArray(project.technologies) && project.technologies.map((tech, ti) => (
                            <Badge key={ti} variant="secondary" className="pl-2.5 pr-1.5 py-0.5 text-[11px] rounded-full flex items-center gap-1">
                              {tech}
                              <button onClick={() => handleRemoveTechnology(i, tech)} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input value={newTechnology} placeholder="e.g. React, Node.js" className="h-8 text-sm"
                            onChange={e => setNewTechnology(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { handleAddTechnology(i, newTechnology); setNewTechnology(''); } }} />
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => { handleAddTechnology(i, newTechnology); setNewTechnology(''); }}><Plus className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Collaborators</Label>
                        <Input value={project.collaborators ?? ''} placeholder="e.g. John Doe, Jane Smith" className="h-8 text-sm"
                          onChange={e => { const n = [...profile.projects]; n[i].collaborators = e.target.value; setProfile({ ...profile, projects: n }); }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* ── Preferences tab ── */}
              <TabsContent value="preferences" className="mt-3">
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Job Preferences</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Remote Preference</Label>
                      <Select value={profile.preferences?.remotePreference ?? 'any'}
                        onValueChange={v => setProfile({ ...profile, preferences: { ...profile.preferences, remotePreference: v } })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['remote', 'hybrid', 'onsite', 'any'].map(v => (
                            <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Min Salary', key: 'min', value: profile.preferences?.salaryExpectation?.min ?? 0 },
                        { label: 'Max Salary', key: 'max', value: profile.preferences?.salaryExpectation?.max ?? 0 },
                      ].map(f => (
                        <div key={f.key} className="space-y-1">
                          <Label className="text-xs">{f.label}</Label>
                          <Input type="number" value={f.value || ''} placeholder="0" className="h-9 text-sm"
                            onChange={e => setProfile({ ...profile, preferences: { ...profile.preferences, salaryExpectation: { ...profile.preferences.salaryExpectation, [f.key]: parseInt(e.target.value) || 0 } } })} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Availability</Label>
                      <Input value={profile.preferences?.availability ?? ''} placeholder="Immediate / 2 weeks notice" className="h-9 text-sm"
                        onChange={e => setProfile({ ...profile, preferences: { ...profile.preferences, availability: e.target.value } })} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Social tab ── */}
              <TabsContent value="social" className="mt-3">
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Social Links</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="h-3.5 w-3.5 text-blue-600" />, value: profile.social?.linkedin ?? '', ph: 'https://linkedin.com/in/username', key: 'linkedin' },
                      { id: 'github', label: 'GitHub', icon: <Github className="h-3.5 w-3.5" />, value: profile.social?.github ?? '', ph: 'https://github.com/username', key: 'github' },
                      { id: 'portfolio', label: 'Portfolio', icon: <Globe className="h-3.5 w-3.5 text-blue-600" />, value: profile.social?.portfolio ?? '', ph: 'https://yourportfolio.com', key: 'portfolio' },
                      { id: 'twitter', label: 'Twitter/X', icon: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>, value: profile.social?.twitter ?? '', ph: 'https://twitter.com/username', key: 'twitter' },
                    ].map(f => (
                      <div key={f.id} className="space-y-1.5">
                        <Label htmlFor={f.id} className="text-xs flex items-center gap-1.5">{f.icon}{f.label}</Label>
                        <Input id={f.id} value={f.value} placeholder={f.ph} className="h-9 text-sm"
                          onChange={e => setProfile({ ...profile, social: { ...profile.social, [f.key]: e.target.value } })} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {!showProfileCard && !loading && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t px-4 py-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-lg mx-auto flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl text-sm" disabled={saving}
              onClick={() => setShowProfileCard(true)}>
              Cancel
            </Button>
            <Button className="flex-1 h-12 rounded-xl text-sm font-semibold gap-2 bg-violet-600 hover:bg-violet-700" disabled={saving} onClick={handleSave}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save Profile</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
