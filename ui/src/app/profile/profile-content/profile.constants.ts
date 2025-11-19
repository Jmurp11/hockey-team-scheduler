export function getFormFields() {
  return [
    {
      controlName: 'display_name',
      labelName: 'Display Name',
      errorMessage: 'Please enter a Display Name',
      autocomplete: false,
      controlType: 'input',
      type: 'text',
      section: 1,
    },
    {
      controlName: 'email',
      labelName: 'Email Address',
      errorMessage: 'Please enter a valid Email Address',
      autocomplete: false,
      controlType: 'input',
      type: 'email',
      section: 1,
    },
    {
      controlName: 'association',
      labelName: 'Association',
      errorMessage: 'Please select an Association',
      autocomplete: false,
      controlType: 'autocomplete',
      section: 1,
    },
    {
      controlName: 'team',
      labelName: 'Team',
      errorMessage: 'Please select a Team',
      autocomplete: false,
      controlType: 'autocomplete',
      section: 1,
    },
  ];
}
