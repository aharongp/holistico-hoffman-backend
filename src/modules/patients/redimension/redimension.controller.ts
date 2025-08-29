import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RedimensionService } from './redimension.service';
import { CreateRedimensionDto } from './dto/create-redimension.dto';
import { UpdateRedimensionDto } from './dto/update-redimension.dto';

@Controller('redimension')
export class RedimensionController {
  constructor(private readonly redimensionService: RedimensionService) {}

  @Post()
  create(@Body() createRedimensionDto: CreateRedimensionDto) {
    return this.redimensionService.create(createRedimensionDto);
  }

  @Get()
  findAll() {
    return this.redimensionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.redimensionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRedimensionDto: UpdateRedimensionDto) {
    return this.redimensionService.update(+id, updateRedimensionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.redimensionService.remove(+id);
  }
}
