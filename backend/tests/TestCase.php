<?php

namespace Tests;

use App\Models\Company;
use App\Models\MovingJob;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

abstract class TestCase extends BaseTestCase
{
    private static int $seq = 0;

    /**
     * 【重要・安全策】テストは必ず sqlite :memory: を使う。
     *
     * config をキャッシュ（config:cache）した状態でテストを実行すると、
     * phpunit.xml の env よりキャッシュ済み設定（＝本番/開発DB）が優先され、
     * RefreshDatabase の migrate:fresh が実DBを初期化してしまう事故が起き得る。
     * refreshApplication は setUpTraits（RefreshDatabase の起動）より前に呼ばれる
     * ため、ここで接続を :memory: へ強制し、万一 :memory: でなければ
     * migrate:fresh が走る前に中断する。
     */
    protected function refreshApplication(): void
    {
        parent::refreshApplication();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'database.connections.sqlite.foreign_key_constraints' => true,
            'app.tunnel_url' => null,
        ]);
        DB::purge('sqlite');

        $db = config('database.connections.'.config('database.default').'.database');
        if ($db !== ':memory:') {
            throw new \RuntimeException(
                'テストDBが :memory: ではありません（'.$db.'）。実DB保護のため中断しました。'
            );
        }
    }

    private function seq(): int
    {
        return ++self::$seq;
    }

    /** 加盟会社を作成（既定は承認済み）。 */
    protected function makeCompany(array $overrides = []): Company
    {
        $n = $this->seq();

        return Company::create(array_merge([
            'name' => 'テスト会社'.$n,
            'review_status' => Company::REVIEW_APPROVED,
        ], $overrides));
    }

    /** 会社に属するユーザーを作成（既定は会社管理者・パスワード password）。 */
    protected function makeUser(Company $company, string $role = User::ROLE_COMPANY_ADMIN, array $overrides = []): User
    {
        $n = $this->seq();

        return User::create(array_merge([
            'company_id' => $company->id,
            'name' => 'ユーザー'.$n,
            'email' => 'user'.$n.'@test.local',
            'password' => Hash::make('password'),
            'role' => $role,
            'is_active' => true,
        ], $overrides));
    }

    /** 承認済み会社＋会社管理者ユーザーをまとめて作成。 */
    protected function makeApprovedCompanyUser(): array
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        return [$company, $user];
    }

    /** 引越案件を作成（既定は募集中・締切は未来）。 */
    protected function makeJob(Company $owner, array $overrides = []): MovingJob
    {
        return MovingJob::create(array_merge([
            'company_id' => $owner->id,
            'moving_date' => now()->addDays(10)->toDateString(),
            'from_prefecture' => '東京都',
            'to_prefecture' => '神奈川県',
            'building_type' => 'マンション',
            'luggage_volume' => '2tトラック1台程度',
            'application_deadline' => now()->addDays(5),
            'status' => MovingJob::STATUS_RECRUITING,
        ], $overrides));
    }
}
