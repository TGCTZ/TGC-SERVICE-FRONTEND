<?php

namespace Database\Factories\User;

use App\Models\User\Gender;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Gender>
 */
class GenderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $genders = [
            ['name' => 'Male', 'description' => 'Identifies as male'],
            ['name' => 'Female', 'description' => 'Identifies as female'],
            ['name' => 'Non-binary', 'description' => 'Identifies as non-binary'],
            ['name' => 'Other', 'description' => 'Identifies in another way'],
            [
                'name' => 'Prefer not to say',
                'description' => 'Declined to disclose',
            ],
        ];

        $randomGender = fake()->unique()->randomElement($genders);

        return [
            'name' => $randomGender['name'],
            'description' => $randomGender['description'],
            'is_active' => true,
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
