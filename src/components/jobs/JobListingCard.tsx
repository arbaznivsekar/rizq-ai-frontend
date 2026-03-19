'use client'

import Link from 'next/link'
import { Building2, Check, CheckCircle, MapPin } from 'lucide-react'

import CompanyLogo from '@/components/common/CompanyLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface JobListingCardJob {
  _id: string
  title: string
  company: string
  location: string
  description?: string
  requirements?: string[]
  salaryMin?: number
  salaryMax?: number
  url: string
  companyDomain?: string
  logoUrl?: string
}

interface Props {
  job: JobListingCardJob
  isSelected: boolean
  isAlreadyApplied: boolean
  onToggle: () => void
  onViewDetails: () => void
}

export function JobListingCard({ job, isSelected, isAlreadyApplied, onToggle, onViewDetails }: Props) {
  const skills = job.requirements ?? []
  const visibleSkills = skills.slice(0, 8)
  const extraCount = Math.max(0, skills.length - visibleSkills.length)

  return (
    <Card
      id={`job-card-${job._id}`}
      className={`w-full overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-blue-500 bg-blue-50/50'
          : isAlreadyApplied
            ? 'opacity-75 bg-slate-50'
            : 'hover:shadow-xl hover:scale-[1.01]'
      }`}
    >
      <CardHeader className="p-4">
        <div className="flex gap-3">
          {/* Checkbox */}
          <div
            className="w-11 h-11 flex items-center justify-center flex-shrink-0 cursor-pointer"
            onClick={() => {
              if (isAlreadyApplied) return
              onToggle()
            }}
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors
    ${isSelected ? 'bg-black border-black' : 'border-gray-300'}`}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="min-w-0 flex flex-col gap-3">
              <div className="min-w-0 flex flex-col gap-2">
                <CardTitle className="text-lg sm:text-xl leading-snug break-words line-clamp-2">
                  {job.title}
                </CardTitle>

                <div className="flex flex-wrap items-center gap-2">
                  {isAlreadyApplied && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Applied
                    </Badge>
                  )}
                  {job.salaryMin && job.salaryMax && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      ₹{(job.salaryMin / 100000).toFixed(1)}-{(job.salaryMax / 100000).toFixed(1)} LPA
                    </Badge>
                  )}
                </div>
              </div>

              <CardDescription className="flex flex-col gap-2 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <CompanyLogo
                    name={job.company}
                    logoUrl={job.logoUrl}
                    domain={job.companyDomain || job.url}
                    size={40}
                  />
                  <span className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{job.company}</span>
                  </span>
                </span>
                <span className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <p className="text-slate-600 line-clamp-3 text-sm break-words">
          {job.description || 'No description available'}
        </p>

        {visibleSkills.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-2 mt-3 max-w-full">
            {visibleSkills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 max-w-full truncate"
              >
                {skill}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 max-w-full truncate">
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <Button asChild className="w-full" onClick={onViewDetails}>
            <Link href={`/jobs/${job._id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

