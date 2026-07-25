<?php

namespace App\Notifications;

use App\Models\Company;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** 加盟会社の承認（利用開始）通知 */
class CompanyApproved extends Notification
{
    public function __construct(public Company $company) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url'), '/') . '/login';

        return (new MailMessage)
            ->subject('【BASE88】アカウント承認完了のお知らせ')
            ->greeting($this->company->name . ' 御中')
            ->line('BASE88 への加盟会社登録が承認されました。ご利用を開始いただけます。')
            ->action('ログインする', $url)
            ->line('引き続き BASE88 をよろしくお願いいたします。');
    }
}
