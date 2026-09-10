import { describe, expect, it } from 'vitest'
import { PERMISSIONS, perm, restorePerm } from '@/lib/permissions'

/**
 * The registry every gate in the app reads.
 *
 * Worth testing precisely because a mistake here is silent: a wrong permission
 * name does not throw, it hides a control from everyone who should see it — or,
 * worse, shows one the API will refuse. These assertions are the server's
 * vocabulary written down a second time, so a rename has to be made twice
 * deliberately rather than once by accident.
 */
describe('perm', () => {
  it('builds the name from the app label, not the URL segment', () => {
    // `colors` and `varieties` are different resources in the same Django app.
    expect(perm('colors', 'view')).toBe('gems.view_color')
    expect(perm('varieties', 'change')).toBe('gems.change_variety')
  })

  it('drops the separators a URL keeps', () => {
    expect(perm('shape-cuts', 'add')).toBe('gems.add_shapecut')
    expect(perm('identification-reports', 'delete')).toBe(
      'identification.delete_identificationreport'
    )
    expect(perm('certificate-access-logs', 'view')).toBe(
      'certificates.view_certificateaccesslog'
    )
  })

  it('maps roles onto Django groups', () => {
    // The UI calls them roles; the API stores them as auth.Group.
    expect(perm('roles', 'change')).toBe('auth.change_group')
  })

  it('covers every stage of the pipeline', () => {
    expect(perm('customers', 'view')).toBe('orders.view_customer')
    expect(perm('stones', 'view')).toBe('orders.view_stone')
    expect(perm('bills', 'view')).toBe('billing.view_bill')
    expect(perm('service-providers', 'view')).toBe(
      'billing.view_serviceprovider'
    )
    expect(perm('certificates', 'view')).toBe('certificates.view_certificate')
  })
})

describe('restorePerm', () => {
  it('asks for add, because restore is a POST', () => {
    // It reads oddly - restoring is closer to a change than a creation - but
    // the API's permission class maps every POST to `add_<model>`, and the UI
    // must gate on what the server enforces.
    expect(restorePerm('users')).toBe('users.add_user')
    expect(restorePerm('stone-types')).toBe('gems.add_stonetype')
  })
})

describe('PERMISSIONS', () => {
  it('names the workflow verbs the API declares by hand', () => {
    // These are not derived from a model action, so they cannot be built with
    // `perm()` and are the easiest names in the app to get wrong.
    expect(PERMISSIONS.transitionStone).toBe('orders.transition_stone')
    expect(PERMISSIONS.generateBill).toBe('billing.generate_bill')
    expect(PERMISSIONS.finalizeReport).toBe('identification.finalize_report')
    expect(PERMISSIONS.issueCertificate).toBe('certificates.issue_certificate')
    expect(PERMISSIONS.revokeCertificate).toBe(
      'certificates.revoke_certificate'
    )
  })

  it('reads the audit log from two different apps', () => {
    // Row history and application events are separate permissions on separate
    // apps; conflating them was what made the system-log screen unreachable.
    expect(PERMISSIONS.viewActivityLogs).toBe('auditlog.view_logentry')
    expect(PERMISSIONS.viewSystemLogs).toBe('audit.view_systemlog')
  })

  it('gates each module under core', () => {
    for (const gate of [
      PERMISSIONS.moduleOrders,
      PERMISSIONS.moduleBilling,
      PERMISSIONS.moduleIdentification,
      PERMISSIONS.moduleCertificates,
      PERMISSIONS.moduleReference,
    ]) {
      expect(gate).toMatch(/^core\.module_[a-z]+$/)
    }
  })
})
