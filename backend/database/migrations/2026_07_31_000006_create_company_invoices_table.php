<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 加盟店からの請求書アップロード（月次）。
 * 対象月・請求金額・請求書ファイル・管理者確認状況・修正依頼・支払状況を管理する。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('target_month');                       // 対象月（YYYY-MM）
            $table->unsignedInteger('amount')->nullable();        // 請求金額
            $table->string('file_path')->nullable();              // 請求書ファイル（画像/PDF）
            $table->timestamp('uploaded_at')->nullable();         // アップロード日
            $table->string('review_status')->default('pending');  // 管理者確認状況 pending/confirmed/rejected
            $table->text('reject_reason')->nullable();            // 修正依頼
            $table->string('payment_status')->default('unpaid');  // 支払状況 unpaid/paid
            $table->date('paid_at')->nullable();                  // 支払日
            $table->timestamps();

            $table->index(['company_id', 'target_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_invoices');
    }
};
