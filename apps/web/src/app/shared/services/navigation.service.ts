import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class NavigationService {
  private router = inject(Router);

  navigateToLink(route: string) {
    this.router.navigate([route]);
  }
}
