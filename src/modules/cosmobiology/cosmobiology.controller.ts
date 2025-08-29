import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CosmobiologyService } from './cosmobiology.service';
import { CreateCosmobiologyDto } from './dto/create-cosmobiology.dto';
import { UpdateCosmobiologyDto } from './dto/update-cosmobiology.dto';

@Controller('cosmobiology')
export class CosmobiologyController {
  constructor(private readonly cosmobiologyService: CosmobiologyService) {}

  @Post()
  create(@Body() createCosmobiologyDto: CreateCosmobiologyDto) {
    return this.cosmobiologyService.create(createCosmobiologyDto);
  }

  @Get()
  findAll() {
    return this.cosmobiologyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cosmobiologyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCosmobiologyDto: UpdateCosmobiologyDto) {
    return this.cosmobiologyService.update(+id, updateCosmobiologyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cosmobiologyService.remove(+id);
  }
}
