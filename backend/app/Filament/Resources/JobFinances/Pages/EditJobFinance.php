<?php

namespace App\Filament\Resources\JobFinances\Pages;

use App\Filament\Resources\JobFinances\JobFinanceResource;
use Filament\Resources\Pages\EditRecord;

class EditJobFinance extends EditRecord
{
    protected static string $resource = JobFinanceResource::class;

    protected function afterSave(): void
    {
        activity('operation')->causedBy(auth()->user())->performedOn($this->record)
            ->event('finance_updated')->log('精算・売上情報を更新');
    }
}
