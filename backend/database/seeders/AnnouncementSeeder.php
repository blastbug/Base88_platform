<?php

namespace Database\Seeders;

use App\Models\Announcement;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'title' => 'システムメンテナンスのお知らせ',
                'body' => '下記日程にてシステムメンテナンスを実施いたします。メンテナンス中は一時的にサービスをご利用いただけません。ご不便をおかけしますが、ご理解のほどよろしくお願いいたします。',
                'level' => Announcement::LEVEL_IMPORTANT,
                'published_at' => now()->subDays(5),
            ],
            [
                'title' => '新機能リリースのお知らせ',
                'body' => '案件検索の絞り込み機能を追加しました。都道府県・引越予定日での絞り込みがより便利になりました。',
                'level' => Announcement::LEVEL_NORMAL,
                'published_at' => now()->subDays(7),
            ],
            [
                'title' => '夏季休業のお知らせ',
                'body' => '8月10日〜8月15日はサポート窓口を休業とさせていただきます。期間中のお問い合わせは翌営業日以降の対応となります。',
                'level' => Announcement::LEVEL_NORMAL,
                'published_at' => now()->subDays(10),
            ],
        ];

        foreach ($items as $item) {
            Announcement::updateOrCreate(['title' => $item['title']], $item);
        }
    }
}
