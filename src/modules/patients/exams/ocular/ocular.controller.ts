import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OcularService } from './ocular.service';
import { CreateOcularDto } from './dto/create-ocular.dto';
import { UpdateOcularDto } from './dto/update-ocular.dto';

@Controller('ocular')
export class OcularController {
  constructor(private readonly ocularService: OcularService) {}

  @Post()
  create(@Body() createOcularDto: CreateOcularDto) {
    return this.ocularService.create(createOcularDto);
  }

  @Get()
  findAll() {
    return this.ocularService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ocularService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOcularDto: UpdateOcularDto) {
    return this.ocularService.update(+id, updateOcularDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ocularService.remove(+id);
  }
}
