import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AssociationAdminData,
  AssociationInvitation,
  AssociationMember,
} from '@hockey-team-scheduler/shared-utilities';
import { Observable, map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class AssociationAdminService {
  private http = inject(HttpClient);
  private config: AppConfig = inject(APP_CONFIG);

  /**
   * Get association admin data including members, invitations, and subscription info
   */
  getAssociationAdminData(associationId: string): Observable<AssociationAdminData> {
    return this.http.get<AssociationAdminData>(
      `${this.config.apiUrl}/associations/${associationId}/admin`
    );
  }

  /**
   * Get all members for an association
   */
  getAssociationMembers(associationId: string): Observable<AssociationMember[]> {
    return this.http.get<AssociationMember[]>(
      `${this.config.apiUrl}/associations/${associationId}/members`
    );
  }

  /**
   * Get all invitations for an association
   */
  getAssociationInvitations(associationId: string): Observable<AssociationInvitation[]> {
    return this.http.get<AssociationInvitation[]>(
      `${this.config.apiUrl}/associations/${associationId}/invitations`
    );
  }

  /**
   * Remove a member from the association
   */
  removeMember(memberId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.config.apiUrl}/users/members/${memberId}`
    );
  }

  /**
   * Update a member's role (ADMIN or MANAGER)
   */
  updateMemberRole(memberId: string, role: 'ADMIN' | 'MANAGER'): Observable<{ message: string; member: AssociationMember }> {
    return this.http.patch<{ message: string; member: AssociationMember }>(
      `${this.config.apiUrl}/users/members/${memberId}/role`,
      { role }
    );
  }

  /**
   * Resend an invitation email
   */
  resendInvitation(invitationId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.config.apiUrl}/users/invitations/${invitationId}/resend`,
      {}
    );
  }

  /**
   * Create a new invitation
   */
  createInvitation(params: {
    subscriptionId: string;
    associationId: string;
    email: string;
    role?: 'ADMIN' | 'MANAGER';
    inviter_user_id?: string;
  }): Observable<{ invitation: AssociationInvitation; emailSent: boolean }> {
    return this.http.post<{ invitation: AssociationInvitation; emailSent: boolean }>(
      `${this.config.apiUrl}/users/invitations`,
      params
    );
  }

  /**
   * Cancel an invitation
   */
  cancelInvitation(invitationId: string): Observable<void> {
    return this.http.post<void>(
      `${this.config.apiUrl}/users/invitations/${invitationId}/cancel`,
      {}
    );
  }
}
