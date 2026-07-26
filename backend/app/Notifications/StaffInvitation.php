<?php

namespace App\Notifications;

use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** 担当者追加時の招待メール（パスワード設定リンク付き） */
class StaffInvitation extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Company $company, public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url'), '/')
            . '/reset-password?token=' . $this->token
            . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject('【BASE88】アカウント発行のお知らせ')
            ->greeting($notifiable->name . ' 様')
            ->line("{$this->company->name} の担当者として BASE88 のアカウントが発行されました。")
            ->line('以下のボタンからパスワードを設定して、ご利用を開始してください。')
            ->action('パスワードを設定する', $url)
            ->line('このリンクの有効期限は60分です。期限が切れた場合は、ログイン画面の「パスワードをお忘れですか？」から再度設定できます。');
    }
}
