<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 案件ID（job_code）を追加。
 * 管理者が任意の番号を入力でき（重複不可）、空欄の場合は自動発行する。
 * 既存案件には従来の表示コード（T-YYYY-MMDD-連番）を補完する。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('moving_jobs', function (Blueprint $table) {
            $table->string('job_code', 50)->nullable()->unique()->after('id');
        });

        // 既存案件へ従来の表示コードを補完（ソフトデリート含む）
        DB::table('moving_jobs')->orderBy('id')->get(['id', 'moving_date'])->each(function ($row) {
            $datePart = $row->moving_date
                ? Carbon::parse($row->moving_date)->format('Y-md')
                : '0000-0000';
            DB::table('moving_jobs')->where('id', $row->id)->update([
                'job_code' => sprintf('T-%s-%03d', $datePart, $row->id),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('moving_jobs', function (Blueprint $table) {
            $table->dropUnique(['job_code']);
            $table->dropColumn('job_code');
        });
    }
};
