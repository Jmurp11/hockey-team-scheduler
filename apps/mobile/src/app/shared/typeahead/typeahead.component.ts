import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  IonItem,
  IonHeader,
  IonToolbar,
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
    IonTitle,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-searchbar (ionInput)="searchbarInput($event)"></ion-searchbar>

      <ion-list id="modal-list" [inset]="true">
        @for (item of filteredItems; track item.value) {
          <ion-item (click)="confirmChanges(item)">
            @if (isRink) {
              <div class="rink">
                <div class="rink__item">
                  <span class="rink__label">{{ item.label }}</span>
                </div>
                <div class="rink__address">
                  {{ item.value.city }}, {{ item.value.state }},
                  {{ item.value.country }}
                </div>
              </div>
            } @else {
              {{ item.label }}
            }
          </ion-item>
        }
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;
      ion-item {
        cursor: pointer;
      }

      .rink {
        @include flex(center, center, column);

        cursor: pointer;

        &__item {
          width: 100%;
          padding: 0.2rem;
          &__label {
            font-weight: 500;
            font-size: 1rem;
          }

          &__icon {
            font-size: 1.5rem;
          }
        }

        &__address {
          font-weight: 400;
          color: var(--gray-400);
          font-size: 0.875rem;
          text-align: center;
        }
      }
    `,
  ],
})
export class TypeaheadComponent implements OnInit {
  @Input() items: AutocompleteOption[] = [];
  @Input() title?: string = 'Select an Option';
  @Input() isRink: boolean = false;
  @Output()
  selectionCancel = new EventEmitter<void>();
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
