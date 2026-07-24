<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * users テーブル拡張：
 *  - company_id : 所属加盟会社（BASE88管理者は null）
 *  - role       : platform_admin / company_admin / staff（権限は spatie/permission でも管理）
 *  - is_active  : 利用停止フラグ
 * ※ users は既存テーブル（0001_01_01_000000）。SQLite 互換のため DB レベルの外部キーは張らず、
 *    アプリ層（モデルのリレーション）で company との整合性を担保する。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('company_id')->nullable()->after('id')->index();
            $table->string('role')->default('staff')->after('password'); // platform_admin / company_admin / staff
            $table->boolean('is_active')->default(true)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['company_id', 'role', 'is_active']);
        });
    }
};
