import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { appConfig } from '@/config/app-config'
import { BadgeCheck, CircleAlert, ShieldX } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { verifyCertificateQuery, type PublicCertificate } from './data/api'

const route = getRouteApi('/(public)/verify/$token')

/**
 * The token as the backend's own route regex defines it.
 *
 * Checked here as well so a malformed code renders locally instead of making a
 * request that could only 404 — and so a probe cannot use response timing to
 * learn anything.
 */
const TOKEN_PATTERN = /^[0-9a-f]{64}$/

/**
 * Public certificate verification.
 *
 * Rendered outside `_authenticated`: no sidebar, no guard, no auth store. The
 * audience is whoever is holding a printed certificate, and they will not have
 * an account — so there is deliberately no sign-in link either.
 */
export function VerifyCertificate() {
  const { token } = route.useParams()
  const isWellFormed = TOKEN_PATTERN.test(token)

  const { data, isPending, isError } = useQuery({
    ...verifyCertificateQuery(token),
    enabled: isWellFormed,
  })

  return (
    <main className='mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-6 px-4 py-10 print:py-0'>
      <header className='text-center'>
        <h1 className='text-lg font-semibold'>{appConfig.name}</h1>
        <p className='text-sm text-muted-foreground'>
          Certificate verification
        </p>
      </header>

      {isWellFormed && isPending && <Skeleton className='h-64 w-full' />}

      {isWellFormed && isError && (
        <Outcome
          tone='neutral'
          icon={<CircleAlert className='size-6' />}
          title='Could not check this certificate'
          message='Something went wrong reaching the register. Please try again shortly.'
        />
      )}

      {/* A malformed code and one that has never existed are answered
        identically: telling them apart would help someone guessing tokens. */}
      {(!isWellFormed || (!isPending && !isError && data === null)) && (
        <Outcome
          tone='neutral'
          icon={<CircleAlert className='size-6' />}
          title='No certificate matches this code'
          message='Check the code on the document and try again.'
        />
      )}

      {data && <CertificateCard certificate={data} />}

      <footer className='text-center text-xs text-muted-foreground'>
        Verified against the {appConfig.name} register.
      </footer>
    </main>
  )
}

/**
 * The document itself.
 *
 * A revoked certificate still shows its details, muted, under a destructive
 * header: the holder needs to see that the document in their hand is the one
 * that was withdrawn, not merely that something is wrong.
 */
function CertificateCard({ certificate }: { certificate: PublicCertificate }) {
  const valid = certificate.is_valid

  const facts = [
    { label: 'Certificate number', value: certificate.certificate_number },
    { label: 'Stone', value: certificate.stone_type_snapshot },
    { label: 'Weight', value: certificate.weight_snapshot },
    { label: 'Colour', value: certificate.color_snapshot },
    { label: 'Origin', value: certificate.origin_snapshot },
    { label: 'Gemmologist', value: certificate.gemmologist },
    { label: 'Issued', value: formatDate(certificate.issued_at) },
  ]

  return (
    <section className='overflow-hidden rounded-lg border'>
      <div
        className={cn(
          'flex items-center gap-3 p-4',
          valid
            ? 'bg-emerald-600 text-white'
            : 'bg-destructive text-destructive-foreground'
        )}
      >
        {valid ? (
          <BadgeCheck className='size-6 shrink-0' />
        ) : (
          <ShieldX className='size-6 shrink-0' />
        )}
        <div>
          <h2 className='font-semibold'>{valid ? 'Verified' : 'Withdrawn'}</h2>
          <p className='text-sm opacity-90'>
            {valid
              ? 'This certificate is genuine and still stands.'
              : 'This certificate was issued by the lab but has since been withdrawn.'}
          </p>
        </div>
      </div>

      <dl
        className={cn(
          'grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2',
          !valid && 'opacity-60'
        )}
      >
        {facts.map((fact) => (
          <div key={fact.label} className='space-y-1'>
            <dt className='text-xs text-muted-foreground'>{fact.label}</dt>
            <dd className='text-sm break-words'>
              {fact.value || <span className='text-muted-foreground'>—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Outcome({
  tone,
  icon,
  title,
  message,
}: {
  tone: 'neutral'
  icon: React.ReactNode
  title: string
  message: string
}) {
  return (
    <section
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        tone === 'neutral' && 'bg-muted/40'
      )}
    >
      <span className='mt-0.5 text-muted-foreground'>{icon}</span>
      <div>
        <h2 className='font-semibold'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{message}</p>
      </div>
    </section>
  )
}
