import { Injectable } from '@nestjs/common';
import { CreateGameDto, GamesQueryDto } from '../types';

@Injectable()
export class GamesService {
  create(createGameDto: CreateGameDto) {
    console.log('Creating game:', createGameDto);
    return 'This action adds a new game';
  }

  findAll(query: GamesQueryDto) {
    console.log({ query });
    return `This action returns all games`;
  }

  findOne(id: number) {
    return `This action returns a #${id} game`;
  }

  update(id: number, updateGameDto: Partial<CreateGameDto>) {
    console.log('Updating game:', id, updateGameDto);
    return `This action updates a #${id} game`;
  }

  remove(id: number) {
    return `This action removes a #${id} game`;
  }
}
