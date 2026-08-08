<?php

namespace Tests\Feature;

use App\Models\JobApplication;
use App\Models\MovingJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * ⑤ 案件の配信方法：全体配信／指名配信の可視性制御。
 */
class JobDistributionTest extends TestCase
{
    use RefreshDatabase;

    private function indexIds($user): array
    {
        Sanctum::actingAs($user);

        return collect($this->getJson('/api/jobs')->assertOk()->json('data'))->pluck('id')->all();
    }

    public function test_all_distribution_is_visible_to_everyone(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $job = $this->makeJob($owner, ['distribution_type' => MovingJob::DISTRIBUTION_ALL]);

        [, $viewer] = $this->makeApprovedCompanyUser();
        $this->assertContains($job->id, $this->indexIds($viewer));

        Sanctum::actingAs($viewer);
        $this->getJson("/api/jobs/{$job->id}")->assertOk();
    }

    public function test_targeted_job_is_hidden_from_non_target(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        [$target] = $this->makeApprovedCompanyUser();
        [, $outsider] = $this->makeApprovedCompanyUser();

        $job = $this->makeJob($owner, ['distribution_type' => MovingJob::DISTRIBUTION_TARGETED]);
        $job->targets()->sync([$target->id]);

        // 一覧に出ない
        $this->assertNotContains($job->id, $this->indexIds($outsider));
        // 詳細も見られない
        Sanctum::actingAs($outsider);
        $this->getJson("/api/jobs/{$job->id}")->assertStatus(403);
    }

    public function test_targeted_job_is_visible_to_target_and_owner(): void
    {
        [$owner, $ownerUser] = $this->makeApprovedCompanyUser();
        [$target, $targetUser] = $this->makeApprovedCompanyUser();

        $job = $this->makeJob($owner, ['distribution_type' => MovingJob::DISTRIBUTION_TARGETED]);
        $job->targets()->sync([$target->id]);

        // 指名先は見える
        $this->assertContains($job->id, $this->indexIds($targetUser));
        Sanctum::actingAs($targetUser);
        $this->getJson("/api/jobs/{$job->id}")->assertOk();

        // 掲載会社（自社）も見える
        Sanctum::actingAs($ownerUser);
        $this->getJson("/api/jobs/{$job->id}")->assertOk();
    }

    public function test_already_applied_company_retains_access_even_if_not_target(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        [$applicantCompany, $applicantUser] = $this->makeApprovedCompanyUser();

        // 全体配信時に応募済み → 後から指名配信に変更されても閲覧は維持
        $job = $this->makeJob($owner, ['distribution_type' => MovingJob::DISTRIBUTION_ALL]);
        JobApplication::create([
            'moving_job_id' => $job->id,
            'company_id' => $applicantCompany->id,
            'applied_by' => $applicantUser->id,
            'status' => JobApplication::STATUS_APPLIED,
        ]);
        $job->update(['distribution_type' => MovingJob::DISTRIBUTION_TARGETED]);
        $job->targets()->sync([]); // 指名先には含めない

        $this->assertContains($job->id, $this->indexIds($applicantUser));
        Sanctum::actingAs($applicantUser);
        $this->getJson("/api/jobs/{$job->id}")->assertOk();
    }

    public function test_non_target_cannot_apply_to_targeted_job(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        [$target] = $this->makeApprovedCompanyUser();
        [, $outsider] = $this->makeApprovedCompanyUser();

        $job = $this->makeJob($owner, ['distribution_type' => MovingJob::DISTRIBUTION_TARGETED]);
        $job->targets()->sync([$target->id]);

        Sanctum::actingAs($outsider);
        $this->postJson("/api/jobs/{$job->id}/apply", ['message' => 'よろしく'])->assertStatus(422);
        $this->assertDatabaseCount('job_applications', 0);
    }
}
