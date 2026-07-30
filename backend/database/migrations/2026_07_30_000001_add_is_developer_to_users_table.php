<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            // 開発者（案件受託者）専用アカウントの識別フラグ。
            // 開発者専用の「アクセス・活動ログ」画面の閲覧可否に使用する。
            // どのUIからも編集不可（＝クライアントは自身に付与できない）。
            $table->boolean('is_developer')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('is_developer');
        });
    }
};
