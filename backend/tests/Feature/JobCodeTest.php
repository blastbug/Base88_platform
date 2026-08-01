<?php

namespace Tests\Feature;

use App\Models\MovingJob;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 2：案件ID（job_code）の自動発行・重複チェック・キーワード検索。
 */
class JobCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_code_is_auto_generated_when_blank(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $job = $this->makeJob($owner)->refresh();

        $expected = sprintf('T-%s-%03d', $job->moving_date->format('Y-md'), $job->id);
        $this->assertSame($expected, $job->job_code);
    }

    public function test_admin_provided_job_code_is_kept(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $job = $this->makeJob($owner, ['job_code' => 'CUSTOM-0001'])->refresh();

        $this->assertSame('CUSTOM-0001', $job->job_code);
    }

    public function test_duplicate_job_code_is_rejected(): void
    {
        [$owner] = $this->makeApprovedCompanyUser();
        $this->makeJob($owner, ['job_code' => 'DUP-0001']);

        $this->expectException(QueryException::class);
        $this->makeJob($owner, ['job_code' => 'DUP-0001']);
    }

    public function test_keyword_search_matches_job_code(): void
    {
        [$owner, $user] = $this->makeApprovedCompanyUser();
        $target = $this->makeJob($owner, ['job_code' => 'SEARCH-ABC']);
        $this->makeJob($owner, ['job_code' => 'OTHER-XYZ']);

        Sanctum::actingAs($user);
        $res = $this->getJson('/api/jobs?keyword=SEARCH-ABC')->assertOk();

        $ids = collect($res->json('data'))->pluck('id')->all();
        $this->assertSame([$target->id], $ids);
    }
}
