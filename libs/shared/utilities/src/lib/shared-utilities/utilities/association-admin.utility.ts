import {
  AssociationInvitation,
  AssociationMember,
} from '../types/association-admin.type';

/**
 * Utility functions for Association Admin components.
 * These functions contain shared business logic used by both web and mobile apps.
 */

// ============================================
// Status Severity/Color Utilities
// ============================================

/**
 * Subscription status severity types that can be mapped to platform-specific UI.
 */
export type StatusSeverity = 'success' | 'info' | 'warning' | 'danger' | 'secondary';

/**
 * Get severity for subscription status.
 * Can be mapped to platform-specific badge colors.
 */
export function getSubscriptionStatusSeverity(status: string): StatusSeverity {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PENDING':
      return 'info';
    case 'EXPIRED':
    case 'CANCELED':
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Get severity for member status.
 * Can be mapped to platform-specific badge colors.
 */
export function getMemberStatusSeverity(status: string): StatusSeverity {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PENDING':
      return 'info';
    case 'INACTIVE':
      return 'warning';
    case 'REMOVED':
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Get severity for invitation status.
 * Can be mapped to platform-specific badge colors.
 */
export function getInvitationStatusSeverity(status: string): StatusSeverity {
  switch (status) {
    case 'ACCEPTED':
      return 'success';
    case 'pending':
      return 'info';
    case 'expired':
      return 'warning';
    case 'canceled':
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Map generic severity to PrimeNG-specific severity.
 * PrimeNG uses 'warn' instead of 'warning'.
 */
export function mapToPrimeNgSeverity(
  severity: StatusSeverity
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  return severity === 'warning' ? 'warn' : severity;
}

/**
 * Map generic severity to Ionic color.
 * Ionic uses 'primary' for info and 'medium' for secondary.
 */
export function mapToIonicColor(severity: StatusSeverity): string {
  switch (severity) {
    case 'success':
      return 'success';
    case 'info':
      return 'primary';
    case 'warning':
      return 'warning';
    case 'danger':
      return 'danger';
    case 'secondary':
    default:
      return 'medium';
  }
}

// ============================================
// Invitation Utilities
// ============================================

/**
 * Count pending invitations.
 */
export function getPendingInvitationsCount(invitations: AssociationInvitation[]): number {
  return invitations.filter((i) => i.status === 'pending').length;
}

// ============================================
// Confirmation Message Builders
// ============================================

/**
 * Build confirmation message for member role change.
 */
export function getMemberRoleChangeMessage(
  member: AssociationMember,
  isPromoting: boolean
): { action: string; roleLabel: string; message: string } {
  const action = isPromoting ? 'promote' : 'demote';
  const roleLabel = isPromoting ? 'an admin' : 'a regular member';
  const memberName = member.user_name || member.user_email;
  const message = `Are you sure you want to ${action} ${memberName} to ${roleLabel}?`;

  return { action, roleLabel, message };
}

/**
 * Build confirmation message for member removal.
 */
export function getMemberRemovalMessage(member: AssociationMember): string {
  const memberName = member.user_name || member.user_email;
  return `Are you sure you want to remove ${memberName} from the association?`;
}

/**
 * Build confirmation message for invitation cancellation.
 */
export function getInvitationCancellationMessage(invitation: AssociationInvitation): string {
  return `Are you sure you want to cancel the invitation for ${invitation.invited_email}?`;
}

// ============================================
// Invitation Form Utilities
// ============================================

/**
 * Interface for invitation form data.
 */
export interface InvitationFormData {
  name: string;
  email: string;
}

/**
 * Interface for prepared invitation request.
 */
export interface PreparedInvitationRequest {
  subscriptionId: string;
  associationId: string;
  email: string;
  role: 'MANAGER';
  inviter_user_id: string;
}

/**
 * Prepare invitation data for API request.
 */
export function prepareInvitationRequest(
  formData: InvitationFormData,
  subscriptionId: string,
  associationId: string,
  inviterUserId: string
): PreparedInvitationRequest {
  return {
    subscriptionId,
    associationId,
    email: formData.email,
    role: 'MANAGER',
    inviter_user_id: inviterUserId,
  };
}

// ============================================
// Admin Access Utilities
// ============================================

/**
 * Check if user has admin access.
 */
export function isUserAdmin(userRole: string | undefined | null): boolean {
  return userRole === 'ADMIN';
}

/**
 * Get subscription date label based on status.
 */
export function getSubscriptionDateLabel(status: string): string {
  return status === 'ACTIVE' ? 'Renews' : 'Ends';
}
