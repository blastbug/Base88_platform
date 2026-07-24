<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 応募（job_applications）
 *  - (moving_job_id, company_id) を一意 → 二重応募防止
 *  - 自社案件への応募禁止は、アプリ層（バリデーション／Policy）で company_id != moving_jobs.company_id を強制
 * status: applied（応募中）/ accepted（成約）/ rejected（不成立）
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moving_job_id')->constrained('moving_jobs')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies'); // 応募会社
            $table->foreignId('applied_by')->constrained('users');     // 応募担当者
            $table->text('message')->nullable();                       // 応募メッセージ
            $table->string('status')->default('applied')->index();
            $table->timestamps();

            $table->unique(['moving_job_id', 'company_id']); // 二重応募防止
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
