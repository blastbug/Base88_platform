<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 指名配信の配信先（案件 ↔ 加盟会社）。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moving_job_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moving_job_id')->constrained('moving_jobs')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['moving_job_id', 'company_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moving_job_targets');
    }
};
