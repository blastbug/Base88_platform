<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * パスワード再設定メール。フロントエンドの再設定画面へのリンクを送る。
 */
class ResetPasswordLink extends Notification
{
    public function __construct(public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url'), '/')
            . '/reset-password?token=' . $this->token
            . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        $expire = config('auth.passwords.' . config('auth.defaults.passwords') . '.expire', 60);

        return (new MailMessage)
            ->subject('【BASE88】パスワード再設定のご案内')
            ->greeting('パスワード再設定')
            ->line('パスワード再設定のリクエストを受け付けました。以下のボタンから再設定してください。')
            ->action('パスワードを再設定する', $url)
            ->line("このリンクの有効期限は {$expire} 分です。")
            ->line('心当たりがない場合は、このメールを破棄してください。');
    }
}
