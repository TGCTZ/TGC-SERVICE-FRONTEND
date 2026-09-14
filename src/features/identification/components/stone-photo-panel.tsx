import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageUp, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { setStonePhoto, stoneQuery } from '@/features/stones/data/api'

/** Anything larger is a phone photo nobody downsized; the PDF embeds the bytes. */
const MAX_BYTES = 5 * 1024 * 1024

type StonePhotoPanelProps = {
  stoneId: number
  /** Finalized reports accept no changes, and neither does their photograph. */
  readOnly?: boolean
}

/**
 * The bench photograph of a stone, printed on its certificate.
 *
 * Saves immediately rather than joining the findings form's submit, for the
 * same reason `InstrumentsPanel` does: it writes to the *stone*, not the
 * report, so it is a sub-resource rather than a field of this form. A file
 * input inside a form that PUTs JSON would have to be smuggled through the
 * report serializer to reach the stone at all.
 *
 * The certificate freezes whichever photograph is on file at the moment it is
 * issued, so replacing one afterwards never changes a document already issued.
 */
export function StonePhotoPanel({
  stoneId,
  readOnly = false,
}: StonePhotoPanelProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  // A local preview so the image appears on choosing it, before the round trip.
  const [preview, setPreview] = useState<string | null>(null)

  const { data: stone, isPending } = useQuery(stoneQuery(stoneId))

  const mutation = useMutation({
    mutationFn: (photo: File | null) => setStonePhoto(stoneId, photo),
    onSuccess: (updated, photo) => {
      toast.success(
        photo
          ? `Photograph saved for stone ${updated.label}`
          : `Photograph removed from stone ${updated.label}`,
        {
          description: photo
            ? 'It will be printed on the certificate and frozen into it at issue.'
            : 'The certificate will show a placeholder until a new one is added.',
        }
      )
      queryClient.invalidateQueries({ queryKey: ['stones'] })
    },
    onError: (error) => {
      setPreview(null)
      toast.error('The photograph was not saved', {
        description: serverMessageOr(
          error,
          'Something went wrong and the stone is unchanged. Please try again.'
        ),
      })
    },
  })

  function choose(file: File | undefined) {
    if (!file) return

    if (file.size > MAX_BYTES) {
      toast.error('That image is too large', {
        description: `Photographs must be under ${MAX_BYTES / 1024 / 1024}MB. The certificate embeds the image, so a large one bloats every copy of the document.`,
      })
      return
    }

    setPreview(URL.createObjectURL(file))
    mutation.mutate(file)
  }

  const shown = preview ?? stone?.photo ?? null

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h3 className='text-sm font-medium'>Photograph</h3>
          <p className='text-xs text-muted-foreground'>
            Printed on the certificate. Saved as soon as you choose it.
          </p>
        </div>

        {!readOnly && (
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={mutation.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {mutation.isPending ? (
                <Loader2 className='me-1 size-4 animate-spin' />
              ) : (
                <ImageUp className='me-1 size-4' />
              )}
              {shown ? 'Replace' : 'Add photo'}
            </Button>

            {shown && (
              <Button
                type='button'
                size='sm'
                variant='ghost'
                disabled={mutation.isPending}
                onClick={() => {
                  setPreview(null)
                  mutation.mutate(null)
                }}
              >
                <Trash2 className='me-1 size-4' />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Outside any label: a file input inside the findings form would submit
          with it, and this writes to the stone on its own. */}
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(event) => {
          choose(event.target.files?.[0])
          // Clear the value, or choosing the same file twice fires nothing.
          event.target.value = ''
        }}
      />

      {isPending ? (
        <Skeleton className='h-40 w-full' />
      ) : shown ? (
        <div className='flex justify-center rounded-md border p-2'>
          {/* max-h only, never a forced width AND height: fixing both squashes
              every photograph that is not the box's aspect ratio. */}
          <img
            src={shown}
            alt='The stone'
            className='max-h-48 rounded object-contain'
          />
        </div>
      ) : (
        <p className='rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground'>
          No photograph yet. The certificate will print a placeholder.
        </p>
      )}
    </div>
  )
}
