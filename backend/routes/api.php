<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\MeController;
use Illuminate\Support\Facades\Route;

// 認証不要
Route::post('/auth/login', [AuthController::class, 'login']);

// 認証必須（Sanctum トークン）
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    // 案件（発注・受注 共通の閲覧／発注操作）
    Route::get('/jobs', [JobController::class, 'index']);
    Route::post('/jobs', [JobController::class, 'store']);
    Route::get('/jobs/{job}', [JobController::class, 'show']);
    Route::get('/jobs/{job}/applications', [JobController::class, 'applications']);
    Route::post('/jobs/{job}/decide', [JobController::class, 'decide']);
    Route::post('/jobs/{job}/complete', [JobController::class, 'complete']);
    Route::post('/jobs/{job}/cancel', [JobController::class, 'cancel']);

    // 応募（受注側）
    Route::post('/jobs/{job}/apply', [ApplicationController::class, 'store']);

    // 自社関連
    Route::get('/my/jobs', [JobController::class, 'myPosted']);
    Route::get('/my/applications', [ApplicationController::class, 'myApplications']);
    Route::get('/my/contracts', [JobController::class, 'myContracts']);

    // マイページ（会社情報・担当者・パスワード）
    Route::get('/me/company', [MeController::class, 'company']);
    Route::put('/me/company', [MeController::class, 'updateCompany']);
    Route::get('/me/staff', [MeController::class, 'staff']);
    Route::put('/me/password', [MeController::class, 'updatePassword']);
});
