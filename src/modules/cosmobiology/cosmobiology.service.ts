import { Injectable } from '@nestjs/common';
import { CreateCosmobiologyDto } from './dto/create-cosmobiology.dto';
import { UpdateCosmobiologyDto } from './dto/update-cosmobiology.dto';

@Injectable()
export class CosmobiologyService {
  create(createCosmobiologyDto: CreateCosmobiologyDto) {
    return 'This action adds a new cosmobiology';
  }

  findAll() {
    return `This action returns all cosmobiology`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cosmobiology`;
  }

  update(id: number, updateCosmobiologyDto: UpdateCosmobiologyDto) {
    return `This action updates a #${id} cosmobiology`;
  }

  remove(id: number) {
    return `This action removes a #${id} cosmobiology`;
  }
}
