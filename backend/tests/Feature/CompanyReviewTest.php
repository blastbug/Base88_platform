<?php

namespace Tests\Feature;

use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 3：審査ワークフロー（review_status）とログイン可否ゲート・再申請。
 */
class CompanyReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_review_status_syncs_login_gate(): void
    {
        $company = $this->makeCompany(['review_status' => Company::REVIEW_APPROVED]);
        $this->assertSame(Company::STATUS_APPROVED, $company->status);

        $company->update(['review_status' => Company::REVIEW_REVISION]);
        $this->assertSame(Company::STATUS_PENDING, $company->fresh()->status);

        $company->update(['review_status' => Company::REVIEW_SUSPENDED]);
        $this->assertSame(Company::STATUS_SUSPENDED, $company->fresh()->status);

        $company->update(['review_status' => Company::REVIEW_TERMINATED]);
        $this->assertSame(Company::STATUS_SUSPENDED, $company->fresh()->status);
    }

    public function test_approved_company_user_can_login(): void
    {
        $company = $this->makeCompany(['review_status' => Company::REVIEW_APPROVED]);
        $user = $this->makeUser($company);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_review_in_progress_company_user_can_login(): void
    {
        // 修正依頼中でも申請状況の確認・修正のためログイン可
        $company = $this->makeCompany(['review_status' => Company::REVIEW_REVISION]);
        $user = $this->makeUser($company);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_suspended_company_user_cannot_login(): void
    {
        $company = $this->makeCompany(['review_status' => Company::REVIEW_SUSPENDED]);
        $user = $this->makeUser($company);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertStatus(422);
    }

    public function test_resubmit_moves_revision_to_submitted(): void
    {
        $company = $this->makeCompany([
            'review_status' => Company::REVIEW_REVISION,
            'review_note' => '保険証券を再提出してください。',
        ]);
        $user = $this->makeUser($company);

        Sanctum::actingAs($user);
        $this->postJson('/api/me/company/resubmit')->assertOk();

        $company->refresh();
        $this->assertSame(Company::REVIEW_SUBMITTED, $company->review_status);
        $this->assertNull($company->review_note);
    }
}
