<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 加盟店ごとの事故・クレーム履歴（加盟店詳細情報 ⑫）。
 * 未収金は精算（job_finances）の入金状況から把握するが、個別の未収案件も記録できる。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('moving_job_id')->nullable()->constrained('moving_jobs')->nullOnDelete(); // 関連案件（任意）
            $table->string('type');                       // accident 事故 / complaint クレーム
            $table->date('occurred_on')->nullable();      // 発生日
            $table->string('title');                      // 件名
            $table->text('description')->nullable();      // 詳細
            $table->string('status')->default('open');    // open 対応中 / resolved 解決済み
            $table->text('resolution')->nullable();       // 対応内容
            $table->unsignedInteger('damage_amount')->nullable(); // 損害額・未収額
            $table->timestamps();

            $table->index(['company_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_incidents');
    }
};
