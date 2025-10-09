import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { OpenAiService } from '../shared/services/openai.service';
import { TournamentsFilterComponent } from './tournaments-filter/tournaments-filter.component';
import { TournamentsListComponent } from './tournaments-list/tournaments-list.component';

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [CommonModule, TournamentsFilterComponent, TournamentsListComponent],
  providers: [OpenAiService],
  template: ` <div class="container">
    <app-tournaments-filter (selectedInputs)="onFilterChange($event)" />
    <app-tournaments-list [tournaments]="tournaments$ | async" />
  </div>`,
  styleUrls: ['./tournaments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentsComponent {
  authService = inject(AuthService);
  openAiService = inject(OpenAiService);

  tournaments$: Observable<any> = new Observable<any>();
  user$: Observable<any> = toObservable(this.authService.currentUser);

  onFilterChange(filter: any) {
    const input = {
      age: filter.age.value,
      level: filter.level.value,
      maxDistance: filter.distance,
      girlsOnly: filter.girlsOnly,
    };

    this.tournaments$ = this.user$.pipe(
      switchMap((user) =>
        this.openAiService.findTournaments({
          ...input,
          userAssociation: user.association_name,
        })
      )
    );
  }
}
