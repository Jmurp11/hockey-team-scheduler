import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from '../config/app-config';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

export interface HealthCheckResult {
  isHealthy: boolean;
  timestamp?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class HealthCheckService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  healthStatus = signal<HealthCheckResult | null>(null);

  async checkHealth(): Promise<HealthCheckResult> {
    const baseUrl = this.config.apiUrl.replace(/\/v1$/, '');

    try {
      const response = await firstValueFrom(
        this.http
          .get<{ status: string; timestamp: string }>(`${baseUrl}/health`)
          .pipe(
            timeout(5000),
            catchError(() =>
              of({ status: 'error', timestamp: '' })
            )
          )
      );

      const result: HealthCheckResult = {
        isHealthy: response.status === 'ok',
        timestamp: response.timestamp,
        error:
          response.status !== 'ok'
            ? 'API returned unhealthy status'
            : undefined,
      };

      this.healthStatus.set(result);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unable to reach API';
      const result: HealthCheckResult = {
        isHealthy: false,
        error: errorMessage,
      };
      this.healthStatus.set(result);
      return result;
    }
  }
}
