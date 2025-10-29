import { Injectable } from '@nestjs/common';
import { CreateGameDto, Game, GamesQueryDto } from '../types';
import { supabase } from '../supabase';

@Injectable()
export class GamesService {
  async create(createGameDto: CreateGameDto[]): Promise<Game[]> {
    console.log('Creating game:', createGameDto);

    const { data, error } = await supabase
      .from('games')
      .insert(createGameDto)
      .select();

    if (error) {
      console.error('Error inserting game:', error);
      throw new Error('Could not create game');
    }
    return data;
  }

  async findAll(query: GamesQueryDto): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .match(query);

    if (error) {
      console.error('Error fetching games:', error);
      throw new Error('Could not fetch games');
    }
    return data;
  }

  async findOne(id: number): Promise<Game | null> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching game:', error);
      throw new Error('Could not fetch game');
    }
    return data;
  }

  async update(
    id: number,
    updateGameDto: Partial<CreateGameDto>,
  ): Promise<Game | null> {
    console.log('Updating game:', id, updateGameDto);
    const { data, error } = await supabase
      .from('games')
      .update(updateGameDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating game:', error);
      throw new Error('Could not update game');
    }
    return data;
  }

  async remove(id: number): Promise<void> {
    const { error } = await supabase.from('games').delete().eq('id', id);

    if (error) {
      console.error('Error deleting game:', error);
      throw new Error('Could not delete game');
    }
  }
}
