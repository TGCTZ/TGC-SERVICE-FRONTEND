<?php

use App\Http\Controllers\Api\V1\Product\BrandController;
use App\Http\Controllers\Api\V1\Product\ProductCategoryController;
use App\Http\Controllers\Api\V1\Product\ProductController;
use App\Http\Controllers\Api\V1\Product\ProductImageController;
use App\Http\Controllers\Api\V1\Product\ProductStatusController;
use App\Http\Controllers\Api\V1\Product\TagController;
use App\Http\Controllers\Api\V1\Product\UnitOfMeasureController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Restore is declared before the apiResource so `{product}` does not
    // swallow the "restore" segment.
    Route::patch(
        'products/{product}/restore',
        [ProductController::class, 'restore']
    )->name('products.restore');
    Route::apiResource('products', ProductController::class);

    // Image gallery
    Route::post(
        'products/{product}/images',
        [ProductImageController::class, 'store']
    )->name('products.images.store');
    Route::patch(
        'product-images/{product_image}/primary',
        [ProductImageController::class, 'setPrimary']
    )->name('product-images.primary');
    Route::delete(
        'product-images/{product_image}',
        [ProductImageController::class, 'destroy']
    )->name('product-images.destroy');

    Route::patch(
        'product-categories/{product_category}/restore',
        [ProductCategoryController::class, 'restore']
    )->name('product-categories.restore');
    Route::apiResource('product-categories', ProductCategoryController::class);

    Route::patch(
        'brands/{brand}/restore',
        [BrandController::class, 'restore']
    )->name('brands.restore');
    Route::apiResource('brands', BrandController::class);

    Route::patch(
        'product-statuses/{product_status}/restore',
        [ProductStatusController::class, 'restore']
    )->name('product-statuses.restore');
    Route::apiResource('product-statuses', ProductStatusController::class);

    Route::patch(
        'unit-of-measures/{unit_of_measure}/restore',
        [UnitOfMeasureController::class, 'restore']
    )->name('unit-of-measures.restore');
    Route::apiResource('unit-of-measures', UnitOfMeasureController::class);

    Route::patch(
        'tags/{tag}/restore',
        [TagController::class, 'restore']
    )->name('tags.restore');
    Route::apiResource('tags', TagController::class);
});
