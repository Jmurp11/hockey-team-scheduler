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
import { tap, catchError, of } from 'rxjs';
import { InputComponent } from '../shared/components/input/input.component';
import { ConversationItemComponent } from './conversation-item/conversation-item.component';
import PageTitleComponent from './page-title/page-title.component';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    PageTitleComponent,
    InputComponent,
    ConversationItemComponent,
    ReactiveFormsModule,
  ],
  template: `<div>
    <app-page-title
      title="Inbox"
      [newMessageCount]="newMessageCount()"
    ></app-page-title>
    <form [formGroup]="form">
      <app-input [label]="label" [control]="getFormControl(form, 'search')" />
    </form>

    @if (filtered().length === 0) {
      <div class="no-conversations">
        <p-button
          icon="pi pi-users"
          label="Reach Out to Nearby Teams"
          size="large"
          variant="outlined"
          (click)="findNearbyTeams()"
        />
      </div>
    } @else {
      <div class="conversations-list">
        @for (conversation of filtered(); track conversation.id) {
          <app-conversation-item [conversation]="conversation" />
        }
      </div>
    }
  </div>`,
  styleUrls: ['./conversations.component.scss'],
})
export class ConversationsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private messagesService = inject(MessagesService);
  private router = inject(Router);

  label = 'Search';

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

  findNearbyTeams() {
    this.router.navigate(['/app/opponents']);
  }
}
