import { Association } from './association.type';

export interface Team {
  id: string;
  name: string;
  age: string;
  rating: number;
  record: string;
  agd: number;
  sched: number;
  association: Association;
}

export interface TeamsQueryParams {
  age?: string;
  association?: number;
  girls_only?: boolean;
}

export interface TeamsQueryDto {
  age: string;
  association: number;
  girls_only: boolean;
}

export interface NearbyTeamsQueryDto {
  p_id: number;
  p_girls_only: boolean;
  p_age: string;
  p_max_rating: number;
  p_min_rating: number;
  p_max_distance: number;
}
