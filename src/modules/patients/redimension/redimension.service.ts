import { Injectable } from '@nestjs/common';
import { CreateRedimensionDto } from './dto/create-redimension.dto';
import { UpdateRedimensionDto } from './dto/update-redimension.dto';

@Injectable()
export class RedimensionService {
  create(createRedimensionDto: CreateRedimensionDto) {
    return 'This action adds a new redimension';
  }

  findAll() {
    return `This action returns all redimension`;
  }

  findOne(id: number) {
    return `This action returns a #${id} redimension`;
  }

  update(id: number, updateRedimensionDto: UpdateRedimensionDto) {
    return `This action updates a #${id} redimension`;
  }

  remove(id: number) {
    return `This action removes a #${id} redimension`;
  }
}
