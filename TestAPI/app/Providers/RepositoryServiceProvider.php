<?php

namespace App\Providers;

use App\Repositories\Api\V1\Audit\ActivityLogRepository;
use App\Repositories\Api\V1\Audit\ActivityLogRepositoryInterface;
use App\Repositories\Api\V1\Auth\AuthRepository;
use App\Repositories\Api\V1\Auth\AuthRepositoryInterface;
use App\Repositories\Api\V1\Product\BrandRepository;
use App\Repositories\Api\V1\Product\BrandRepositoryInterface;
use App\Repositories\Api\V1\Product\ProductCategoryRepository;
use App\Repositories\Api\V1\Product\ProductCategoryRepositoryInterface;
use App\Repositories\Api\V1\Product\ProductImageRepository;
use App\Repositories\Api\V1\Product\ProductImageRepositoryInterface;
use App\Repositories\Api\V1\Product\ProductRepository;
use App\Repositories\Api\V1\Product\ProductRepositoryInterface;
use App\Repositories\Api\V1\Product\ProductStatusRepository;
use App\Repositories\Api\V1\Product\ProductStatusRepositoryInterface;
use App\Repositories\Api\V1\Product\TagRepository;
use App\Repositories\Api\V1\Product\TagRepositoryInterface;
use App\Repositories\Api\V1\Product\UnitOfMeasureRepository;
use App\Repositories\Api\V1\Product\UnitOfMeasureRepositoryInterface;
use App\Repositories\Api\V1\User\GenderRepository;
use App\Repositories\Api\V1\User\GenderRepositoryInterface;
use App\Repositories\Api\V1\User\IdentityDetailRepository;
use App\Repositories\Api\V1\User\IdentityDetailRepositoryInterface;
use App\Repositories\Api\V1\User\PermissionRepository;
use App\Repositories\Api\V1\User\PermissionRepositoryInterface;
use App\Repositories\Api\V1\User\RoleRepository;
use App\Repositories\Api\V1\User\RoleRepositoryInterface;
use App\Repositories\Api\V1\User\UserRepository;
use App\Repositories\Api\V1\User\UserRepositoryInterface;
use App\Repositories\Api\V1\User\UserStatusRepository as UserUserStatusRepository;
use App\Repositories\Api\V1\User\UserStatusRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Auth Module
        $this->app->bind(
            AuthRepositoryInterface::class,
            AuthRepository::class
        );

        // User Module
        $this->app->bind(
            UserRepositoryInterface::class,
            UserRepository::class
        );

        $this->app->bind(
            UserStatusRepositoryInterface::class,
            UserUserStatusRepository::class
        );

        $this->app->bind(
            IdentityDetailRepositoryInterface::class,
            IdentityDetailRepository::class
        );

        $this->app->bind(
            GenderRepositoryInterface::class,
            GenderRepository::class
        );

        $this->app->bind(
            RoleRepositoryInterface::class,
            RoleRepository::class
        );

        $this->app->bind(
            PermissionRepositoryInterface::class,
            PermissionRepository::class
        );

        // Product Module
        $this->app->bind(
            ProductRepositoryInterface::class,
            ProductRepository::class
        );

        $this->app->bind(
            ProductImageRepositoryInterface::class,
            ProductImageRepository::class
        );

        $this->app->bind(
            ProductCategoryRepositoryInterface::class,
            ProductCategoryRepository::class
        );

        $this->app->bind(
            BrandRepositoryInterface::class,
            BrandRepository::class
        );

        $this->app->bind(
            ProductStatusRepositoryInterface::class,
            ProductStatusRepository::class
        );

        $this->app->bind(
            UnitOfMeasureRepositoryInterface::class,
            UnitOfMeasureRepository::class
        );

        $this->app->bind(
            TagRepositoryInterface::class,
            TagRepository::class
        );

        // Audit Module
        $this->app->bind(
            ActivityLogRepositoryInterface::class,
            ActivityLogRepository::class
        );
    }
}
