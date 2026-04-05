'use client'

import Link from 'next/link'
import { Check, CheckCircle, MapPin, ChevronRight } from 'lucide-react'

import CompanyLogo from '@/components/common/CompanyLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
  const visibleSkills = skills.slice(0, 5)
  const extraCount = Math.max(0, skills.length - visibleSkills.length)

  return (
    <Card
      id={`job-card-${job._id}`}
      className={`w-full overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-blue-500 bg-blue-50/30'
          : isAlreadyApplied
            ? 'opacity-60 bg-slate-50'
            : 'hover:shadow-md'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">

          {/* Checkbox */}
          <div
            className="flex-shrink-0 mt-1 cursor-pointer"
            onClick={() => {
              if (isAlreadyApplied) return
              onToggle()
            }}
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors
                ${isSelected ? 'bg-black border-black' : 'border-gray-300 hover:border-gray-400'}`}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">

            {/* Title + salary */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold leading-snug line-clamp-2 text-foreground">
                {job.title}
              </h3>
              {job.salaryMin && job.salaryMax && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                  ₹{(job.salaryMin / 100000).toFixed(1)}-{(job.salaryMax / 100000).toFixed(1)}L
                </Badge>
              )}
            </div>

            {/* Company row — logo (36px) + name + location stacked */}
            <div className="flex items-center gap-2.5 min-w-0">
              <CompanyLogo
                name={job.company}
                logoUrl={job.logoUrl}
                domain={job.companyDomain || job.url}
                size={36}
                className="flex-shrink-0 border border-gray-100 shadow-sm"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {job.company}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </span>
              </div>
            </div>

            {/* Applied badge */}
            {isAlreadyApplied && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300 text-xs w-fit"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Applied
              </Badge>
            )}

            {/* Description */}
            {job.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            )}

            {/* Skills */}
            {visibleSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {visibleSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 bg-muted border border-border rounded-full text-xs text-muted-foreground truncate max-w-[140px]"
                  >
                    {skill}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="px-2 py-0.5 bg-muted border border-border rounded-full text-xs text-muted-foreground">
                    +{extraCount}
                  </span>
                )}
              </div>
            )}

            {/* View Details — black button */}
            <Button
              asChild
              size="sm"
              className="mt-2 w-full bg-black text-white hover:bg-black/90"
              onClick={onViewDetails}
            >
              <Link href={`/jobs/${job._id}`} className="flex items-center justify-center gap-1">
                View Details
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}