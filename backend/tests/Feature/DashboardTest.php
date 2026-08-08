<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * ダッシュボード API。会社に属さないユーザー（BASE88管理者・開発者）でも
 * 500 にならず、加盟店ユーザーでは集計が返ることを担保する。
 */
class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_ok_for_user_without_company(): void
    {
        // 会社に属さない BASE88管理者／開発者（company_id = null）
        $admin = User::create([
            'company_id' => null,
            'name' => 'BASE88管理者',
            'email' => 'platform@test.local',
            'password' => Hash::make('password'),
            'role' => User::ROLE_PLATFORM_ADMIN,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);
        $res = $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonStructure(['stats', 'deltas', 'recent_jobs', 'my_jobs', 'announcements', 'activities']);

        // 会社が無いため最近の活動・自社案件は空
        $this->assertSame([], $res->json('activities'));
        $this->assertSame([], $res->json('my_jobs.data') ?? $res->json('my_jobs'));
    }

    public function test_dashboard_ok_for_company_user(): void
    {
        [$company, $user] = $this->makeApprovedCompanyUser();
        $this->makeJob($company); // 募集中案件

        Sanctum::actingAs($user);
        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonStructure(['stats', 'deltas', 'recent_jobs', 'my_jobs', 'announcements', 'activities'])
            ->assertJsonPath('stats.recruiting', 1);
    }
}
