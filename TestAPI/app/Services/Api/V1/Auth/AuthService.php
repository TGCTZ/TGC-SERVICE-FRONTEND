<?php

namespace App\Services\Api\V1\Auth;

use App\Models\User\User;
use App\Repositories\Api\V1\Auth\AuthRepositoryInterface;
use App\Services\Api\V1\Shared\AuditLogger;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /** Name given to every issued Sanctum token. */
    private const TOKEN_NAME = 'api';

    private AuthRepositoryInterface $authRepoInterface;

    private AuditLogger $auditLogger;

    public function __construct(
        AuthRepositoryInterface $authRepoInterface,
        AuditLogger $auditLogger
    ) {
        $this->authRepoInterface = $authRepoInterface;
        $this->auditLogger = $auditLogger;
    }

    /**
     * Register a user and issue their first token.
     *
     * @param  array<string, mixed>  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $user = $this->authRepoInterface->create($data);

        $this->auditLogger->log(
            event: 'registered',
            subject: $user,
            description: 'Account registered for '.$user->email,
            causerId: $user->getKey(),
            causerLabel: $user->auditLabel()
        );

        return [
            'user' => $user,
            'token' => $user->createToken(self::TOKEN_NAME)->plainTextToken,
        ];
    }

    /**
     * Verify credentials and issue a token.
     *
     * Returns null for bad credentials AND for a deactivated account, so the
     * response can stay deliberately vague about which one failed.
     *
     * @return array{user: User, token: string}|null
     */
    public function login(string $email, string $password): ?array
    {
        $user = $this->authRepoInterface->findByEmail($email);

        if (! $user instanceof User || ! Hash::check($password, $user->password)) {
            $this->logFailedLogin($email, $user, 'invalid credentials');

            return null;
        }

        if ($user->is_active === false) {
            $this->logFailedLogin($email, $user, 'account deactivated');

            return null;
        }

        $this->authRepoInterface->touchLastLogin($user);

        // Log in the resolved user first so the audit row is attributed to
        // them; login is a public route, so nothing else has set the actor.
        Auth::setUser($user);

        $this->auditLogger->log(
            event: 'login',
            subject: $user,
            description: $user->auditLabel().' signed in'
        );

        return [
            'user' => $user,
            'token' => $user->createToken(self::TOKEN_NAME)->plainTextToken,
        ];
    }

    /**
     * Revoke only the token used for the current request.
     *
     * This API is Bearer-token only, so the current token is always a stored
     * PersonalAccessToken (never Sanctum's TransientToken, which only appears
     * in cookie-based SPA mode).
     */
    public function logout(User $user): void
    {
        $this->auditLogger->log(
            event: 'logout',
            subject: $user,
            description: $user->auditLabel().' signed out'
        );

        $user->currentAccessToken()->delete();
    }

    /**
     * Swap the current token for a fresh one.
     *
     * Sanctum has no refresh-token concept, so "refresh" means: issue a new
     * token, then revoke the one that authenticated this request.
     */
    public function refresh(User $user): string
    {
        $newToken = $user->createToken(self::TOKEN_NAME)->plainTextToken;

        $this->logout($user);

        return $newToken;
    }

    /**
     * Change the signed-in user's own password.
     *
     * Requires the current password even though the user is already
     * authenticated: a borrowed session should not be enough to lock the real
     * owner out of their account.
     *
     * Returns false when the current password does not match, so the caller
     * can answer without distinguishing that from any other failure.
     */
    public function changePassword(
        User $user,
        string $currentPassword,
        string $newPassword
    ): bool {
        if (! Hash::check($currentPassword, $user->password)) {
            $this->auditLogger->log(
                event: 'password_change_failed',
                subject: $user,
                description: 'Failed password change for '.$user->auditLabel()
            );

            return false;
        }

        $this->authRepoInterface->updatePassword($user, $newPassword);

        // Revoke every other session: a password change is what someone does
        // when they suspect their account is compromised, so leaving the other
        // tokens alive would defeat the point. The current token survives so
        // the user is not signed out of the tab they are working in.
        $user->tokens()
            ->where('id', '!=', $user->currentAccessToken()?->getKey())
            ->delete();

        $this->auditLogger->log(
            event: 'password_changed',
            subject: $user,
            description: $user->auditLabel().' changed their password'
        );

        return true;
    }

    /**
     * Record a rejected sign-in attempt.
     *
     * The attempted email is logged because "who is being brute-forced?" is
     * the whole point of the row. The password never is, not even hashed.
     */
    private function logFailedLogin(
        string $email,
        ?User $user,
        string $reason
    ): void {
        $this->auditLogger->log(
            event: 'login_failed',
            subject: $user,
            newValues: ['email' => $email, 'reason' => $reason],
            description: 'Failed sign-in for '.$email.' ('.$reason.')',
            causerId: $user?->getKey(),
            causerLabel: $user?->auditLabel()
        );
    }
}
