// Profile form field configurations
export function getProfileFormFields() {
  return [
    {
      controlName: 'display_name',
      labelName: 'Display Name',
      errorMessage: 'Please enter a Display Name',
      autocomplete: false,
      controlType: 'input',
      type: 'text',
    },
    {
      controlName: 'email',
      labelName: 'Email Address',
      errorMessage: 'Please enter a valid Email Address',
      autocomplete: false,
      controlType: 'input',
      type: 'email',
    },
    {
      controlName: 'association',
      labelName: 'Association',
      errorMessage: 'Please select an Association',
      autocomplete: false,
      controlType: 'select', // Can be overridden by platform (autocomplete for web)
      disabled: true,
    },
    {
      controlName: 'team',
      labelName: 'Team',
      errorMessage: 'Please select a Team',
      autocomplete: false,
      controlType: 'select', // Can be overridden by platform (autocomplete for web)
      disabled: false,
    },
  ];
}
