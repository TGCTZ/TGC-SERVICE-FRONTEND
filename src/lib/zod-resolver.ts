import { zodResolver as baseZodResolver } from '@hookform/resolvers/zod'

const taggedResolver = (...args: unknown[]) => {
  const create = baseZodResolver as unknown as (...a: unknown[]) => object
  return Object.assign(create(...args), { schema: args[0] })
}

/**
 * `zodResolver`, with the schema kept reachable.
 *
 * The upstream resolver closes over its schema, so nothing downstream can ask
 * "is this field required?". This wrapper attaches the schema to the returned
 * function, which react-hook-form stores at `control._options.resolver` — so
 * `<Form>` can read it and mark required fields automatically, with no prop to
 * pass and nothing to keep in sync per field.
 *
 * **Import this instead of `@hookform/resolvers/zod`** and required markers
 * just appear. Behaviour and types are otherwise identical: the cast preserves
 * the upstream signature exactly, which a `Parameters<>`-based wrapper would
 * erase along with the generics.
 *
 * @param schema - The Zod schema validating the form
 * @returns A react-hook-form resolver carrying its schema
 *
 * @example
 * const form = useForm({ resolver: zodResolver(productSchema) })
 *
 * @see `src/components/ui/form.tsx` — reads the tag to render the markers
 */
export const zodResolver = taggedResolver as unknown as typeof baseZodResolver
