<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 加盟会社（companies）
 * BASE88管理者の承認制。status で pending / approved / suspended を管理。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');                        // 会社名
            $table->string('address')->nullable();         // 住所
            $table->string('phone')->nullable();           // 電話番号
            $table->string('corporate_number')->nullable(); // 法人番号（任意）
            $table->string('invoice_number')->nullable();  // インボイス番号（任意）
            $table->string('status')->default('pending')->index(); // pending / approved / suspended
            $table->timestamp('approved_at')->nullable();  // 承認日時
            $table->timestamps();
            $table->softDeletes();                         // 退会（論理削除）
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
