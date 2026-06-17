import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { CreateProgramActivityDto } from './dto/create-program-activity.dto';
import { UpdateProgramActivityDto } from './dto/update-program-activity.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';

@Controller('programs')
// @UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  // @RequirePermission('programs.create')
  @Post()
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  // @RequirePermission('programs.view')
  @Get()
  findAll() {
    return this.programsService.findAll();
  }

  // @RequirePermission('programs.view')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.findOne(id);
  }

  // @RequirePermission('programs.view')
  @Get(':id/activities')
  findActivities(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.findActivities(id);
  }

  // @RequirePermission('programs.assign')
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

  // @RequirePermission('programs.update')
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

  // @RequirePermission('programs.delete')
  @Delete(':id/activities/:activityId')
  removeActivity(
    @Param('id', ParseIntPipe) id: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.programsService.removeActivityFromProgram(id, activityId);
  }

  // @RequirePermission('programs.update')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programsService.update(id, updateProgramDto);
  }

  // @RequirePermission('programs.delete')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.remove(id);
  }
}
