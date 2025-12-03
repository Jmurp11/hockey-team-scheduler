/**
 * Checks and normalizes profile field values
 * Handles strings, arrays, objects with label/value pairs, and numbers
 */
export function checkProfileField(
  value: string | string[] | number | { label: string; value: any }
): string | { label: string; value: any } {
  if (!value) {
    return '';
  }
  if (typeof value === 'object' && 'label' in value && 'value' in value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '';
  }
  return value.toString() || '';
}

/**
 * Gets the appropriate input type for form fields
 */
export function getInputType(
  type?: string
): 'text' | 'email' | 'number' | 'password' | 'tel' | 'url' {
  const validTypes = ['text', 'email', 'number', 'password', 'tel', 'url'];
  return validTypes.includes(type || '')
    ? (type as 'text' | 'email' | 'number' | 'password' | 'tel' | 'url')
    : 'text';
}
