import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { RibbonService } from './ribbon.service';
import { CreateRibbonDto } from './dto/create-ribbon.dto';
import { UpdateRibbonDto } from './dto/update-ribbon.dto';

@Controller('patients/ribbon')
export class RibbonController {
  constructor(private readonly ribbonService: RibbonService) {}

  @Post()
  create(@Body() createRibbonDto: CreateRibbonDto) {
    return this.ribbonService.create(createRibbonDto);
  }

  @Get()
  findAll() {
    return this.ribbonService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ribbonService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRibbonDto: UpdateRibbonDto,
  ) {
    return this.ribbonService.update(id, updateRibbonDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ribbonService.remove(id);
  }
}
