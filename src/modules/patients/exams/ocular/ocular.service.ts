import { Injectable } from '@nestjs/common';
import { CreateOcularDto } from './dto/create-ocular.dto';
import { UpdateOcularDto } from './dto/update-ocular.dto';

@Injectable()
export class OcularService {
  create(createOcularDto: CreateOcularDto) {
    return 'This action adds a new ocular';
  }

  findAll() {
    return `This action returns all ocular`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ocular`;
  }

  update(id: number, updateOcularDto: UpdateOcularDto) {
    return `This action updates a #${id} ocular`;
  }

  remove(id: number) {
    return `This action removes a #${id} ocular`;
  }
}
