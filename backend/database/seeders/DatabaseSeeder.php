<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ロール作成（spatie/permission, guard: web）
        foreach ([
            User::ROLE_PLATFORM_ADMIN,
            User::ROLE_COMPANY_ADMIN,
            User::ROLE_STAFF,
        ] as $roleName) {
            Role::findOrCreate($roleName, 'web');
        }

        // BASE88管理者（初期アカウント）
        $admin = User::updateOrCreate(
            ['email' => 'admin@base88.local'],
            [
                'name' => 'BASE88 管理者',
                'password' => Hash::make('password'), // ※本番では必ず変更
                'role' => User::ROLE_PLATFORM_ADMIN,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles([User::ROLE_PLATFORM_ADMIN]);

        // 動作確認用のサンプル加盟会社＋会社管理者（本番投入時は削除可）
        if (app()->environment('local')) {
            $company = Company::updateOrCreate(
                ['name' => 'サンプル引越会社'],
                [
                    'address' => '東京都新宿区1-1-1',
                    'phone' => '03-0000-0000',
                    'status' => Company::STATUS_APPROVED,
                    'approved_at' => now(),
                ]
            );

            $companyAdmin = User::updateOrCreate(
                ['email' => 'company@base88.local'],
                [
                    'company_id' => $company->id,
                    'name' => 'サンプル会社管理者',
                    'password' => Hash::make('password'),
                    'role' => User::ROLE_COMPANY_ADMIN,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
            $companyAdmin->syncRoles([User::ROLE_COMPANY_ADMIN]);

            $this->call(DemoSeeder::class);
        }
    }
}
