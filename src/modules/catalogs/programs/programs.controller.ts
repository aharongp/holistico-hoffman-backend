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
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { CreateProgramActivityDto } from './dto/create-program-activity.dto';
import { UpdateProgramActivityDto } from './dto/update-program-activity.dto';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  @Get()
  findAll() {
    return this.programsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.findOne(id);
  }

  @Get(':id/activities')
  findActivities(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.findActivities(id);
  }

  @Post(':id/activities')
  addActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() createProgramActivityDto: CreateProgramActivityDto,
  ) {
    return this.programsService.addActivityToProgram(
      id,
      createProgramActivityDto,
    );
  }

  @Patch(':id/activities/:activityId')
  updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() updateProgramActivityDto: UpdateProgramActivityDto,
  ) {
    return this.programsService.updateActivityOnProgram(
      id,
      activityId,
      updateProgramActivityDto,
    );
  }

  @Delete(':id/activities/:activityId')
  removeActivity(
    @Param('id', ParseIntPipe) id: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.programsService.removeActivityFromProgram(id, activityId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programsService.update(id, updateProgramDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.remove(id);
  }
}
