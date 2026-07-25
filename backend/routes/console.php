<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 締切超過の案件を自動的に募集終了にする（§13）
Schedule::command('jobs:close-expired')->everyFiveMinutes();
