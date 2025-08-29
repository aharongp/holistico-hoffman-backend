import { Injectable } from '@nestjs/common';
import { CreateDentalDto } from './dto/create-dental.dto';
import { UpdateDentalDto } from './dto/update-dental.dto';

@Injectable()
export class DentalService {
  create(createDentalDto: CreateDentalDto) {
    return 'This action adds a new dental';
  }

  findAll() {
    return `This action returns all dental`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dental`;
  }

  update(id: number, updateDentalDto: UpdateDentalDto) {
    return `This action updates a #${id} dental`;
  }

  remove(id: number) {
    return `This action removes a #${id} dental`;
  }
}
