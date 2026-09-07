<?php

namespace Database\Factories\User;

use App\Models\User\User;
use App\Models\User\UserStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserStatus>
 */
class UserStatusFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = [
            [
                'name' => 'Active',
                'description' => 'User account is active and functional',
            ],
            [
                'name' => 'Inactive',
                'description' => 'User account has been temporarily disabled',
            ],
            [
                'name' => 'Pending',
                'description' => 'User account is awaiting verification',
            ],
            [
                'name' => 'Suspended',
                'description' => 'User account is suspended due to violation',
            ],
            ['name' => 'Blocked', 'description' => 'User account is Blocked'],
        ];

        $randomStatus = fake()->unique()->randomElement($status);

        return [
            'name' => $randomStatus['name'],
            'description' => $randomStatus['description'],
            'is_active' => fake()->boolean(),
            'created_by' => $this->getUserId(),
        ];
    }

    public function getUserId()
    {
        static $userIds = null;
        if ($userIds === null) {
            $userIds = User::pluck('id')->toArray();
        }

        return fake()->randomElement($userIds);
    }
}
