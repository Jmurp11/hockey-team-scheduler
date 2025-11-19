import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { ProfileContentComponent } from './profile-content/profile-content.component';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProfileContentComponent,
    ProfileHeaderComponent,
  ],
  template: `@if (profile$ | async; as profile) {
    <app-profile-header [name]="profile.display_name" />
    <div class="container">
      <app-profile-content [card]="profile" />
    </div>
    }`,
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  profile$ = of({
    display_name: 'Jim Murphy',
    association_name: 'Pelham Youth Hockey Association',
    team_name: ['Pelham Pelicans 16U AA'],
    user_id: '1beb8d79-b45a-4bed-a1f4-bc738c6ce572',
    age: ['16u'],
    association_id: 4918,
    team_id: 52205,
    team_rating: 82.77,
    email: 'murphyj1011@gmail.com',
  });

  ngOnInit(): void {}
}
