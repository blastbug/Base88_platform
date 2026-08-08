<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 案件の配信方法（all 全体配信 / targeted 指名配信）。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('moving_jobs', function (Blueprint $table) {
            $table->string('distribution_type')->default('all')->after('status')->index();
        });
    }

    public function down(): void
    {
        Schema::table('moving_jobs', function (Blueprint $table) {
            $table->dropColumn('distribution_type');
        });
    }
};
