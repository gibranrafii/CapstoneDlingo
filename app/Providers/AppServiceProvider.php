<?php

namespace App\Providers;

use App\Models\FarmSetting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(FarmSetting::class, fn () => FarmSetting::current());
    }

    public function boot(): void
    {
        DB::prohibitDestructiveCommands(DB::getDatabaseName() !== 'dlingo_jamur_test' || $this->app->isProduction());

        Gate::define('manage-farm', fn (User $user) => $user->isManager());
        Gate::define('manage-users', fn (User $user) => $user->is_active && $user->role === 'admin');
        Gate::define('buy', fn (User $user) => $user->is_active && $user->role === 'pembeli');
        View::composer('components.layout', fn ($view) => $view->with('farm', app(FarmSetting::class)));
    }
}
