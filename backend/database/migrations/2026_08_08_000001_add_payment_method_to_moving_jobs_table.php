<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 案件の支払方法（クレジットカード / 当日代行集金）。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('moving_jobs', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('desired_price');
        });
    }

    public function down(): void
    {
        Schema::table('moving_jobs', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });
    }
};
