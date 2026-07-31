<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 加盟店登録フォーマットの拡充（会社情報／代表者／担当者／会社規模／会社実績／
 * 保険／保有資材／対応サービス）と審査ワークフロー（7ステータス・修正依頼）。
 * 保有車両・許可証/書類は別テーブル（company_vehicles / company_documents）。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            // --- 1. 会社情報（name / corporate_number / address / phone は既存） ---
            $table->string('name_kana')->nullable()->after('name');          // 会社名フリガナ
            $table->string('postal_code')->nullable()->after('address');     // 郵便番号
            $table->string('company_email')->nullable()->after('phone');     // 会社メールアドレス
            $table->string('established_ym')->nullable();                    // 設立年月（YYYY-MM）
            $table->string('website')->nullable();                          // 会社ホームページ
            $table->text('service_areas')->nullable();                      // 対応可能エリア
            $table->string('business_hours')->nullable();                   // 営業時間
            $table->string('holidays')->nullable();                         // 定休日

            // --- 2. 代表者情報 ---
            $table->string('rep_name')->nullable();
            $table->string('rep_name_kana')->nullable();
            $table->date('rep_birthday')->nullable();
            $table->string('rep_address')->nullable();
            $table->string('rep_phone')->nullable();
            $table->string('rep_email')->nullable();

            // --- 3. 担当者情報 ---
            $table->string('contact_name')->nullable();
            $table->string('contact_department')->nullable();
            $table->string('contact_title')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();

            // --- 4. 会社規模 ---
            $table->unsignedInteger('employee_count')->nullable();          // 従業員数
            $table->unsignedInteger('worker_count')->nullable();            // 作業員数
            $table->unsignedInteger('sales_staff_count')->nullable();       // 営業担当者数
            $table->unsignedInteger('vehicle_count')->nullable();           // 車両数

            // --- 6. 許可証の有無（証憑は company_documents） ---
            $table->boolean('has_antique_license')->nullable();             // 古物商許可
            $table->boolean('has_light_cargo_license')->nullable();         // 軽貨物運送事業
            $table->boolean('has_general_cargo_license')->nullable();       // 一般貨物自動車運送事業

            // --- 7. 会社実績 ---
            $table->unsignedInteger('experience_years')->nullable();        // 経験年数
            $table->unsignedInteger('annual_jobs')->nullable();             // 年間対応件数
            $table->unsignedInteger('monthly_capacity')->nullable();        // 月間対応可能件数
            $table->boolean('corporate_experience')->nullable();            // 法人案件の対応実績
            $table->boolean('individual_experience')->nullable();           // 個人案件の対応実績
            $table->boolean('long_distance_support')->nullable();           // 長距離引っ越しの対応可否
            $table->unsignedInteger('peak_capacity')->nullable();           // 繁忙期の対応可能件数
            $table->text('main_clients')->nullable();                       // 主な取引先
            $table->text('achievements')->nullable();                       // 過去の実績・アピール内容

            // --- 8. 保険加入状況（保険証券は company_documents） ---
            $table->boolean('has_transport_insurance')->nullable();         // 運送保険
            $table->boolean('has_cargo_insurance')->nullable();             // 貨物保険
            $table->boolean('has_liability_insurance')->nullable();         // 請負業者賠償責任保険
            $table->boolean('has_auto_insurance')->nullable();              // 自動車保険
            $table->string('insurer_name')->nullable();                     // 保険会社名
            $table->string('policy_number')->nullable();                    // 保険証券番号
            $table->unsignedBigInteger('coverage_amount')->nullable();      // 補償金額
            $table->date('insurance_expiry')->nullable();                   // 保険の有効期限

            // --- 9. 保有資材（個数・数量） ---
            $table->unsignedInteger('material_hanger_box')->nullable();     // ハンガーボックス
            $table->unsignedInteger('material_futon_bag')->nullable();      // 布団袋
            $table->unsignedInteger('material_mattress_cover')->nullable(); // マットレスカバー
            $table->unsignedInteger('material_plastic_sheet')->nullable();  // プラ段シート
            $table->unsignedInteger('material_floor_board_m')->nullable();  // 床養生ボード（m）

            // --- 10. 対応可能サービス（可否） ---
            $table->boolean('svc_disposal_pickup')->nullable();  // 不用品引き取り
            $table->boolean('svc_disposal_buy')->nullable();     // 不用品買取
            $table->boolean('svc_ac_install')->nullable();       // エアコン脱着
            $table->boolean('svc_washer_install')->nullable();   // 洗濯機設置
            $table->boolean('svc_furniture_assembly')->nullable(); // 家具組立て
            $table->boolean('svc_appliance_install')->nullable(); // 家電設置
            $table->boolean('svc_packing')->nullable();          // 梱包作業
            $table->boolean('svc_unpacking')->nullable();        // 開梱作業
            $table->boolean('svc_protection')->nullable();       // 養生作業
            $table->boolean('svc_long_distance')->nullable();    // 長距離配送
            $table->boolean('svc_storage')->nullable();          // 一時保管

            // --- 審査ワークフロー ---
            // 入力途中 / 申請済み / 審査中 / 修正依頼 / 承認済み / 利用停止 / 契約終了
            $table->string('review_status')->default('draft')->index()->after('status');
            $table->text('review_note')->nullable();          // 管理者からの修正依頼コメント
            $table->timestamp('submitted_at')->nullable();    // 申請日時
            $table->timestamp('reviewed_at')->nullable();     // 審査日時
        });

        // 既存会社は現行 status に合わせて審査ステータスを整合させる
        DB::table('companies')->where('status', 'approved')->update(['review_status' => 'approved']);
        DB::table('companies')->where('status', 'suspended')->update(['review_status' => 'suspended']);
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'name_kana', 'postal_code', 'company_email', 'established_ym', 'website',
                'service_areas', 'business_hours', 'holidays',
                'rep_name', 'rep_name_kana', 'rep_birthday', 'rep_address', 'rep_phone', 'rep_email',
                'contact_name', 'contact_department', 'contact_title', 'contact_phone', 'contact_email',
                'employee_count', 'worker_count', 'sales_staff_count', 'vehicle_count',
                'has_antique_license', 'has_light_cargo_license', 'has_general_cargo_license',
                'experience_years', 'annual_jobs', 'monthly_capacity', 'corporate_experience',
                'individual_experience', 'long_distance_support', 'peak_capacity', 'main_clients', 'achievements',
                'has_transport_insurance', 'has_cargo_insurance', 'has_liability_insurance', 'has_auto_insurance',
                'insurer_name', 'policy_number', 'coverage_amount', 'insurance_expiry',
                'material_hanger_box', 'material_futon_bag', 'material_mattress_cover', 'material_plastic_sheet', 'material_floor_board_m',
                'svc_disposal_pickup', 'svc_disposal_buy', 'svc_ac_install', 'svc_washer_install',
                'svc_furniture_assembly', 'svc_appliance_install', 'svc_packing', 'svc_unpacking',
                'svc_protection', 'svc_long_distance', 'svc_storage',
                'review_status', 'review_note', 'submitted_at', 'reviewed_at',
            ]);
        });
    }
};
