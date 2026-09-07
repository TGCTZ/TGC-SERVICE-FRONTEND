<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public — rate limited to blunt credential stuffing.
    Route::middleware('throttle:6,1')->group(function () {
        Route::post('auth/register', [AuthController::class, 'register'])
            ->name('auth.register');
        Route::post('auth/login', [AuthController::class, 'login'])
            ->name('auth.login');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout'])
            ->name('auth.logout');
        Route::post('auth/refresh', [AuthController::class, 'refresh'])
            ->name('auth.refresh');
        Route::get('auth/me', [AuthController::class, 'me'])
            ->name('auth.me');
        // Throttled like login: it accepts a password and so is guessable.
        Route::post('auth/password', [AuthController::class, 'changePassword'])
            ->middleware('throttle:6,1')
            ->name('auth.password');
    });
});
