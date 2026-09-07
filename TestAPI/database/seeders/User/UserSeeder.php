<?php

namespace Database\Seeders\User;

use App\Models\User\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // admin user
        // User::factory()->admin()->create();

        // other users
        User::factory()->randomCreator()->count(20)->create();
    }
}
