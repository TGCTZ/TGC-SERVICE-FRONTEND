import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  deleteProductImage,
  productQueryOptions,
  setPrimaryProductImage,
  uploadProductImages,
} from '../data/api'

type ProductGalleryProps = {
  productId: number
}

/**
 * Manages a product's gallery: upload more images, promote one to primary, or
 * remove them.
 *
 * The gallery is only available while editing, because images are attached to
 * an existing product id — there is nothing to attach them to until the
 * product has been created.
 */
export function ProductGallery({ productId }: ProductGalleryProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const { data: product, isPending } = useQuery(productQueryOptions(productId))
  const images = product?.images ?? []

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadProductImages(productId, files),
    onSuccess: () => {
      toast.success('Images uploaded')
      refresh()
    },
    onError: () => toast.error('Could not upload the images.'),
    onSettled: () => setBusy(false),
  })

  const primaryMutation = useMutation({
    mutationFn: (imageId: number) => setPrimaryProductImage(imageId),
    onSuccess: () => {
      toast.success('Primary image updated')
      refresh()
    },
    onError: () => toast.error('Could not update the primary image.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => deleteProductImage(imageId),
    onSuccess: () => {
      toast.success('Image removed')
      refresh()
    },
    onError: () => toast.error('Could not remove the image.'),
  })

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>Gallery</span>

        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={busy || uploadMutation.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className='me-1 size-4' />
          {uploadMutation.isPending ? 'Uploading...' : 'Add images'}
        </Button>

        <input
          ref={inputRef}
          type='file'
          multiple
          accept='image/jpeg,image/png,image/webp'
          className='hidden'
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length === 0) return

            setBusy(true)
            uploadMutation.mutate(files)
            // Reset so selecting the same file again still fires onChange.
            e.target.value = ''
          }}
        />
      </div>

      {isPending ? (
        <div className='grid grid-cols-4 gap-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='aspect-square w-full' />
          ))}
        </div>
      ) : images.length === 0 ? (
        <p className='rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground'>
          No gallery images yet.
        </p>
      ) : (
        <div className='grid grid-cols-4 gap-2'>
          {images.map((image) => (
            <div
              key={image.id}
              className='group relative aspect-square overflow-hidden rounded-md border'
            >
              <img
                src={image.image}
                alt={image.alt_text ?? ''}
                className='size-full object-cover'
                loading='lazy'
              />

              {image.is_primary && (
                <span className='absolute start-1 top-1 rounded bg-primary px-1 text-[10px] text-primary-foreground'>
                  Primary
                </span>
              )}

              <div className='absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='size-7 p-0 text-white hover:text-white'
                  title='Make primary'
                  disabled={image.is_primary || primaryMutation.isPending}
                  onClick={() => primaryMutation.mutate(image.id)}
                >
                  <Star className='size-4' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='size-7 p-0 text-white hover:text-white'
                  title='Remove'
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(image.id)}
                >
                  <Trash2 className='size-4' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
