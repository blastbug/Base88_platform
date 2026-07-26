<?php

namespace App\Notifications;

use App\Models\JobApplication;
use App\Models\MovingJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** 自社案件に応募が入った際、掲載（発注）会社へ通知 */
class JobApplied extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public MovingJob $job, public JobApplication $application) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $route = "{$this->job->from_prefecture} → {$this->job->to_prefecture}";
        $url = rtrim(config('app.frontend_url'), '/') . "/my/jobs/{$this->job->id}/applications";

        return (new MailMessage)
            ->subject('【BASE88】掲載案件に新しい応募がありました')
            ->greeting('新しい応募のお知らせ')
            ->line("掲載中の案件「{$route}」に、{$this->application->company->name} 様から応募がありました。")
            ->action('応募一覧を確認する', $url)
            ->line('応募一覧から依頼先をご確認・ご決定ください。');
    }
}
