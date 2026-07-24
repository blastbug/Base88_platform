<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 成約（job_contracts）
 * 発注会社が1応募を選択して成約。1案件につき1成約（moving_job_id を unique）。
 * 成約成立で案件は contracted に、他応募は rejected に、成約会社にのみ顧客情報開示権限を付与（トランザクション処理）。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moving_job_id')->unique()->constrained('moving_jobs')->cascadeOnDelete();
            $table->foreignId('job_application_id')->constrained('job_applications'); // 成約した応募
            $table->foreignId('winning_company_id')->constrained('companies');        // 成約会社
            $table->dateTime('contracted_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_contracts');
    }
};
