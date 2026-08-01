<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\JobApplication;
use App\Models\JobContract;
use App\Models\JobFinance;
use App\Models\MovingJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 4：精算（代行集金手数料・送金額の自動計算）・所有権ガード・月別売上・請求書。
 */
class FinanceTest extends TestCase
{
    use RefreshDatabase;

    /** 成約（受注）済みの案件と精算レコードを作成し、[受注会社ユーザー, JobFinance] を返す。 */
    private function makeContractedFinance(int $sale = 88000): array
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $winnerCompany = $this->makeCompany();
        $winnerUser = $this->makeUser($winnerCompany);

        $job = $this->makeJob($owner, ['status' => MovingJob::STATUS_CONTRACTED, 'desired_price' => $sale]);
        $app = JobApplication::create([
            'moving_job_id' => $job->id,
            'company_id' => $winnerCompany->id,
            'applied_by' => $winnerUser->id,
            'status' => JobApplication::STATUS_ACCEPTED,
        ]);
        $contract = JobContract::create([
            'moving_job_id' => $job->id,
            'job_application_id' => $app->id,
            'winning_company_id' => $winnerCompany->id,
            'contracted_at' => now(),
        ]);

        return [$winnerUser, $contract->finance];
    }

    public function test_contract_auto_creates_finance(): void
    {
        [, $finance] = $this->makeContractedFinance(120000);

        $this->assertNotNull($finance);
        $this->assertSame(120000, $finance->sale_amount);
    }

    public function test_fee_and_remit_are_calculated(): void
    {
        [, $finance] = $this->makeContractedFinance();
        $finance->update(['collected_amount' => 100000, 'collection_fee_rate' => 10]);

        $this->assertSame(10000, $finance->collection_fee);   // 100000 × 10%
        $this->assertSame(90000, $finance->remit_amount);     // 100000 − 10000
    }

    public function test_company_can_update_own_finance(): void
    {
        [$winnerUser, $finance] = $this->makeContractedFinance();

        Sanctum::actingAs($winnerUser);
        $this->putJson("/api/me/finances/{$finance->id}", [
            'collected_amount' => 90000,
            'additional_amount' => 3000,
            'additional_detail' => '待機料',
        ])->assertOk();

        $finance->refresh();
        $this->assertSame(90000, $finance->collected_amount);
        $this->assertSame(3000, $finance->additional_amount);
    }

    public function test_company_cannot_update_others_finance(): void
    {
        [, $finance] = $this->makeContractedFinance();
        [, $outsider] = $this->makeApprovedCompanyUser();

        Sanctum::actingAs($outsider);
        $this->putJson("/api/me/finances/{$finance->id}", ['collected_amount' => 1])
            ->assertStatus(403);
    }

    public function test_monthly_sales_endpoint_returns_sections(): void
    {
        [$winnerUser] = $this->makeContractedFinance();

        Sanctum::actingAs($winnerUser);
        $this->getJson('/api/me/sales')
            ->assertOk()
            ->assertJsonStructure(['monthly', 'finances', 'invoices']);
    }

    public function test_invoice_upload(): void
    {
        [, $user] = $this->makeApprovedCompanyUser();

        Sanctum::actingAs($user);
        $this->postJson('/api/me/invoices', [
            'target_month' => '2026-07',
            'amount' => 120000,
        ])->assertStatus(201);

        $this->assertDatabaseHas('company_invoices', [
            'company_id' => $user->company_id,
            'target_month' => '2026-07',
            'amount' => 120000,
            'review_status' => 'pending',
        ]);
    }
}
