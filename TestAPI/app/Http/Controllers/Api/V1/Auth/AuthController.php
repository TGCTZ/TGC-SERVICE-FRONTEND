<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\ChangePasswordRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Resources\Api\V1\User\UserResource;
use App\Models\User\User;
use App\Services\Api\V1\Auth\AuthService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Throwable;

class AuthController extends Controller
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(RegisterRequest $request)
    {
        $validated = $request->validated();

        try {
            $result = $this->authService->register($validated);

            // The account is authenticated from this point, so the resource may
            // expose its roles/permissions in the response.
            Auth::setUser($result['user']);

            return response()->json([
                'message' => 'Registration successful',
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Registration failed: '.$e->getMessage(),
                ['email' => $validated['email'] ?? null]
            );

            return response()->json([
                'error' => 'Database error occured while registering. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in registration: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occured. Please contact support.',
            ], 500);
        }
    }

    public function login(LoginRequest $request)
    {
        $validated = $request->validated();

        try {
            $result = $this->authService->login(
                $validated['email'],
                $validated['password']
            );

            if ($result === null) {
                return response()->json([
                    'message' => 'These credentials do not match our records.',
                    'errors' => [
                        'email' => ['These credentials do not match our records.'],
                    ],
                ], 422);
            }

            Auth::setUser($result['user']);

            return response()->json([
                'message' => 'Login successful',
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ]);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in login: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occured. Please contact support.',
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            /** @var User $user */
            $user = $request->user();

            $this->authService->logout($user);

            return response()->json([
                'message' => 'Logout successful',
            ]);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in logout: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occured. Please contact support.',
            ], 500);
        }
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        try {
            /** @var User $user */
            $user = $request->user();

            $changed = $this->authService->changePassword(
                $user,
                $request->string('current_password')->toString(),
                $request->string('password')->toString()
            );

            if (! $changed) {
                // 422 with a field error, so the form can point at the input
                // that was actually wrong.
                return response()->json([
                    'message' => 'The current password is incorrect.',
                    'errors' => [
                        'current_password' => ['The current password is incorrect.'],
                    ],
                ], 422);
            }

            return response()->json([
                'message' => 'Password changed successfully. Other sessions have been signed out.',
            ]);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error changing password: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occured. Please contact support.',
            ], 500);
        }
    }

    public function refresh(Request $request)
    {
        try {
            /** @var User $user */
            $user = $request->user();

            return response()->json([
                'message' => 'Token refreshed successfully',
                'token' => $this->authService->refresh($user),
            ]);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in token refresh: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occured. Please contact support.',
            ], 500);
        }
    }

    public function me(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        return new UserResource($user->load(['userStatus', 'gender']));
    }
}
