import { Association } from './association.type';

export interface League {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  associations?: Association[];
}
