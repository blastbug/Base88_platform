<?php

namespace App\Filament\Resources\Companies\Tables;

use App\Models\Company;
use App\Notifications\CompanyApproved;
use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Notification;

class CompaniesTable
{
    /** 審査ステータスごとのバッジ色 */
    private static function reviewColor(string $state): string
    {
        return match ($state) {
            Company::REVIEW_APPROVED => 'success',
            Company::REVIEW_SUBMITTED => 'info',
            Company::REVIEW_UNDER_REVIEW => 'warning',
            Company::REVIEW_REVISION => 'danger',
            Company::REVIEW_SUSPENDED => 'danger',
            Company::REVIEW_TERMINATED => 'gray',
            default => 'gray', // draft
        };
    }

    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('会社名')
                    ->weight('bold')
                    ->description(fn (Company $r) => $r->name_kana)
                    ->searchable(),
                TextColumn::make('representative')
                    ->label('担当者名')
                    ->getStateUsing(fn (Company $r) => $r->contact_name ?: ($r->users->first()?->name ?? '—')),
                TextColumn::make('contact_email')
                    ->label('メールアドレス')
                    ->getStateUsing(fn (Company $r) => $r->contact_email ?: ($r->users->first()?->email ?? '—')),
                TextColumn::make('review_status')
                    ->label('審査ステータス')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => Company::REVIEW_LABELS[$state] ?? $state)
                    ->color(fn (string $state) => self::reviewColor($state)),
                TextColumn::make('documents_count')
                    ->label('書類')
                    ->counts('documents')
                    ->suffix(' 件')
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->label('登録日')
                    ->date('Y/m/d')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('review_status')->label('審査ステータス')
                    ->options(Company::REVIEW_LABELS),
            ])
            ->recordActions([
                EditAction::make()->label('編集'),
                ActionGroup::make([
                    Action::make('start_review')
                        ->label('審査を開始')
                        ->icon('heroicon-o-magnifying-glass')
                        ->color('warning')
                        ->visible(fn (Company $r) => in_array($r->review_status, [Company::REVIEW_SUBMITTED, Company::REVIEW_REVISION, Company::REVIEW_DRAFT], true))
                        ->action(fn (Company $r) => self::transition($r, Company::REVIEW_UNDER_REVIEW, '審査を開始')),

                    Action::make('request_revision')
                        ->label('修正依頼')
                        ->icon('heroicon-o-pencil-square')
                        ->color('danger')
                        ->visible(fn (Company $r) => ! in_array($r->review_status, [Company::REVIEW_APPROVED, Company::REVIEW_TERMINATED], true))
                        ->schema([
                            Textarea::make('review_note')->label('修正が必要な項目・理由')
                                ->helperText('この内容は加盟店側の申請状況ページに表示されます。')
                                ->required()->rows(4),
                        ])
                        ->modalHeading('加盟店へ修正を依頼')
                        ->modalSubmitActionLabel('修正依頼を送信')
                        ->action(function (array $data, Company $r) {
                            $r->update([
                                'review_status' => Company::REVIEW_REVISION,
                                'review_note' => $data['review_note'],
                                'reviewed_at' => now(),
                            ]);
                            activity('operation')->causedBy(auth()->user())->performedOn($r)
                                ->event('revision')->log('加盟店へ修正を依頼');
                        }),

                    Action::make('approve')
                        ->label('承認')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->visible(fn (Company $r) => $r->review_status !== Company::REVIEW_APPROVED)
                        ->requiresConfirmation()
                        ->modalHeading('加盟店を承認')
                        ->modalDescription('承認すると加盟店がログイン・利用を開始できます。')
                        ->action(function (Company $r) {
                            $r->update(['review_status' => Company::REVIEW_APPROVED, 'reviewed_at' => now()]);
                            try {
                                Notification::send(
                                    $r->users()->where('is_active', true)->get(),
                                    new CompanyApproved($r)
                                );
                            } catch (\Throwable $e) {
                                report($e);
                            }
                            activity('operation')->causedBy(auth()->user())->performedOn($r)
                                ->event('approved')->log('加盟店を承認');
                        }),

                    Action::make('suspend')
                        ->label('利用停止')
                        ->icon('heroicon-o-no-symbol')
                        ->color('danger')
                        ->visible(fn (Company $r) => $r->review_status === Company::REVIEW_APPROVED)
                        ->requiresConfirmation()
                        ->modalHeading('加盟店を利用停止')
                        ->action(fn (Company $r) => self::transition($r, Company::REVIEW_SUSPENDED, '加盟店を利用停止')),

                    Action::make('terminate')
                        ->label('契約終了')
                        ->icon('heroicon-o-x-circle')
                        ->color('gray')
                        ->visible(fn (Company $r) => $r->review_status !== Company::REVIEW_TERMINATED)
                        ->requiresConfirmation()
                        ->modalHeading('契約を終了')
                        ->modalDescription('契約終了にすると加盟店は利用できなくなります。')
                        ->action(fn (Company $r) => self::transition($r, Company::REVIEW_TERMINATED, '加盟店の契約を終了')),
                ])
                    ->label('審査操作')
                    ->button()
                    ->icon('heroicon-o-clipboard-document-check'),
            ])
            ->defaultSort('created_at', 'desc');
    }

    /** 審査ステータス遷移＋操作ログ記録 */
    private static function transition(Company $company, string $reviewStatus, string $logMessage): void
    {
        $company->update(['review_status' => $reviewStatus, 'reviewed_at' => now()]);
        activity('operation')->causedBy(auth()->user())->performedOn($company)
            ->event($reviewStatus)->log($logMessage);
    }
}
