<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MovingJobResource;
use App\Models\JobApplication;
use App\Models\JobContract;
use App\Models\MovingJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /** ホーム画面の集計値と新着案件（§4-2） */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $recruitingCount = MovingJob::where('status', MovingJob::STATUS_RECRUITING)->count();
        $myPostedCount = MovingJob::where('company_id', $companyId)->count();
        $myApplicationsCount = JobApplication::where('company_id', $companyId)->count();
        $myContractedCount = JobContract::where('winning_company_id', $companyId)->count();

        $recentJobs = MovingJob::where('status', MovingJob::STATUS_RECRUITING)
            ->with('company')
            ->withCount('applications')
            ->latest()
            ->limit(6)
            ->get()
            ->map(function (MovingJob $job) {
                $job->canViewCustomer = false;
                return $job;
            });

        return response()->json([
            'stats' => [
                'recruiting' => $recruitingCount,
                'my_posted' => $myPostedCount,
                'my_applications' => $myApplicationsCount,
                'my_contracted' => $myContractedCount,
            ],
            'recent_jobs' => MovingJobResource::collection($recentJobs),
        ]);
    }
}
