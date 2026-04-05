'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { getApplications } from '@/lib/api';

import { Header } from '@/components/layout/Header';
import { CompanyLogo } from '@/components/common/CompanyLogo';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import {
  Briefcase,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  LayoutDashboard,
  RefreshCw,
  MapPin
} from 'lucide-react';

/* ============================================================
   Types
============================================================ */

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    location: string;
    companyDomain?: string;
    logoUrl?: string;
  };
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  createdAt: string;
  updatedAt: string;
}

/* ============================================================
   Navbar
============================================================ */

function ApplicationsNavbar({
  loading,
  onRefresh
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
          My Applications
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Track and manage your job applications
        </p>
      </div>

      <Button variant="outline" onClick={onRefresh}>
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </motion.div>
  );
}

/* ============================================================
   Stats
============================================================ */

function ApplicationStats({ applications }: { applications: Application[] }) {

  const total = applications.length;
  const pending = applications.filter(
    a => a.status === 'Applied' || a.status === 'Interview'
  ).length;

  const accepted = applications.filter(
    a => a.status === 'Offer'
  ).length;

  const rejected = applications.filter(
    a => a.status === 'Rejected'
  ).length;

  const stats = [
    {
      title: 'Total',
      value: total,
      subtitle: 'All time',
      icon: Briefcase ,
      bg: 'bg-gray-100 text-gray-700 border border-grey-200',
      border: 'border-gray-200'
    },
    {
      title: 'Pending',
      value: pending,
      subtitle: 'Awaiting reply',
      icon: Clock,
      bg: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      border: 'border-yellow-200'
    },
    {
      title: 'Accepted',
      value: accepted,
      subtitle: 'Successful',
      icon: CheckCircle ,
      bg: 'bg-green-100 text-green-700 border border-green-200',
      border: 'border-green-200'
    },
    {
      title: 'Rejected',
      value: rejected,
      subtitle: 'Keep going!',
      icon: XCircle,
      bg: 'bg-red-100',
      border: 'border-red-200 text-red-700 border border-red-200'
    }
  ];

  return (
    <div className="mb-8">

      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          Application Stats
        </h2>

        <p className="text-sm text-muted-foreground">
          Your complete job search overview
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`${stat.bg} ${stat.border} border rounded-2xl shadow-sm hover:shadow-md transition-all`}
            >
              <CardContent className="p-5">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {stat.title}
                    </p>

                    <p className="text-3xl font-bold mt-2">
                      {stat.value}
                    </p>

                    <p className="text-xs text-muted-foreground mt-2">
                      {stat.subtitle}
                    </p>

                  </div>

                  <stat.icon className="h-5 w-5 text-muted-foreground" />

                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}

      </div>
    </div>
  );
}

/* ============================================================
   Recent Applications
============================================================ */

function RecentApplications({ applications }: { applications: Application[] }) {

  const recent = [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  if (recent.length === 0) {
    return (
      <div className="text-center py-10">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No recent applications</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {recent.map((app) => (
        <motion.div
          key={app._id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border bg-white/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">

              <Badge className="mb-2">{app.status}</Badge>

              <div className="flex gap-3">
                <CompanyLogo
                  name={app.jobId.company}
                  logoUrl={app.jobId.logoUrl}
                  domain={app.jobId.companyDomain}
                  size={32}
                />

                <div>
                  <Link
                    href={`/jobs/${app.jobId._id}`}
                    className="font-semibold block hover:text-blue-600"
                  >
                    {app.jobId.title}
                  </Link>

                  <p className="text-sm text-muted-foreground">
                    {app.jobId.company}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ============================================================
   Page
============================================================ */

export default function ApplicationsPage() {

  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'rejected' | 'recent'>('all');

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else {
        fetchApplications();
      }
    }
  }, [authLoading, isAuthenticated]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await getApplications();
      if (response.success && response.data) setApplications(response.data);
      if (response.items) setApplications(response.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'recent') return true;
    if (filter === 'pending') return app.status === 'Applied' || app.status === 'Interview';
    if (filter === 'rejected') return app.status === 'Rejected';
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24 md:pb-8">

      <Header />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 py-6 md:py-8"
      >

        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <ApplicationsNavbar
          loading={loading}
          onRefresh={fetchApplications}
        />

        <ApplicationStats applications={applications} />

        <Separator className="mb-6" />

        <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>

          <TabsList className="grid grid-cols-4 w-full mb-6 bg-white/60 backdrop-blur-md border rounded-xl p-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>

            <Card className="border bg-white/60 backdrop-blur-md shadow-sm">

              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  View and manage your job applications
                </CardDescription>
              </CardHeader>

              <CardContent>

                {loading ? (

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array(8).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full" />
                    ))}
                  </div>

                ) : filteredApplications.length === 0 ? (

                  <div className="text-center py-16">

                    <FileText className="h-14 w-14 mx-auto mb-4 text-muted-foreground" />

                    <h3 className="text-lg font-semibold mb-2">
                      No applications found
                    </h3>

                    <Button asChild className="bg-black hover:bg-neutral-800 mt-4">
                      <Link href="/jobs">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Browse Jobs
                      </Link>
                    </Button>

                  </div>

                ) : (

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                    {filteredApplications.map((app) => (

                      <motion.div
                        key={app._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="p-4 border bg-white/60 backdrop-blur-md shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">

                          <Badge className="mb-3">
                            {app.status}
                          </Badge>

                          <div className="flex gap-3 mb-3">

                            <CompanyLogo
                              name={app.jobId.company}
                              logoUrl={app.jobId.logoUrl}
                              domain={app.jobId.companyDomain}
                              size={36}
                            />

                            <div>
                              <Link
                                href={`/jobs/${app.jobId._id}`}
                                className="font-semibold block hover:text-blue-600"
                              >
                                {app.jobId.title}
                              </Link>

                              <p className="text-sm text-muted-foreground">
                                {app.jobId.company}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {app.jobId.location}

                            <Calendar className="h-3 w-3 ml-2" />
                            {new Date(app.createdAt).toLocaleDateString()}
                          </div>

                        </Card>
                      </motion.div>
                    ))}

                  </div>
                )}

              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="recent">

            <Card className="border bg-white/60 backdrop-blur-md shadow-sm">

              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>
                  Your latest applied jobs
                </CardDescription>
              </CardHeader>

              <CardContent>
                <RecentApplications applications={applications} />
              </CardContent>

            </Card>

          </TabsContent>

        </Tabs>

      </motion.div>

      {/* Mobile CTA */}

      <div className="fixed bottom-4 left-4 right-4 md:hidden">

        <Button
          asChild
          className="w-full bg-black text-white hover:bg-neutral-800 h-14 text-lg shadow-lg"
        >
          <Link href="/jobs">
            <Briefcase className="h-5 w-5 mr-2" />
            Browse Jobs
          </Link>
        </Button>

      </div>

    </div>
  );
}