<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;

class AnnouncementController extends Controller
{
    /** 公開中のお知らせ一覧（ヘッダーの通知ベル用） */
    public function index(): JsonResponse
    {
        $items = Announcement::published()->latest('published_at')->limit(20)->get()
            ->map(fn (Announcement $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'body' => $a->body,
                'level' => $a->level,
                'published_at' => optional($a->published_at)->toIso8601String(),
            ]);

        return response()->json(['data' => $items]);
    }
}
