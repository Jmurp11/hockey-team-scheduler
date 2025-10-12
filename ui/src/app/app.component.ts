import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import { SupabaseService } from './shared/services/supabase.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  providers: [],
  template: ` <router-outlet />`,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private primeng = inject(PrimeNG);
  protected title = 'app';
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.primeng.ripple.set(true);
    this.setupAuthStateListener();
  }

  private setupAuthStateListener() {
    this.supabaseService
      .getSupabaseClient()!
      .auth.onAuthStateChange((event, session) => {
        session
          ? this.authService.setSession(session)
          : this.authService.setSession(null);
        if (event === 'SIGNED_OUT') {
          this.router.navigate(['/landing']);
        }
      });
  }
}
