import { Injectable } from '@nestjs/common';
import { CreateGameDto, Game, GamesQueryDto } from '../types';
import { supabase } from '../supabase';

@Injectable()
export class GamesService {
  async create(createGameDto: CreateGameDto[]): Promise<Game[]> {
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
    const queryCopy = { user: query.user } as any;
    if (query.openGamesOnly) {
      queryCopy.opponent = null;
    }
    const { data, error } = await supabase
      .from('gamesfull')
      .select('*')
      .match(queryCopy);

    if (error) {
      console.error('Error fetching games:', error);
      throw new Error('Could not fetch games');
    }

    return data;
  }

  async findOne(id: string): Promise<Game | null> {
    const { data, error } = await supabase
      .from('gamesfull')
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
    id: string,
    updateGameDto: Partial<CreateGameDto>,
  ): Promise<Game | null> {
    // First update the game
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update(updateGameDto)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating game:', updateError);
      throw new Error('Could not update game');
    }

    // Then fetch the opponent rankings data if opponent exists
    if (updatedGame.opponent) {
      const { data: opponentRankings, error: rankingsError } = await supabase
        .from('rankingswithassoc')
        .select('*')
        .eq('id', updatedGame.opponent)
        .single();

      if (rankingsError) {
        console.error('Error fetching opponent rankings:', rankingsError);
        // Don't throw here, just return the game without rankings
        return updatedGame;
      }

      // Combine the data
      return {
        ...updatedGame,
        opponent: opponentRankings,
      };
    }

    return updatedGame;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('games').delete().eq('id', id);

    if (error) {
      console.error('Error deleting game:', error);
      throw new Error('Could not delete game');
    }
  }
}
