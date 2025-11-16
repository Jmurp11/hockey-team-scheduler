import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TableComponent } from '../shared/components/table/table.component';
import { ExportColumn } from '../shared/types/export-column.type';
import { TableOptions } from '../shared/types/table-options.type';
import { ScheduleActionsComponent } from './schedule-actions/schedule-actions.component';
import {
  filter,
  map,
  merge,
  Observable,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { ScheduleService } from './schedule.service';
import { AuthService } from '../auth/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AddGameService } from './add-game/add-game.service';
import { Game } from '../shared/types/game.type';

@Component({
  selector: 'app-schedule',
  standalone: true,
  providers: [],
  imports: [
    CommonModule,
    ButtonModule,
    MenuModule,
    RouterModule,
    TableComponent,
    ScheduleActionsComponent,
  ],
  template: ` <div class="container">
    <app-schedule-actions class="actions-container" />
    @if (tableData$ | async; as tableData) { @if (tableData.length > 0) {
    <app-table
      [tableOpts]="tableOpts"
      [tableData]="tableData"
      [exportColumns]="exportColumns"
      [hasActions]="true"
    >
      <ng-template #header></ng-template>
      <ng-template #body let-rowData>
        <tr>
          @for (col of tableOpts.columns; track col.field) {
          <td [ngStyle]="{ width: col.width }">
            {{ rowData[col.field] }}
          </td>
          }
          <td>
            <p-button
              (click)="actionsMenu.toggle($event)"
              icon="pi pi-chevron-down"
              label="Actions"
              iconPos="right"
              text="true"
              rounded="true"
              severity="primary"
            />
            <p-menu
              #actionsMenu
              [popup]="true"
              [model]="actions"
              (onShow)="getActions(rowData)"
              appendTo="body"
            />
          </td></tr
      ></ng-template>
      <ng-template #emptymessage>
        <tr>
          <td colspan="5">No data found.</td>
        </tr>
      </ng-template>
      ></app-table
    >
    } > }
  </div>`,
  styleUrls: ['./schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent implements OnInit {
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private addGameService = inject(AddGameService);
  private viewContainerRef = inject(ViewContainerRef);

  exportColumns: ExportColumn[];

  tableOpts: TableOptions = {
    paginator: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 20, 50],
    sortField: 'date',
    sortOrder: 1,
    loading: false,
    globalFilterFields: ['date', 'location', 'opponent', 'rink', 'gameType'],
    scrollable: true,
    scrollHeight: 'calc(100vh - 200px)',
    frozenValue: undefined,
    stateStorage: 'session',
    stateKey: 'hs-schedule-session',
    datakey: undefined,
    columns: [
      { field: 'date', header: 'Date', sortable: true },
      { field: 'time', header: 'Time', sortable: false },
      { field: 'rink', header: 'Rink', sortable: false },
      {
        field: 'location',
        header: 'Location',
        sortable: false,
      },
      {
        field: 'displayOpponent',
        header: 'Opponent',
        sortable: false,
      },
      {
        field: 'gameType',
        header: 'Game Type',
        sortable: false,
      },
    ],
  };

  user$: Observable<any> = toObservable(this.authService.currentUser);
  tableData$: Observable<any[]> | undefined;

  actions: any[] = [];

  constructor() {
    this.exportColumns = this.tableOpts.columns.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
  }

  ngOnInit(): void {
    this.addGameService.setViewContainerRef(this.viewContainerRef);

    this.user$
      .pipe(
        filter((user) => !!user && !!user.user_id),
        switchMap((user) => this.scheduleService.games(user.user_id)),
        map((games) => this.transformGames(games)),
        tap((games) => this.scheduleService.setGamesCache(games)),
        take(1)
      )
      .subscribe();

    this.tableData$ = this.scheduleService.gamesCache
      .asObservable()
      .pipe(map((games) => this.transformGames(games)));

    this.tableData$.subscribe((c) => console.log('TABLE DATA: ', c));
  }

  private transformGames(games: any[]) {
    
    return games.map((game) => ({
      ...game,
      displayOpponent: game.opponent[0].id
        ? game.opponent[0].name
        : game.tournamentName,
      location: `${game.city}, ${game.state}, ${game.country}`,
      gameType:
        game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1),
      originalTime: game.time,
      time: this.formatTime(game.time),
    }));
  }

  getActions(rowData: any) {
    this.actions = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        iconPos: 'right',
        command: () => {
          this.addGameService.openDialog(this.formatUpdateData(rowData), true);
        },
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        iconPos: 'right',
        command: () =>
          this.scheduleService.deleteGame(rowData.id).pipe(take(1)).subscribe(),
      },
    ];
  }

  formatUpdateData(game: any & { originalTime?: string | undefined }) {
    return {
      ...game,
      opponent: { label: game.opponent[0].name, value: game.opponent[0] },
      date: this.combineDateAndTime(game.date.toString(), game.originalTime),
      isHome: game.isHome ? 'home' : 'away',
      state: this.setSelect(game.state),
      country: this.setSelect(game.country),
    };
  }

  setSelect(value: string | null | undefined) {
    return { label: value, value };
  }

  // TODO: move to a util file
  private formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  //TODO: move to a util file
  private combineDateAndTime(dateString: string, timeString?: string): Date {
    if (!timeString) return new Date(dateString);
    const cleanTimeString = timeString.replace(/([+-]\d{2})$/, '');

    const date = new Date(dateString); // base date (handles timezone on the input date)
    const [h, m, s = '00'] = cleanTimeString.split(':');

    const hours = Number(h);
    const minutes = Number(m);
    const seconds = Number(s);

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      seconds
    );
  }
}
