<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 許可証・本人確認書類・保険証券など（加盟店登録フォーマット 6/8）。
 * 画像またはPDFをアップロードし、書類ごとに管理者の確認状況・差し戻し理由を保持する。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('doc_type');                    // 書類種別（運転免許証/古物商許可証/軽貨物許可証/一般貨物許可証/保険証券/その他）
            $table->string('doc_name')->nullable();        // 書類名
            $table->string('permit_number')->nullable();   // 許可番号
            $table->date('expiry_date')->nullable();       // 有効期限
            $table->string('file_path')->nullable();       // 画像・PDF（storage 相対パス）
            $table->string('review_status')->default('pending'); // pending 確認待ち / confirmed 確認済み / rejected 差し戻し
            $table->text('reject_reason')->nullable();     // 差し戻し理由
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_documents');
    }
};
