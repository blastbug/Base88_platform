<?php

namespace App\Notifications;

use App\Models\Company;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** 新しい加盟会社の登録申請を運営（BASE88管理者）へ通知 */
class CompanyRegistered extends Notification
{
    public function __construct(public Company $company) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.url'), '/') . '/admin';

        return (new MailMessage)
            ->subject('【BASE88】新しい加盟会社の登録申請')
            ->line('新しい加盟会社の登録申請がありました。')
            ->line('会社名：' . $this->company->name)
            ->line('電話番号：' . ($this->company->phone ?: '—'))
            ->action('管理画面で確認・承認する', $url)
            ->line('内容をご確認のうえ、承認または利用停止のご対応をお願いします。');
    }
}
