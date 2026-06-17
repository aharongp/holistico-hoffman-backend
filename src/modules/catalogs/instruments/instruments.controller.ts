import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { CreateInstrumentTypeDto } from './dto/create-instrument-type.dto';
import { UpdateInstrumentTypeDto } from './dto/update-instrument-type.dto';
import { CreateInstrumentTopicDto } from './dto/create-instrument-topic.dto';
import { UpdateInstrumentTopicDto } from './dto/update-instrument-topic.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';

@Controller('instruments')
// @UseGuards(JwtAuthGuard, PermissionsGuard)
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  // @RequirePermission('instruments.create')
  @Post()
  create(@Body() createInstrumentDto: CreateInstrumentDto) {
    return this.instrumentsService.create(createInstrumentDto);
  }

  // @RequirePermission('instruments.view')
  @Get()
  findAll() {
    return this.instrumentsService.findAll();
  }

  // @RequirePermission('instruments.view')
  @Get(':id/topics')
  findTopics(@Param('id') id: string) {
    return this.instrumentsService.findTopicsByInstrument(+id);
  }

  // GET /instruments/types -> all instrument types
  // @RequirePermission('instruments.view')
  @Get('types')
  findTypes() {
    return this.instrumentsService.findTypes();
  }

  // @RequirePermission('instruments.create')
  @Post('types')
  createType(@Body() createInstrumentTypeDto: CreateInstrumentTypeDto) {
    return this.instrumentsService.createType(createInstrumentTypeDto);
  }

  // @RequirePermission('instruments.update')
  @Patch('types/:id')
  updateType(
    @Param('id') id: string,
    @Body() updateInstrumentTypeDto: UpdateInstrumentTypeDto,
  ) {
    return this.instrumentsService.updateType(
      Number(id),
      updateInstrumentTypeDto,
    );
  }

  // @RequirePermission('instruments.delete')
  @Delete('types/:id')
  removeType(@Param('id') id: string) {
    return this.instrumentsService.removeType(Number(id));
  }

  // GET /instruments/types/:user -> instrument types created by specific user
  // @RequirePermission('instruments.view')
  @Get('types/user/:user')
  findTypesByUser(@Param('user') user: string) {
    return this.instrumentsService.findTypesByUser(user);
  }

  // GET /instruments/by-type/:typeId -> instruments belonging to that type
  // @RequirePermission('instruments.view')
  @Get('by-type/:typeId')
  findByType(@Param('typeId') typeId: string) {
    return this.instrumentsService.findByType(Number(typeId));
  }

  // @RequirePermission('instruments.view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instrumentsService.findOne(+id);
  }

  // @RequirePermission('instruments.create')
  @Post(':id/topics')
  createTopic(
    @Param('id') id: string,
    @Body() createInstrumentTopicDto: CreateInstrumentTopicDto,
  ) {
    return this.instrumentsService.createTopicForInstrument(
      +id,
      createInstrumentTopicDto,
    );
  }

  // @RequirePermission('instruments.update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInstrumentDto: UpdateInstrumentDto,
  ) {
    return this.instrumentsService.update(+id, updateInstrumentDto);
  }

  // @RequirePermission('instruments.update')
  @Patch(':instrumentId/topics/:topicId')
  updateTopic(
    @Param('instrumentId') instrumentId: string,
    @Param('topicId') topicId: string,
    @Body() updateInstrumentTopicDto: UpdateInstrumentTopicDto,
  ) {
    return this.instrumentsService.updateTopicForInstrument(
      +instrumentId,
      +topicId,
      updateInstrumentTopicDto,
    );
  }

  // @RequirePermission('instruments.delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.instrumentsService.remove(+id);
  }

  // @RequirePermission('instruments.delete')
  @Delete(':instrumentId/topics/:topicId')
  removeTopic(
    @Param('instrumentId') instrumentId: string,
    @Param('topicId') topicId: string,
  ) {
    return this.instrumentsService.removeTopicForInstrument(
      +instrumentId,
      +topicId,
    );
  }
}
