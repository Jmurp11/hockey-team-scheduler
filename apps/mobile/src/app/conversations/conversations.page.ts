import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ConversationDisplay,
  getFormControl,
  searchConversations,
} from '@hockey-team-scheduler/shared-utilities';
import { MessagesService } from '@hockey-team-scheduler/shared-data-access';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { tap, catchError, of } from 'rxjs';
import { ListComponent } from '../shared/list/list.component';
import { ConversationItemComponent } from './conversation-item/conversation-item.component';
import PageTitleComponent from './page-title/page-title.component';
import { ButtonComponent } from '../shared/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-conversations',
  standalone: true,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Conversations</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <app-page-title
        [title]="'Inbox'"
        [newMessageCount]="newMessageCount()"
      ></app-page-title>

      <form [formGroup]="form">
        <ion-searchbar
          [formControl]="getFormControl(form, 'search')"
          placeholder="Search conversations"
          [debounce]="300"
        ></ion-searchbar>
      </form>

      @if (filtered().length === 0) {
        <div class="no-conversations">
          <app-button
            (onClick)="findNearbyTeams()"
            class="send-button"
            color="secondary"
            fill="outline"
          >
            Reach Out to Nearby Teams
          </app-button>
        </div>
      } @else {
        <app-list>
          @for (conversation of filtered(); track conversation.id) {
            <app-conversation-item [conversation]="conversation" />
          }
        </app-list>
      }
    </ion-content>
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;
      ion-searchbar {
        padding: 8px 16px;
      }

      app-list {
        padding: 0;
      }

      .no-conversations {
        @include flex(start, center, column);
        height: 100%;
        gap: 1rem;
        color: var(--text-secondary-color);
      }
      .no-conversations app-button {
        margin-top: 1rem;
      }
    `,
  ],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    ButtonComponent,
    IonSearchbar,
    ListComponent,
    ReactiveFormsModule,
    PageTitleComponent,
    ConversationItemComponent
  ],
})
export class ConversationsPage implements OnInit {
  private destroyRef = inject(DestroyRef);
  private messagesService = inject(MessagesService);
  private router = inject(Router);

  form = new FormGroup({
    search: new FormControl(null),
  });

  conversations = signal<ConversationDisplay[]>([]);
  filtered = signal<ConversationDisplay[]>([]);
  newMessageCount = signal<number>(0);

  getFormControl = getFormControl;

  ngOnInit(): void {
    this.loadConversations();
    this.onSearchChange().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  loadConversations(): void {
    this.messagesService
      .getConversations()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((conversations) => {
          this.conversations.set(conversations);
          this.filtered.set(conversations);
          this.newMessageCount.set(
            conversations.reduce(
              (count, convo) => count + convo.unreadCount,
              0,
            ),
          );
        }),
        catchError((error) => {
          console.error('Error loading conversations:', error);
          return of([]);
        }),
      )
      .subscribe();
  }

  onSearchChange() {
    return this.getFormControl(this.form, 'search').valueChanges.pipe(
      tap((search) => {
        const searchResults = searchConversations(
          this.conversations(),
          search || '',
        );
        this.filtered.set(searchResults);
      }),
    );
  }

  findNearbyTeams(): void {
    this.router.navigate(['/app/opponents'], {
      queryParams: { from: 'inbox' },
    });
  }
}
