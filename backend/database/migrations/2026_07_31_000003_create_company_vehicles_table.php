<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 保有車両（加盟店登録フォーマット 5. 保有車両情報）
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('vehicle_type')->nullable();   // 車両区分
            $table->string('truck_size')->nullable();     // トラックサイズ
            $table->unsignedInteger('count')->default(1); // 台数
            $table->string('max_load')->nullable();       // 最大積載量
            $table->string('plate_number')->nullable();   // ナンバー
            $table->string('ownership')->nullable();      // 自社所有 / リース
            $table->string('availability')->nullable();   // 稼働可能状況
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_vehicles');
    }
};
