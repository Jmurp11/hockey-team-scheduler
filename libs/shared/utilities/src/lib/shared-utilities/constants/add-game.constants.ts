import { setSelect } from '../utilities/select.utility';

// Add game form field configurations
export function getAddGameFormFields(items: any[]) {
  return [
    {
      controlName: 'opponent',
      labelName: 'Opponent',
      errorMessage: 'Please select an Opponent',
      autocomplete: false,
      controlType: 'autocomplete',
      items: items.map((i) => setSelect(i.name, i)),
      section: 1,
    },
    {
      controlName: 'rink',
      labelName: 'Rink',
      errorMessage: 'Please enter a Rink',
      autocomplete: false,
      controlType: 'input',
      type: 'text',
      section: 1,
    },
    {
      controlName: 'date',
      labelName: 'Date',
      errorMessage: 'Please enter a Date',
      autocomplete: false,
      controlType: 'date-picker',
      dpOptions: {
        showIcon: true,
        minDate: new Date(),
        maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        placeholder: 'Select a date',
        errorMessage: 'Please select a valid date',
        showTime: true,
        hourFormat: '12' as '12' | '24',
      },
      section: 1,
    },
    {
      controlName: 'country',
      labelName: 'Country',
      errorMessage: 'Please enter a Country',
      autocomplete: false,
      controlType: 'select',
      section: 1,
      options: {
        itemLabel: 'label',
        listItems: items
          .map((i) => ({
            label: i.association.country,
            value: i.association.country,
          }))
          .filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.value === item.value)
          )
          .sort((a, b) => a.label.localeCompare(b.label)),
        placeholder: '',
        isAutoComplete: false,
        emptyMessage: 'No countries found',
        errorMessage: 'ERROR',
        showClear: true,
      },
    },
    {
      controlName: 'city',
      labelName: 'City',
      errorMessage: 'Please enter a City',
      autocomplete: false,
      controlType: 'input',
      type: 'text',
      section: 1,
    },
    {
      controlName: 'state',
      labelName: 'State',
      errorMessage: 'Please enter a State or Province ',
      autocomplete: false,
      controlType: 'select',
      section: 1,
      options: {
        itemLabel: 'label',
        listItems: items
          .map((i) => ({
            label: i.association.state,
            value: i.association.state,
          }))
          .filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.value === item.value)
          )
          .sort((a, b) => a.label.localeCompare(b.label)),
        placeholder: '',
        isAutoComplete: true,
        emptyMessage: 'No states found',
        errorMessage: 'ERROR',
        showClear: true,
      },
    },
  ];
}
