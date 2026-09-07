<?php

namespace Database\Seeders;

use App\Models\User\User;
use App\Services\Api\V1\Shared\AuditLogger;
use Database\Seeders\User\GenderSeeder;
use Database\Seeders\User\IdentityDetailSeeder;
use Database\Seeders\User\UserSeeder;
use Database\Seeders\User\UserStatusSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seeded data is not history: nobody performed these actions, so the
        // activity log must stay empty until the app is actually used.
        AuditLogger::disable();

        // Level 0: Roles & permissions must exist before any user is assigned to them.
        $this->call(RolesAndPermissionsSeeder::class);

        // Seed one test user per role. Search by the stable unique key (email);
        // everything else is only applied on first creation.
        $superadmin = User::firstOrCreate(['email' => 'superadmin@test.com'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'username' => 'superadmin',
                'phone_number' => '1111111111',
                'password' => '1234567890',
            ]);

        $admin = User::firstOrCreate(['email' => 'admin@test.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'username' => 'admin',
                'phone_number' => '2222222222',
                'password' => '1234567890',
            ]);

        $manager = User::firstOrCreate(['email' => 'manager@test.com'],
            [
                'first_name' => 'Manager',
                'last_name' => 'User',
                'username' => 'manager',
                'phone_number' => '3333333333',
                'password' => '1234567890',
            ]);

        $editor = User::firstOrCreate(['email' => 'editor@test.com'],
            [
                'first_name' => 'Editor',
                'last_name' => 'User',
                'username' => 'editor',
                'phone_number' => '4444444444',
                'password' => '1234567890',
            ]);

        $viewer = User::firstOrCreate(['email' => 'viewer@test.com'],
            [
                'first_name' => 'Viewer',
                'last_name' => 'User',
                'username' => 'viewer',
                'phone_number' => '5555555555',
                'password' => '1234567890',
            ]);

        // Assign Roles
        $superadmin->syncRoles('superadmin');
        $admin->syncRoles('admin');
        $manager->syncRoles('manager');
        $editor->syncRoles('editor');
        $viewer->syncRoles('viewer');

        // Level 1: Independent lookup tables
        $level1 = [
            UserStatusSeeder::class,
            GenderSeeder::class,
            Product\ProductCategorySeeder::class,
            Product\BrandSeeder::class,
            Product\ProductStatusSeeder::class,
            Product\UnitOfMeasureSeeder::class,
            Product\TagSeeder::class,
        ];

        // Level 2: Depends on Level 1
        $level2 = [
            UserSeeder::class,
            Product\ProductSeeder::class,
        ];

        // Level 3: Depends on Level 2
        $level3 = [
            IdentityDetailSeeder::class,
            Product\ProductImageSeeder::class,
        ];

        foreach ([$level1, $level2, $level3] as $group) {
            foreach ($group as $seeder) {
                $this->call($seeder);
            }
        }
    }
}
