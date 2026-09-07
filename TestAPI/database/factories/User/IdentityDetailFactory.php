<?php

namespace Database\Factories\User;

use App\Models\IdentityDetail;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IdentityDetail>
 */
class IdentityDetailFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'id_type' => fake()->randomElement([
                'National ID',
                'Passport',
                'Voter ID',
                'Employee ID',
                'Driving Licence',
            ]),
            'id_number' => fake()->numerify('####-####-####'),
            'id_document_path' => $this->getDocumentPath(),
            'verified_at' => now(),
            'expiry_date' => now()->addYears(5),
            'issue_date' => now()->subYears(3),
            'issue_country' => 'Tanzania',
            'created_by' => $this->getUserId(),
        ];
    }

    public function getDocumentPath()
    {
        $filename = fake()->bothify('????????????');
        $extension = fake()->randomElement([
            'pdf',
            'png',
            'jpg',
        ]);

        return "documents/identity/{$filename}.{$extension}";
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
