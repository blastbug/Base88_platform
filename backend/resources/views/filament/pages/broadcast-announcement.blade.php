<x-filament-panels::page>
    <form wire:submit="submit" class="max-w-3xl">
        {{ $this->form }}

        <div class="mt-6 flex justify-end">
            <x-filament::button type="submit">
                確認画面へ
            </x-filament::button>
        </div>
    </form>
</x-filament-panels::page>
