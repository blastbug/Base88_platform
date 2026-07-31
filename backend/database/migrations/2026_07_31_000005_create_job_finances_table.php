<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 案件ごとの精算・売上情報（成約1件につき1件）。
 * 売上金額・代行集金額・追加料金・請求予定/支払予定・入金/支払状況を管理する。
 * 送金額は 代行集金額 − 代行集金手数料（率×集金額）で自動算出する。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_finances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_contract_id')->unique()->constrained('job_contracts')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies'); // 成約（受注）会社
            $table->unsignedInteger('sale_amount')->nullable();        // 売上金額（受注金額）

            // 代行集金（加盟店が現地で集金）
            $table->unsignedInteger('collected_amount')->nullable();   // 代行集金額
            $table->decimal('collection_fee_rate', 5, 2)->default(10); // 代行集金手数料率（％・管理者可変）
            $table->boolean('collection_confirmed')->default(false);   // 管理者確認状況

            // 追加料金
            $table->unsignedInteger('additional_amount')->nullable();  // 追加料金額
            $table->string('additional_detail')->nullable();           // 追加料金の内容
            $table->string('additional_reason')->nullable();           // 発生理由
            $table->string('additional_note')->nullable();             // 備考
            $table->date('additional_input_date')->nullable();         // 入力日
            $table->boolean('additional_confirmed')->default(false);   // 管理者確認状況

            // 請求・支払
            $table->unsignedInteger('billing_amount')->nullable();     // 請求予定金額
            $table->unsignedInteger('payment_amount')->nullable();     // 支払予定金額
            $table->string('deposit_status')->default('unpaid');       // 入金状況 unpaid/partial/paid
            $table->string('payment_status')->default('unpaid');       // 支払状況 unpaid/paid
            $table->date('settled_month')->nullable()->index();        // 計上月（月別集計用・成約日から補完）

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_finances');
    }
};
