"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Job, Paginated } from "@/lib/types";
import { JobCard } from "@/components/JobCard";
import { EmptyState, LinkButton, PageHeader, Spinner } from "@/components/ui";

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated<Job>>("/my/jobs")
      .then((res) => setJobs(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="自社の掲載案件"
        description="自社が掲載した案件の状況を確認・管理できます。"
        action={<LinkButton href="/jobs/new" variant="primary">案件を掲載</LinkButton>}
      />
      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-7 w-7" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState title="掲載した案件はまだありません" description="対応できない案件を掲載して、他社へ依頼しましょう。" action={<LinkButton href="/jobs/new">案件を掲載する</LinkButton>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}
