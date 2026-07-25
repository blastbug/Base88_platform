<?php

namespace App\Console\Commands;

use App\Models\MovingJob;
use Illuminate\Console\Command;

/**
 * 応募締切を過ぎた「募集中」案件を自動的に「募集終了」にする（§13）。
 * スケジューラ（routes/console.php）から定期実行される。
 */
class CloseExpiredJobs extends Command
{
    protected $signature = 'jobs:close-expired';

    protected $description = '応募締切を過ぎた募集中案件を自動的に募集終了にする';

    public function handle(): int
    {
        $jobs = MovingJob::where('status', MovingJob::STATUS_RECRUITING)
            ->where('application_deadline', '<', now())
            ->get();

        foreach ($jobs as $job) {
            $job->update(['status' => MovingJob::STATUS_CLOSED]);
            activity('operation')
                ->performedOn($job)
                ->event('auto_closed')
                ->log('締切により自動的に募集終了');
        }

        $this->info("{$jobs->count()} 件の案件を募集終了にしました。");

        return self::SUCCESS;
    }
}
