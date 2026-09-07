<?php

use App\Http\Controllers\Api\V1\System\SystemLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Read-only: these are the framework's own files, not app data.
    Route::get('system-logs/levels', [SystemLogController::class, 'levels'])
        ->name('system-logs.levels');
    Route::get('system-logs', [SystemLogController::class, 'index'])
        ->name('system-logs.index');
});
