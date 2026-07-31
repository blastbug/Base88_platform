<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\JobApplication;
use App\Models\JobContract;
use App\Models\MovingJob;
use App\Models\MovingJobCustomerDetail;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * デモ用データ（ローカル環境のみ）。テスト運用開始時は削除して構いません。
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $companies = [
            ['name' => 'サカイ引越サービス', 'pref' => '東京都', 'phone' => '03-1111-2222'],
            ['name' => 'アリさんマークの引越社', 'pref' => '神奈川県', 'phone' => '045-333-4444'],
            ['name' => 'ハート引越センター', 'pref' => '大阪府', 'phone' => '06-5555-6666'],
            ['name' => 'クイック引越便', 'pref' => '愛知県', 'phone' => '052-777-8888'],
        ];

        $created = [];
        foreach ($companies as $i => $c) {
            $company = Company::updateOrCreate(
                ['name' => $c['name']],
                [
                    'name_kana' => $c['name'],
                    'postal_code' => '100-000' . ($i + 1),
                    'address' => $c['pref'] . '中央区1-2-3',
                    'phone' => $c['phone'],
                    'company_email' => 'info@demo' . ($i + 1) . '.example.jp',
                    'established_ym' => (2005 + $i) . '-04',
                    'website' => 'https://demo' . ($i + 1) . '.example.jp',
                    'service_areas' => $c['pref'] . '全域・近隣県',
                    'business_hours' => '8:00〜19:00',
                    'holidays' => '年中無休',
                    'rep_name' => $c['name'] . ' 代表',
                    'contact_name' => $c['name'] . ' 担当',
                    'contact_phone' => $c['phone'],
                    'contact_email' => 'demo' . ($i + 1) . '@base88.local',
                    'employee_count' => 20 + $i * 10,
                    'worker_count' => 12 + $i * 6,
                    'sales_staff_count' => 3 + $i,
                    'vehicle_count' => 5 + $i * 2,
                    'has_antique_license' => $i % 2 === 0,
                    'has_light_cargo_license' => true,
                    'experience_years' => 8 + $i * 3,
                    'annual_jobs' => 1200 + $i * 300,
                    'monthly_capacity' => 100 + $i * 20,
                    'corporate_experience' => true,
                    'individual_experience' => true,
                    'long_distance_support' => $i % 2 === 0,
                    'has_transport_insurance' => true,
                    'has_auto_insurance' => true,
                    'insurer_name' => '損保ジャパン',
                    'coverage_amount' => 10000000,
                    'material_hanger_box' => 20 + $i * 5,
                    'material_futon_bag' => 30 + $i * 5,
                    'svc_disposal_pickup' => $i % 2 === 0,
                    'svc_ac_install' => true,
                    'svc_packing' => true,
                    'svc_protection' => true,
                    'svc_long_distance' => $i % 2 === 0,
                    'review_status' => Company::REVIEW_APPROVED,
                    'status' => Company::STATUS_APPROVED,
                    'approved_at' => now(),
                ]
            );
            // 保有車両・書類の見本（冪等）
            $company->vehicles()->firstOrCreate(
                ['truck_size' => '2トンショート'],
                ['vehicle_type' => '平ボディ', 'count' => 2 + $i, 'max_load' => '2000kg', 'ownership' => '自社所有', 'availability' => '稼働可']
            );
            $company->documents()->firstOrCreate(
                ['doc_type' => 'drivers_license'],
                ['doc_name' => '代表者運転免許証', 'review_status' => 'confirmed']
            );
            $user = User::updateOrCreate(
                ['email' => 'demo' . ($i + 1) . '@base88.local'],
                [
                    'company_id' => $company->id,
                    'name' => $c['name'] . ' 担当',
                    'password' => Hash::make('password'),
                    'role' => User::ROLE_COMPANY_ADMIN,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
            $user->syncRoles([User::ROLE_COMPANY_ADMIN]);
            $created[] = $company;
        }

        $this->seedReviewSamples();

        $samples = [
            ['from' => ['東京都', '世田谷区'], 'to' => ['神奈川県', '横浜市'], 'building' => 'マンション', 'layout' => '2LDK', 'vol' => '2tトラック1台程度', 'truck' => '2トンショート', 'workers' => 2, 'price' => 45000, 'slot' => '午前指定'],
            ['from' => ['大阪府', '吹田市'], 'to' => ['大阪府', '堺市'], 'building' => 'アパート', 'layout' => '1K', 'vol' => '軽トラ1台程度', 'truck' => '軽トラック', 'workers' => 1, 'price' => 18000, 'slot' => '午後指定'],
            ['from' => ['愛知県', '名古屋市'], 'to' => ['岐阜県', '岐阜市'], 'building' => '戸建て', 'layout' => '3LDK', 'vol' => '4tトラック1台', 'truck' => '4トン', 'workers' => 4, 'price' => 98000, 'slot' => 'フリー便'],
            ['from' => ['神奈川県', '川崎市'], 'to' => ['東京都', '大田区'], 'building' => 'マンション', 'layout' => '1LDK', 'vol' => '2tショート', 'truck' => '2トンショート', 'workers' => 2, 'price' => 38000, 'slot' => '午前指定'],
            ['from' => ['東京都', '練馬区'], 'to' => ['埼玉県', 'さいたま市'], 'building' => 'アパート', 'layout' => '2DK', 'vol' => '2tロング', 'truck' => '2トンロング', 'workers' => 3, 'price' => 52000, 'slot' => '13:00〜15:00'],
            ['from' => ['大阪府', '豊中市'], 'to' => ['兵庫県', '西宮市'], 'building' => 'マンション', 'layout' => '2LDK', 'vol' => '3tトラック', 'truck' => '3トン', 'workers' => 3, 'price' => 62000, 'slot' => '午前指定'],
            ['from' => ['福岡県', '福岡市'], 'to' => ['福岡県', '北九州市'], 'building' => '戸建て', 'layout' => '4LDK', 'vol' => '4t2台', 'truck' => '4トン', 'workers' => 4, 'price' => 135000, 'slot' => 'フリー便'],
            ['from' => ['北海道', '札幌市'], 'to' => ['北海道', '旭川市'], 'building' => 'マンション', 'layout' => '1K', 'vol' => '1tトラック', 'truck' => '1トン', 'workers' => 2, 'price' => 42000, 'slot' => '午前指定'],
            ['from' => ['東京都', '江東区'], 'to' => ['千葉県', '船橋市'], 'building' => 'タワーマンション', 'layout' => '3LDK', 'vol' => '4tトラック', 'truck' => '4トン', 'workers' => 4, 'price' => 110000, 'slot' => '午後指定'],
            ['from' => ['京都府', '京都市'], 'to' => ['滋賀県', '大津市'], 'building' => 'アパート', 'layout' => '1DK', 'vol' => '軽トラ2台', 'truck' => '軽トラック', 'workers' => 2, 'price' => 26000, 'slot' => '10:00〜12:00'],
        ];

        foreach ($samples as $i => $s) {
            $company = $created[$i % count($created)];
            $job = MovingJob::updateOrCreate(
                [
                    'company_id' => $company->id,
                    'from_prefecture' => $s['from'][0],
                    'to_prefecture' => $s['to'][0],
                    'moving_date' => Carbon::today()->addDays(7 + $i * 2),
                ],
                [
                    'time_slot' => $s['slot'],
                    'from_city' => $s['from'][1],
                    'to_city' => $s['to'][1],
                    'building_type' => $s['building'],
                    'layout' => $s['layout'],
                    'luggage_volume' => $s['vol'],
                    'truck_size' => $s['truck'],
                    'worker_count' => $s['workers'],
                    'floors' => (string) rand(1, 10) . '階',
                    'has_elevator' => (bool) rand(0, 1),
                    'desired_price' => $s['price'],
                    'note' => '大型家具・家電あり。エレベーターの有無をご確認ください。',
                    'application_deadline' => Carbon::today()->addDays(5 + $i)->setTime(18, 0),
                    'status' => MovingJob::STATUS_RECRUITING,
                ]
            );

            // 一部の案件に他社からの応募を付与
            if ($i % 3 === 0) {
                $applicant = $created[($i + 1) % count($created)];
                if ($applicant->id !== $company->id) {
                    JobApplication::firstOrCreate(
                        ['moving_job_id' => $job->id, 'company_id' => $applicant->id],
                        [
                            'applied_by' => $applicant->users()->first()->id,
                            'message' => 'ぜひ対応させていただきたく応募いたします。',
                            'status' => JobApplication::STATUS_APPLIED,
                        ]
                    );
                }
            }
        }

        $this->seedShowcaseContract($created);
    }

    /** 審査ワークフローの見本。ログイン不可の申請中／審査中／修正依頼の会社を作成。 */
    private function seedReviewSamples(): void
    {
        $samples = [
            [
                'name' => 'みらい引越サービス', 'review' => Company::REVIEW_SUBMITTED, 'login' => 'mirai',
                'note' => null, 'antique' => true,
                'doc' => ['type' => 'antique_license', 'name' => '古物商許可証', 'status' => 'pending', 'reason' => null],
            ],
            [
                'name' => 'そら運送', 'review' => Company::REVIEW_UNDER_REVIEW, 'login' => 'sora',
                'note' => null, 'antique' => false,
                'doc' => ['type' => 'light_cargo', 'name' => '軽貨物運送事業 届出書', 'status' => 'pending', 'reason' => null],
            ],
            [
                'name' => 'あおぞら引越センター', 'review' => Company::REVIEW_REVISION, 'login' => 'aozora',
                'note' => "保険証券の有効期限が確認できません。最新の保険証券（PDF）をアップロードしてください。\nまた、代表者情報の生年月日が未入力です。",
                'antique' => false,
                'doc' => ['type' => 'insurance_policy', 'name' => '貨物保険証券', 'status' => 'rejected', 'reason' => '有効期限が読み取れません。再提出してください。'],
            ],
        ];

        foreach ($samples as $i => $s) {
            $company = Company::updateOrCreate(
                ['name' => $s['name']],
                [
                    'name_kana' => $s['name'],
                    'postal_code' => '540-000' . ($i + 1),
                    'address' => '大阪府大阪市中央区本町' . ($i + 1) . '-2-3',
                    'phone' => '06-1000-200' . ($i + 1),
                    'company_email' => 'info@' . ['mirai', 'sora', 'aozora'][$i] . '.example.jp',
                    'established_ym' => (2018 + $i) . '-0' . ($i + 3),
                    'service_areas' => '関西全域',
                    'business_hours' => '9:00〜18:00',
                    'rep_name' => $s['name'] . ' 代表',
                    'contact_name' => $s['name'] . ' 担当',
                    'contact_phone' => '06-1000-200' . ($i + 1),
                    'employee_count' => 8 + $i * 4,
                    'worker_count' => 5 + $i * 2,
                    'vehicle_count' => 3 + $i,
                    'has_antique_license' => $s['antique'],
                    'has_light_cargo_license' => true,
                    'experience_years' => 3 + $i,
                    'annual_jobs' => 300 + $i * 150,
                    'monthly_capacity' => 30 + $i * 10,
                    'individual_experience' => true,
                    'svc_ac_install' => true,
                    'svc_packing' => true,
                    'review_status' => $s['review'],
                    'review_note' => $s['note'],
                    'submitted_at' => now()->subDays(3 - $i),
                    'reviewed_at' => $s['review'] === Company::REVIEW_SUBMITTED ? null : now()->subDays(1),
                ]
            );
            $company->vehicles()->firstOrCreate(
                ['truck_size' => '軽トラック'],
                ['vehicle_type' => '軽バン', 'count' => 2, 'ownership' => 'リース', 'availability' => '稼働可']
            );
            $company->documents()->firstOrCreate(
                ['doc_type' => $s['doc']['type']],
                ['doc_name' => $s['doc']['name'], 'review_status' => $s['doc']['status'], 'reject_reason' => $s['doc']['reason']]
            );

            // 申請状況・修正依頼を確認できるログインユーザー（審査中でもログイン可）
            $u = User::updateOrCreate(
                ['email' => $s['login'] . '@base88.local'],
                [
                    'company_id' => $company->id,
                    'name' => $s['name'] . ' 担当',
                    'password' => Hash::make('password'),
                    'role' => User::ROLE_COMPANY_ADMIN,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
            $u->syncRoles([User::ROLE_COMPANY_ADMIN]);
        }
    }

    /** 成約済みの見本案件（顧客情報つき）を1件作成。掲載会社＝1社目、成約会社＝2社目。 */
    private function seedShowcaseContract(array $companies): void
    {
        $owner = $companies[0];
        $winner = $companies[1];

        $job = MovingJob::updateOrCreate(
            [
                'company_id' => $owner->id,
                'from_prefecture' => '東京都',
                'to_prefecture' => '千葉県',
                'moving_date' => Carbon::today()->addDays(10),
            ],
            [
                'time_slot' => '午前指定',
                'from_city' => '港区',
                'to_city' => '船橋市',
                'building_type' => 'マンション',
                'layout' => '3LDK',
                'luggage_volume' => '4tトラック1台程度',
                'truck_size' => '4トン',
                'worker_count' => 4,
                'floors' => '8階',
                'has_elevator' => true,
                'desired_price' => 88000,
                'note' => 'ピアノ・大型冷蔵庫あり。搬出は8階、エレベーター利用可。',
                'application_deadline' => Carbon::today()->addDays(3)->setTime(18, 0),
                'status' => MovingJob::STATUS_CONTRACTED,
            ]
        );

        MovingJobCustomerDetail::updateOrCreate(
            ['moving_job_id' => $job->id],
            [
                'customer_name' => '田中 花子',
                'customer_phone' => '090-8765-4321',
                'customer_address' => '東京都港区六本木7-8-9 グランドタワー802',
                'contact_note' => '平日日中は不在のため、搬出前に必ずお電話ください。',
            ]
        );

        $app = JobApplication::updateOrCreate(
            ['moving_job_id' => $job->id, 'company_id' => $winner->id],
            [
                'applied_by' => $winner->users()->first()->id,
                'message' => '当日は4名体制で対応可能です。ピアノ運搬の実績も豊富にございます。',
                'status' => JobApplication::STATUS_ACCEPTED,
            ]
        );

        JobContract::updateOrCreate(
            ['moving_job_id' => $job->id],
            [
                'job_application_id' => $app->id,
                'winning_company_id' => $winner->id,
                'contracted_at' => now(),
            ]
        );
    }
}
