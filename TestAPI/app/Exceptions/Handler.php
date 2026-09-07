<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response as BaseResponse;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [// add exceptions you don't want reported here
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            Log::error($e->getMessage(), ['exception' => $e]);
        });

        $this->renderable(function (Throwable $e, $request) {
            if (
                $request->expectsJson() || $request->wantsJson(
                ) || $request->is('api/*')
            ) {
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'message' => $e->getMessage(),
                        'errors' => $e->errors(),
                    ], 422);
                }

                if ($e instanceof AuthenticationException) {
                    return response()->json([
                        'message' => $e->getMessage() ?: 'Unauthenticated.',
                    ], 401);
                }

                $status = 500;
                $message = 'Server Error';

                if ($e instanceof HttpExceptionInterface) {
                    $status = $e->getStatusCode();
                    $message = $e->getMessage(
                    ) ?: (BaseResponse::$statusTexts[$status] ?? 'Error');
                } else {
                    if (config('app.debug')) {
                        $message = $e->getMessage();
                    }
                }

                $payload = ['message' => $message];

                if (config('app.debug')) {
                    $payload['exception'] = get_class($e);
                    $payload['trace'] = collect($e->getTrace())->map(
                        function ($t) {
                            return Arr::except($t, ['args']);
                        }
                    )->values();
                }

                return response()->json($payload, $status);
            }
        });
    }
}
