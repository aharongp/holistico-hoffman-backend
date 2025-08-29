import { Injectable } from '@nestjs/common';
import { CreateVitalDto } from './dto/create-vital.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';

@Injectable()
export class VitalsService {
  create(createVitalDto: CreateVitalDto) {
    return 'This action adds a new vital';
  }

  findAll() {
    return `This action returns all vitals`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vital`;
  }

  update(id: number, updateVitalDto: UpdateVitalDto) {
    return `This action updates a #${id} vital`;
  }

  remove(id: number) {
    return `This action removes a #${id} vital`;
  }
}
