<?php

namespace App\Notifications;

use App\Models\MovingJob;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** 成約時、成約会社（受注側）へ通知 */
class ContractAwarded extends Notification
{
    public function __construct(public MovingJob $job) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $route = "{$this->job->from_prefecture} → {$this->job->to_prefecture}";
        $url = rtrim(config('app.frontend_url'), '/') . "/jobs/{$this->job->id}";

        return (new MailMessage)
            ->subject('【BASE88】成約のお知らせ')
            ->greeting('成約おめでとうございます')
            ->line("案件「{$route}」で成約となりました。顧客情報が開示されましたのでご確認ください。")
            ->action('案件詳細・顧客情報を確認する', $url)
            ->line('成約後は、当事者間で直接ご連絡のうえ対応をお願いいたします。');
    }
}
