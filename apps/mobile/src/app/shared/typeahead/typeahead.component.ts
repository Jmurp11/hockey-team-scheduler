import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  IonItem,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonSearchbar,
  IonContent,
  IonList,
} from '@ionic/angular/standalone';
import { AutocompleteOption } from '../types/autocomplete-option.type';

@Component({
  selector: 'app-typeahead',
  standalone: true,
  imports: [
    CommonModule,
    IonItem,
    IonHeader,
    IonToolbar,
    IonSearchbar,
    IonContent,
    IonList,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-searchbar (ionInput)="searchbarInput($event)"></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list id="modal-list" [inset]="true">
        @for (item of filteredItems; track item.value) {
          <ion-item (click)="confirmChanges(item)">
            {{ item.label }}
          </ion-item>
        }
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      ion-item {
        cursor: pointer;
      }
    `,
  ],
})
export class TypeaheadComponent implements OnInit {
  @Input() items: AutocompleteOption[] = [];

  @Output() selectionCancel = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<AutocompleteOption>();

  filteredItems: AutocompleteOption[] = [];

  ngOnInit() {
    this.filteredItems = [...this.items];
  }

  cancelChanges() {
    this.selectionCancel.emit();
  }

  confirmChanges(selectedItem: AutocompleteOption) {
    this.selectionChange.emit(selectedItem);
  }

  searchbarInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.filterList(inputElement.value);
  }

  /**
   * Update the rendered view with
   * the provided search query. If no
   * query is provided, all data
   * will be rendered.
   */
  filterList(searchQuery: string | undefined) {
    /**
     * If no search query is defined,
     * return all options.
     */
    if (searchQuery === undefined || searchQuery.trim() === '') {
      this.filteredItems = [...this.items];
    } else {
      /**
       * Otherwise, normalize the search
       * query and check to see which items
       * contain the search query as a substring.
       */
      const normalizedQuery = searchQuery.toLowerCase();
      this.filteredItems = this.items.filter((item) =>
        item.label.toLowerCase().includes(normalizedQuery),
      );
    }
  }
}
