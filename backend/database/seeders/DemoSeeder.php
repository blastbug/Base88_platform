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
                    'address' => $c['pref'] . '中央区1-2-3',
                    'phone' => $c['phone'],
                    'status' => Company::STATUS_APPROVED,
                    'approved_at' => now(),
                ]
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

        $samples = [
            ['from' => ['東京都', '世田谷区'], 'to' => ['神奈川県', '横浜市'], 'building' => 'マンション', 'layout' => '2LDK', 'vol' => '2tトラック1台程度', 'truck' => '2トンショート', 'workers' => 2, 'price' => 45000, 'slot' => '午前'],
            ['from' => ['大阪府', '吹田市'], 'to' => ['大阪府', '堺市'], 'building' => 'アパート', 'layout' => '1K', 'vol' => '軽トラ1台程度', 'truck' => '軽トラック', 'workers' => 1, 'price' => 18000, 'slot' => '午後'],
            ['from' => ['愛知県', '名古屋市'], 'to' => ['岐阜県', '岐阜市'], 'building' => '戸建て', 'layout' => '3LDK', 'vol' => '4tトラック1台', 'truck' => '4トン', 'workers' => 4, 'price' => 98000, 'slot' => '終日'],
            ['from' => ['神奈川県', '川崎市'], 'to' => ['東京都', '大田区'], 'building' => 'マンション', 'layout' => '1LDK', 'vol' => '2tショート', 'truck' => '2トンショート', 'workers' => 2, 'price' => 38000, 'slot' => '午前'],
            ['from' => ['東京都', '練馬区'], 'to' => ['埼玉県', 'さいたま市'], 'building' => 'アパート', 'layout' => '2DK', 'vol' => '2tロング', 'truck' => '2トンロング', 'workers' => 3, 'price' => 52000, 'slot' => '午後'],
            ['from' => ['大阪府', '豊中市'], 'to' => ['兵庫県', '西宮市'], 'building' => 'マンション', 'layout' => '2LDK', 'vol' => '3tトラック', 'truck' => '3トン', 'workers' => 3, 'price' => 62000, 'slot' => '午前'],
            ['from' => ['福岡県', '福岡市'], 'to' => ['福岡県', '北九州市'], 'building' => '戸建て', 'layout' => '4LDK', 'vol' => '4t2台', 'truck' => '4トン', 'workers' => 4, 'price' => 135000, 'slot' => '終日'],
            ['from' => ['北海道', '札幌市'], 'to' => ['北海道', '旭川市'], 'building' => 'マンション', 'layout' => '1K', 'vol' => '1tトラック', 'truck' => '1トン', 'workers' => 2, 'price' => 42000, 'slot' => '午前'],
            ['from' => ['東京都', '江東区'], 'to' => ['千葉県', '船橋市'], 'building' => 'タワーマンション', 'layout' => '3LDK', 'vol' => '4tトラック', 'truck' => '4トン', 'workers' => 4, 'price' => 110000, 'slot' => '午後'],
            ['from' => ['京都府', '京都市'], 'to' => ['滋賀県', '大津市'], 'building' => 'アパート', 'layout' => '1DK', 'vol' => '軽トラ2台', 'truck' => '軽トラック', 'workers' => 2, 'price' => 26000, 'slot' => '午前'],
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
                'time_slot' => '午前',
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
