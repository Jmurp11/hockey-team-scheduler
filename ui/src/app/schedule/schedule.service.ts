import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { Game } from '../shared/types/game.type';
import { SupabaseService } from '../shared/services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private http = inject(HttpClient);
  private supabaseService = inject(SupabaseService);

  gamesCache: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  games(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/games?user=${userId}`);
  }

  deleteGame(gameId: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/games/${gameId}`);
  }

  gamesFull(userId: string): RealtimeChannel | undefined {
    const gamesfull = this.supabaseService
      .getSupabaseClient()
      ?.channel('games-filter-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gamesfull',
          filter: `user=eq.${userId}`,
        },
        (payload) => {
          console.log('Change received!', payload);
        }
      )
      .subscribe();
    return gamesfull;
  }
}
