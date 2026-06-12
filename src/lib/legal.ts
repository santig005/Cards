/**
 * Returns the i18n key for the Habeas Data / data protection notice
 * based on the business country code.
 *
 * CO → specific Ley 1581 de 2012 notice.
 * All other countries → generic data-protection notice.
 */
export function getLegalNoticeKey(countryCode: string): 'habeasCO' | 'habeasGeneric' {
  return countryCode.toUpperCase() === 'CO' ? 'habeasCO' : 'habeasGeneric'
}
