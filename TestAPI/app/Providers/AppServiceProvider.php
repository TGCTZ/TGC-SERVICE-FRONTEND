<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Collections in this API build their own envelope (a plural resource
        // key plus links/meta). Laravel's default "data" wrapper would nest
        // that inside a second envelope, so it is disabled here.
        JsonResource::withoutWrapping();
    }
}
