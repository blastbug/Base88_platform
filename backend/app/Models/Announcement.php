<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * お知らせ（運営 → 加盟会社）。level: normal | important
 */
class Announcement extends Model
{
    public const LEVEL_NORMAL = 'normal';
    public const LEVEL_IMPORTANT = 'important';

    protected $fillable = ['title', 'body', 'level', 'published_at'];

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    /** 公開済み（published_at が過去） */
    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }
}
