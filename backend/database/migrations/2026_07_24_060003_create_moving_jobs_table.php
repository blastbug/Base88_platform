<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 引越案件（moving_jobs）※ Laravel 予約テーブル "jobs"（キュー）との衝突回避で moving_jobs とする。
 * 投稿時点では顧客個人情報は保持しない（顧客情報は moving_job_customer_details に成約後開示用として分離）。
 * status: recruiting（募集中）/ closed（募集終了）/ contracted（成約）/ completed（完了）/ cancelled（キャンセル）
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moving_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies'); // 掲載（発注）会社
            $table->date('moving_date');                     // 引越日
            $table->string('time_slot')->nullable();         // 時間帯
            $table->string('from_prefecture');               // 出発地 都道府県
            $table->string('from_city')->nullable();         // 出発地 市区町村
            $table->string('to_prefecture');                 // 到着地 都道府県
            $table->string('to_city')->nullable();           // 到着地 市区町村
            $table->string('building_type');                 // 建物種別
            $table->string('layout')->nullable();            // 間取り
            $table->string('luggage_volume');                // 荷物量
            $table->string('truck_size')->nullable();        // トラックサイズ
            $table->unsignedSmallInteger('worker_count')->nullable(); // 必要人数
            $table->string('floors')->nullable();            // 階数（要確認事項：初版仕様に準拠し保持）
            $table->boolean('has_elevator')->nullable();     // エレベーター有無（同上）
            $table->unsignedInteger('desired_price')->nullable(); // 希望金額（任意）
            $table->text('note')->nullable();                // 備考・注意事項
            $table->dateTime('application_deadline');        // 募集締切
            $table->string('status')->default('recruiting')->index(); // ステータス
            $table->timestamps();
            $table->softDeletes();

            $table->index(['from_prefecture', 'moving_date']); // 検索（都道府県・日付）
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moving_jobs');
    }
};
