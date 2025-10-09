import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { MenuItem, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { filter, map, Observable, startWith } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AssociationService } from '../shared/services/associations.service';
import { TeamsService } from '../shared/services/teams.service';
import { OpponentListComponent } from './opponent-list/opponent-list.component';
import { OpponentsComponent } from './opponents/opponents.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OpponentsComponent,
    OpponentListComponent,
    ButtonModule,
    MenuModule,
  ],
  template: ` <div class="container">
    <app-opponents
      (selectedInputs)="getNearbyTeams($event)"
      [associations$]="associations$"
      [userDefault$]="user$"
    />

    @if (nearbyTeams$ | async; as nearbyTeams) {
    <div class="list-container">
      <div class="sort-btn">
        <p-button
          (click)="sortMenu.toggle($event)"
          label="Sort"
          variant="text"
          severity="secondary"
          iconPos="right"
          icon="pi pi-sort-alt"
          size="small"
        />
        <p-menu #sortMenu [model]="actions" [popup]="true" appendTo="body" />
      </div>
      <div class="opponent-list">
        <app-opponent-list [opponents]="nearbyTeams" />
      </div>
    </div>
    }
  </div>`,
  styleUrls: ['./dashboard.component.scss'],
  providers: [AssociationService, TeamsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  nearbyTeams$: Observable<any>;
  associationService = inject(AssociationService);
  teamsService = inject(TeamsService);
  authService = inject(AuthService);

  actions: MenuItem[];
  user$: Observable<SelectItem> = toObservable(
    this.authService.currentUser
  ).pipe(
    startWith(null),
    filter((user) => user != null),
    map((user) => ({
      label: user?.association_name,
      value: user?.association_id,
    }))
  );

  associations$: Observable<SelectItem[]> =
    this.associationService.getAssociations();

  ngOnInit(): void {
    this.nearbyTeams$ = new Observable<any[]>();

    this.actions = this.getActions();
  }

  async getNearbyTeams(params: any) {
    this.nearbyTeams$ = this.teamsService.nearbyTeams({
      p_id: params.association.value,
      p_girls_only: params.girlsOnly || false,
      p_age: params.age.value.toLowerCase(),
      p_max_rating: params.rating[1],
      p_min_rating: params.rating[0],
      p_max_distance: params.distance,
    });
  }

  getActions() {
    return [
      {
        icon: 'pi pi-sort-amount-up',
        label: 'Distance (asc)',
        command: () => console.log('details'),
      },
      {
        icon: 'pi pi-sort-amount-down',
        label: 'Distance (desc)',
        command: () => console.log('details'),
      },
      {
        icon: 'pi pi-sort-amount-up',
        label: 'Rating (asc)',
        command: () => console.log('details'),
      },
      {
        icon: 'pi pi-sort-amount-down',
        label: 'Ratings (desc)',
        command: () => console.log('details'),
      },
    ];
  }
}
