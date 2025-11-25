import { FormControl, FormGroup } from '@angular/forms';
import { Profile } from '../types/profile.type';
import { checkProfileField } from './profile.utility';

/**
 * Initialize the profile form with profile data
 */
export function initProfileForm(profileData: Profile): FormGroup {
  return new FormGroup({
    display_name: new FormControl(checkProfileField(profileData.display_name)),
    association: new FormControl(checkProfileField(profileData.association)),
    team: new FormControl(checkProfileField(profileData.team)),
    email: new FormControl(checkProfileField(profileData.email)),
  });
}

/**
 * Reset profile form to original values
 */
export function resetProfileForm(
  form: FormGroup,
  profileData: Profile
): void {
  form.patchValue({
    display_name: checkProfileField(profileData.display_name),
    association: checkProfileField(profileData.association),
    team: checkProfileField(profileData.team),
    email: checkProfileField(profileData.email),
  });
  form.markAsPristine();
}
