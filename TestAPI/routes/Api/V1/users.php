<?php

use App\Http\Controllers\Api\V1\User\GenderController;
use App\Http\Controllers\Api\V1\User\IdentityDetailController;
use App\Http\Controllers\Api\V1\User\PermissionController;
use App\Http\Controllers\Api\V1\User\RoleController;
use App\Http\Controllers\Api\V1\User\UserController;
use App\Http\Controllers\Api\V1\User\UserStatusController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::patch('users/{user}/restore', [UserController::class, 'restore']
    )->name('users.restore');
    // Assign roles to a user (the UI user-access screen).
    Route::put(
        'users/{user}/roles',
        [UserController::class, 'syncRoles']
    )->name('users.roles.sync');
    Route::apiResource('users', UserController::class);

    // RBAC — roles are user-editable, permissions are read-only.
    Route::put(
        'roles/{role}/permissions',
        [RoleController::class, 'syncPermissions']
    )->name('roles.permissions.sync');
    Route::apiResource('roles', RoleController::class)->except(['restore']);

    Route::get(
        'permissions/grouped',
        [PermissionController::class, 'grouped']
    )->name('permissions.grouped');
    Route::apiResource('permissions', PermissionController::class)
        ->only(['index', 'show']);

    Route::patch(
        'user-statuses/{user_status}/restore',
        [UserStatusController::class, 'restore']
    )->name('user-statuses.restore');
    Route::apiResource('user-statuses', UserStatusController::class);

    Route::patch(
        'genders/{gender}/restore',
        [GenderController::class, 'restore']
    )->name('genders.restore');
    Route::apiResource('genders', GenderController::class);

    Route::patch(
        'identity-details/{identity_detail}/restore',
        [IdentityDetailController::class, 'restore']
    )->name('identity-details.restore');
    Route::apiResource('identity-details', IdentityDetailController::class);
});
