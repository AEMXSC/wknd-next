import { aueResource } from './cf-delivery';

/**
 * Attributes for an element rendered from one content record. Every element
 * gets data-content-path (the ?cf= deep link finds it by that). The Universal
 * Editor binding is added only when the content is UE-editable (cf mode);
 * structured content is edited in the DA form editor instead.
 */
export function binding(
  path: string,
  label: string,
  editable: boolean,
  variation = 'master',
): Record<string, string> {
  if (!path) return {};
  if (!editable) return { 'data-content-path': path };
  return {
    'data-content-path': path,
    'data-aue-resource': aueResource(path, variation),
    'data-aue-type': 'component',
    'data-aue-label': label,
  };
}
