import { FormControl, FormGroup } from '@angular/forms';

export function getFormControl(parentForm: FormGroup, fcName: string) {
  return parentForm.get(fcName) as FormControl;
}
