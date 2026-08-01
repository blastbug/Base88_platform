<?php

namespace Tests\Feature;

use App\Models\JobApplication;
use App\Models\JobContract;
use App\Models\MovingJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * セキュリティ：顧客個人情報（PII）は掲載会社・成約会社にのみ開示する。
 */
class CustomerPrivacyTest extends TestCase
{
    use RefreshDatabase;

    private function addCustomer(MovingJob $job): void
    {
        $job->customerDetail()->create([
            'customer_name' => '田中 花子',
            'customer_phone' => '090-0000-0000',
            'customer_address' => '東京都港区1-2-3',
            'contact_note' => '日中不在',
        ]);
    }

    public function test_customer_hidden_from_non_owner_on_recruiting_job(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $job = $this->makeJob($owner);
        $this->addCustomer($job);

        [, $viewer] = $this->makeApprovedCompanyUser();
        Sanctum::actingAs($viewer);

        $res = $this->getJson("/api/jobs/{$job->id}")->assertOk();
        $this->assertNull($res->json('data.customer'));
    }

    public function test_owner_sees_customer_on_own_job(): void
    {
        [$owner, $ownerUser] = $this->makeApprovedCompanyUser();
        $job = $this->makeJob($owner);
        $this->addCustomer($job);

        Sanctum::actingAs($ownerUser);
        $this->getJson("/api/jobs/{$job->id}")
            ->assertOk()
            ->assertJsonPath('data.customer.name', '田中 花子');
    }

    public function test_winning_company_sees_customer_after_contract(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $winnerCompany = $this->makeCompany();
        $winnerUser = $this->makeUser($winnerCompany);

        $job = $this->makeJob($owner, ['status' => MovingJob::STATUS_CONTRACTED]);
        $this->addCustomer($job);
        $app = JobApplication::create([
            'moving_job_id' => $job->id,
            'company_id' => $winnerCompany->id,
            'applied_by' => $winnerUser->id,
            'status' => JobApplication::STATUS_ACCEPTED,
        ]);
        JobContract::create([
            'moving_job_id' => $job->id,
            'job_application_id' => $app->id,
            'winning_company_id' => $winnerCompany->id,
            'contracted_at' => now(),
        ]);

        Sanctum::actingAs($winnerUser);
        $this->getJson("/api/jobs/{$job->id}")
            ->assertOk()
            ->assertJsonPath('data.customer.name', '田中 花子');
    }

    public function test_outsider_cannot_access_contracted_job_at_all(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $job = $this->makeJob($owner, ['status' => MovingJob::STATUS_CONTRACTED]);
        $this->addCustomer($job);

        [, $outsider] = $this->makeApprovedCompanyUser();
        Sanctum::actingAs($outsider);
        $this->getJson("/api/jobs/{$job->id}")->assertStatus(403);
    }
}
