<?php

namespace App\Filament\Pages;

use App\Models\Company;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Radio;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class BroadcastAnnouncement extends Page implements HasForms
{
    use InteractsWithForms;

    protected string $view = 'filament.pages.broadcast-announcement';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedMegaphone;

    protected static ?string $navigationLabel = 'お知らせ配信';

    protected static ?string $title = 'お知らせ配信';

    protected static ?int $navigationSort = 7;

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'target' => 'all',
            'schedule' => 'now',
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('title')
                    ->label('タイトル')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('例：システムメンテナンスのお知らせ'),
                Radio::make('target')
                    ->label('対象')
                    ->options([
                        'all' => 'すべての加盟会社',
                        'specific' => '特定の加盟会社を選択',
                    ])
                    ->default('all')
                    ->live(),
                Select::make('company_ids')
                    ->label('配信先の加盟会社')
                    ->multiple()
                    ->options(Company::orderBy('name')->pluck('name', 'id'))
                    ->searchable()
                    ->visible(fn ($get) => $get('target') === 'specific'),
                Textarea::make('body')
                    ->label('内容')
                    ->required()
                    ->rows(6)
                    ->placeholder('お知らせの内容を入力してください。'),
                Radio::make('schedule')
                    ->label('配信日時')
                    ->options([
                        'now' => 'すぐに配信する',
                        'scheduled' => '日時を指定する',
                    ])
                    ->default('now')
                    ->live(),
                DateTimePicker::make('scheduled_at')
                    ->label('配信日時')
                    ->visible(fn ($get) => $get('schedule') === 'scheduled')
                    ->required(fn ($get) => $get('schedule') === 'scheduled'),
            ])
            ->statePath('data');
    }

    protected function getFormActions(): array
    {
        return [
            Action::make('submit')
                ->label('確認画面へ')
                ->submit('submit'),
        ];
    }

    public function submit(): void
    {
        $data = $this->form->getState();

        // TODO: 実際の配信処理（メール送信・お知らせ保存）を実装
        Notification::make()
            ->title('お知らせを受け付けました')
            ->body($data['schedule'] === 'now' ? 'すぐに配信されます。' : '指定日時に配信予約しました。')
            ->success()
            ->send();
    }
}
