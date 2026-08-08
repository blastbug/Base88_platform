<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MovingJobResource;
use App\Models\Announcement;
use App\Models\JobApplication;
use App\Models\JobContract;
use App\Models\MovingJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /** ホーム画面（ダッシュボード）の集計・新着案件・お知らせ・最近の活動（§4-2） */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;
        $since = now()->subDay();

        $recruiting = fn () => MovingJob::where('status', MovingJob::STATUS_RECRUITING);
        $myPosted = fn () => MovingJob::where('company_id', $companyId);
        $myApps = fn () => JobApplication::where('company_id', $companyId);
        $myContracts = fn () => JobContract::where('winning_company_id', $companyId);

        $stats = [
            'recruiting' => $recruiting()->count(),
            'my_posted' => $myPosted()->count(),
            'my_applications' => $myApps()->count(),
            'my_contracted' => $myContracts()->count(),
        ];

        // 前日比（直近24時間に増えた件数）
        $deltas = [
            'recruiting' => $recruiting()->where('created_at', '>=', $since)->count(),
            'my_posted' => $myPosted()->where('created_at', '>=', $since)->count(),
            'my_applications' => $myApps()->where('created_at', '>=', $since)->count(),
            'my_contracted' => $myContracts()->where('created_at', '>=', $since)->count(),
        ];

        // 新着案件（募集中・上位5件）
        $recentJobs = MovingJob::where('status', MovingJob::STATUS_RECRUITING)
            ->with('company')->withCount('applications')->latest()->limit(5)->get()
            ->map(function (MovingJob $job) { $job->canViewCustomer = false; return $job; });

        // 自社掲載中の案件（募集中・上位3件）
        $myJobs = MovingJob::where('company_id', $companyId)
            ->where('status', MovingJob::STATUS_RECRUITING)
            ->with('company')->withCount('applications')->latest()->limit(3)->get()
            ->map(function (MovingJob $job) { $job->canViewCustomer = false; return $job; });

        // お知らせ（公開済み・新しい順）
        $announcements = Announcement::published()->latest('published_at')->limit(4)->get()
            ->map(fn (Announcement $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'body' => $a->body,
                'level' => $a->level,
                'published_at' => optional($a->published_at)->toIso8601String(),
            ])->all();

        return response()->json([
            'stats' => $stats,
            'deltas' => $deltas,
            'recent_jobs' => MovingJobResource::collection($recentJobs),
            'my_jobs' => MovingJobResource::collection($myJobs),
            'announcements' => $announcements,
            'activities' => $this->recentActivities($companyId),
        ]);
    }

    /** 最近の活動（ドメインイベントから構築：掲載／応募受信／成約） */
    private function recentActivities(?int $companyId): array
    {
        // 会社に属さないユーザー（BASE88管理者・開発者）は加盟店の活動が無いため空を返す。
        if ($companyId === null) {
            return [];
        }

        $routeOf = fn (MovingJob $j) => trim("{$j->from_prefecture} → {$j->to_prefecture}");
        $items = collect();

        MovingJob::where('company_id', $companyId)->latest()->limit(6)->get()
            ->each(fn (MovingJob $j) => $items->push([
                'type' => 'posted', 'text' => '案件を掲載しました',
                'job_id' => $j->id, 'route' => $routeOf($j), 'at' => $j->created_at,
            ]));

        JobApplication::whereHas('movingJob', fn ($q) => $q->where('company_id', $companyId))
            ->with('movingJob')->latest()->limit(6)->get()
            ->each(function (JobApplication $a) use (&$items, $routeOf) {
                if ($a->movingJob) {
                    $items->push([
                        'type' => 'application', 'text' => '新しい応募がありました',
                        'job_id' => $a->moving_job_id, 'route' => $routeOf($a->movingJob), 'at' => $a->created_at,
                    ]);
                }
            });

        JobContract::where('winning_company_id', $companyId)->with('movingJob')->latest()->limit(6)->get()
            ->each(function (JobContract $c) use (&$items, $routeOf) {
                if ($c->movingJob) {
                    $items->push([
                        'type' => 'contract', 'text' => '案件が成約しました',
                        'job_id' => $c->moving_job_id, 'route' => $routeOf($c->movingJob),
                        'at' => $c->contracted_at ?? $c->created_at,
                    ]);
                }
            });

        return $items->sortByDesc('at')->take(5)->map(fn ($i) => [
            'type' => $i['type'],
            'text' => $i['text'],
            'job_id' => $i['job_id'],
            'route' => $i['route'],
            'at' => optional($i['at'])->toIso8601String(),
        ])->values()->all();
    }
}
