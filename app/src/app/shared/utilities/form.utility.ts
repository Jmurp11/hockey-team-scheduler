import { FormControl, FormGroup } from '@angular/forms';

export function getFormControl(parentForm: FormGroup, fcName: string) {
  return parentForm.get(fcName) as FormControl;
}

export function inputId(label: string): string {
  return (
    label
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'input'
  );
}
