import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { CreateInstrumentTypeDto } from './dto/create-instrument-type.dto';
import { UpdateInstrumentTypeDto } from './dto/update-instrument-type.dto';
import { CreateInstrumentTopicDto } from './dto/create-instrument-topic.dto';
import { UpdateInstrumentTopicDto } from './dto/update-instrument-topic.dto';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Post()
  create(@Body() createInstrumentDto: CreateInstrumentDto) {
    return this.instrumentsService.create(createInstrumentDto);
  }

  @Get()
  findAll() {
    return this.instrumentsService.findAll();
  }

  @Get(':id/topics')
  findTopics(@Param('id') id: string) {
    return this.instrumentsService.findTopicsByInstrument(+id);
  }

  // GET /instruments/types -> all instrument types
  @Get('types')
  findTypes() {
    return this.instrumentsService.findTypes();
  }

  @Post('types')
  createType(@Body() createInstrumentTypeDto: CreateInstrumentTypeDto) {
    return this.instrumentsService.createType(createInstrumentTypeDto);
  }

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

  @Delete('types/:id')
  removeType(@Param('id') id: string) {
    return this.instrumentsService.removeType(Number(id));
  }

  // GET /instruments/types/:user -> instrument types created by specific user
  @Get('types/user/:user')
  findTypesByUser(@Param('user') user: string) {
    return this.instrumentsService.findTypesByUser(user);
  }

  // GET /instruments/by-type/:typeId -> instruments belonging to that type
  @Get('by-type/:typeId')
  findByType(@Param('typeId') typeId: string) {
    return this.instrumentsService.findByType(Number(typeId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instrumentsService.findOne(+id);
  }

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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInstrumentDto: UpdateInstrumentDto,
  ) {
    return this.instrumentsService.update(+id, updateInstrumentDto);
  }

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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.instrumentsService.remove(+id);
  }

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
