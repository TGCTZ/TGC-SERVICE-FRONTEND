<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\TagRequest;
use App\Http\Resources\Api\V1\Product\TagCollection;
use App\Http\Resources\Api\V1\Product\TagResource;
use App\Models\Product\Tag;
use App\Services\Api\V1\Product\TagService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class TagController extends Controller implements HasMiddleware
{
    private TagService $tagService;

    public function __construct(TagService $tagService)
    {
        $this->tagService = $tagService;
    }

    /**
     * Permission gate for each action, enforced by spatie's middleware.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:tags.viewAny', only: ['index']),
            new Middleware('permission:tags.view', only: ['show']),
            new Middleware('permission:tags.create', only: ['store']),
            new Middleware('permission:tags.update', only: ['update']),
            new Middleware('permission:tags.delete', only: ['destroy']),
            new Middleware('permission:tags.restore', only: ['restore']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $records = $this->tagService->getAll($request->query());

            return new TagCollection($records);
        } catch (Throwable $e) {
            Log::emergency('Error fetching tags: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch tags. Please try again.',
            ], 500);
        }
    }

    public function store(TagRequest $request)
    {
        $validated = $request->validated();

        try {
            $tag = $this->tagService->create($validated);

            return response()->json([
                'message' => 'Tag created successfully',
                'tag' => new TagResource($tag),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Tag creation failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while creating tag. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in tag creation: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }

    public function show(Tag $tag)
    {
        return new TagResource($tag);
    }

    public function update(TagRequest $request, Tag $tag)
    {
        $validated = $request->validated();

        try {
            $this->tagService->update($tag, $validated);

            return response()->json([
                'message' => 'Tag updated successfully',
                'tag' => new TagResource($tag->refresh()),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'Tag update failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while updating tag. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in tag update: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }

    public function destroy(Tag $tag)
    {
        try {
            $this->tagService->delete($tag);

            return response()->json([
                'message' => 'Tag deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Tag deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting tag. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in tag deletion: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }

    public function restore($id)
    {
        try {
            $this->tagService->restore((int) $id);

            return response()->json([
                'message' => 'Tag restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Tag restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in tag restoration: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );
        }

        return response()->json([
            'error' => 'An unexpected error occurred. Please contact support.',
        ], 500);
    }
}
