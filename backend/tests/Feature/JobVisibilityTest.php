<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\JobApplication;
use App\Models\JobContract;
use App\Models\MovingJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 1：加盟店の案件表示制限・投稿無効化・応募ゲート。
 */
class JobVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_only_recruiting_jobs(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        [$viewerCompany, $viewer] = $this->makeApprovedCompanyUser();

        $recruiting = $this->makeJob($owner);
        $this->makeJob($owner, ['status' => MovingJob::STATUS_CLOSED]);
        $this->makeJob($owner, ['status' => MovingJob::STATUS_CONTRACTED]);
        // 締切超過の募集中（実質終了）も出さない
        $this->makeJob($owner, ['application_deadline' => now()->subDay()]);

        Sanctum::actingAs($viewer);
        $res = $this->getJson('/api/jobs')->assertOk();

        $ids = collect($res->json('data'))->pluck('id')->all();
        $this->assertEquals([$recruiting->id], $ids);
    }

    public function test_non_owner_cannot_view_others_contracted_job(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        [, $outsider] = $this->makeApprovedCompanyUser();

        $job = $this->makeJob($owner, ['status' => MovingJob::STATUS_CONTRACTED]);

        Sanctum::actingAs($outsider);
        $this->getJson("/api/jobs/{$job->id}")->assertStatus(403);
    }

    public function test_owner_can_view_own_contracted_job(): void
    {
        [$owner, $ownerUser] = $this->makeApprovedCompanyUser();
        $job = $this->makeJob($owner, ['status' => MovingJob::STATUS_CONTRACTED]);

        Sanctum::actingAs($ownerUser);
        $this->getJson("/api/jobs/{$job->id}")->assertOk()->assertJsonPath('data.id', $job->id);
    }

    public function test_job_posting_by_company_is_disabled(): void
    {
        [, $user] = $this->makeApprovedCompanyUser();

        Sanctum::actingAs($user);
        $this->postJson('/api/jobs', [
            'moving_date' => now()->addDays(10)->toDateString(),
            'from_prefecture' => '東京都',
            'to_prefecture' => '神奈川県',
            'building_type' => 'マンション',
            'luggage_volume' => '2t',
            'application_deadline' => now()->addDays(5)->toDateTimeString(),
        ])->assertStatus(403);
    }

    public function test_unapproved_company_cannot_apply(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $job = $this->makeJob($owner);

        $applicantCompany = $this->makeCompany(['review_status' => Company::REVIEW_REVISION]);
        $applicant = $this->makeUser($applicantCompany);

        Sanctum::actingAs($applicant);
        $this->postJson("/api/jobs/{$job->id}/apply", ['message' => 'よろしく'])
            ->assertStatus(422);

        $this->assertDatabaseCount('job_applications', 0);
    }

    public function test_approved_company_can_apply(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $job = $this->makeJob($owner);

        [, $applicant] = $this->makeApprovedCompanyUser();

        Sanctum::actingAs($applicant);
        $this->postJson("/api/jobs/{$job->id}/apply", ['message' => 'よろしく'])
            ->assertStatus(201);

        $this->assertDatabaseCount('job_applications', 1);
    }
}
