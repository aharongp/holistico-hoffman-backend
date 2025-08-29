import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { CreateVitalDto } from './dto/create-vital.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';

@Controller('vitals')
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  create(@Body() createVitalDto: CreateVitalDto) {
    return this.vitalsService.create(createVitalDto);
  }

  @Get()
  findAll() {
    return this.vitalsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vitalsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVitalDto: UpdateVitalDto) {
    return this.vitalsService.update(+id, updateVitalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vitalsService.remove(+id);
  }
}
