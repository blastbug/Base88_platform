<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 顧客情報（moving_job_customer_details）
 * 【重要】案件本体と物理的に分離。公開一覧・検索結果には一切含めない。
 * 開示は「成約済み」かつ「成約会社」の場合のみ、API層の権限制御（Policy）で許可する。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moving_job_customer_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moving_job_id')->unique()->constrained('moving_jobs')->cascadeOnDelete();
            $table->string('customer_name');       // 顧客氏名
            $table->string('customer_phone');      // 電話番号
            $table->string('customer_address');    // 詳細住所
            $table->text('contact_note')->nullable(); // その他連絡事項
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moving_job_customer_details');
    }
};
