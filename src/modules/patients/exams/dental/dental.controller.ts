import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DentalService } from './dental.service';
import { CreateDentalDto } from './dto/create-dental.dto';
import { UpdateDentalDto } from './dto/update-dental.dto';

@Controller('dental')
export class DentalController {
  constructor(private readonly dentalService: DentalService) {}

  @Post()
  create(@Body() createDentalDto: CreateDentalDto) {
    return this.dentalService.create(createDentalDto);
  }

  @Get()
  findAll() {
    return this.dentalService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dentalService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDentalDto: UpdateDentalDto) {
    return this.dentalService.update(+id, updateDentalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dentalService.remove(+id);
  }
}
