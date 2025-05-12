import validator from 'validator'
// Validation Rules
export const requiredRule = (value: string) => !!value || 'This field is required.'
export const emailRule = (value: string) => validator.isEmail(value) || 'E-mail must be valid.'
export const portfolioLinkRule = (value: string) =>
  validator.isURL(value, {
    require_port: false,
    require_host: true,
    require_protocol: false,
    require_tld: true,
  }) || 'Portfolio link not valid'
export const passwordMinLengthRule = (value: string) =>
  value.length >= 8 || 'Password must be at least 8 characters.'
export const minLengthRule = (value: string) =>
  value?.length >= 2 || 'Must be at least 2 characters.'

export function ensureHttp(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.href
  } catch {
    return 'http://' + url
  }
}
