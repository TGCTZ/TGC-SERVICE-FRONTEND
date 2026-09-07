<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))->withRouting(
    api: __DIR__.'/../routes/api.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up'
)->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias(
        [
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]
    );
})->withExceptions(function (Exceptions $exceptions): void {
    // This is an API: never redirect to a login route (there isn't one) and
    // never return an HTML error page. Always answer with JSON.
    $exceptions->shouldRenderJsonWhen(
        fn (Request $request, Throwable $e): bool => true
    );

    $exceptions->render(
        fn (AuthenticationException $e, Request $request) => response()->json([
            'message' => 'Unauthenticated.',
        ], 401)
    );

    $exceptions->render(
        fn (UnauthorizedException $e, Request $request) => response()->json([
            'message' => 'This action is unauthorized.',
        ], 403)
    );
})->create();
