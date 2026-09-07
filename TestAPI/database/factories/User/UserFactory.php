<?php

namespace Database\Factories\User;

use App\Models\User\User;
use App\Models\User\UserStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->optional(0.5)->firstName(),
            'last_name' => fake()->lastName(),
            'username' => fake()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'phone_number' => fake()->numerify('+255 ### ### ###'),
            'phone_verified_at' => now(),
            'address' => fake()->optional()->address(),
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_number' => fake()->e164PhoneNumber(),
            'user_status_id' => $this->getUserStatusId(),
            'created_by' => null,
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function getUserStatusId()
    {
        static $userStatusIds = null;
        if ($userStatusIds === null) {
            $userStatusIds = UserStatus::pluck('id')->toArray();
        }

        return fake()->randomElement($userStatusIds);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(
            fn (array $attributes) => ['email_verified_at' => null]
        );
    }

    // public function admin(){
    //     return $this->state(function (){
    //         return [
    //             'role'=> 'Admin',
    //             'email' => 'admin@admin.com',
    //             'password' => '1234',
    //         ];
    //     });
    // }

    public function randomCreator(): static
    {
        return $this->state(function () {
            $creator = User::inRandomOrder()->first();

            return ['created_by' => $creator?->id];
        });
    }
}
