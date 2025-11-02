import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  findAll() {
    return this.questionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }

  @Get(':questionId/answers')
  findAnswers(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.questionsService.findAnswers(questionId);
  }

  @Post(':questionId/answers')
  createAnswer(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() createAnswerDto: CreateAnswerDto,
  ) {
    return this.questionsService.createAnswer(questionId, createAnswerDto);
  }

  @Patch(':questionId/answers/:answerId')
  updateAnswer(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Param('answerId', ParseIntPipe) answerId: number,
    @Body() updateAnswerDto: UpdateAnswerDto,
  ) {
    return this.questionsService.updateAnswer(questionId, answerId, updateAnswerDto);
  }

  @Delete(':questionId/answers/:answerId')
  removeAnswer(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Param('answerId', ParseIntPipe) answerId: number,
  ) {
    return this.questionsService.removeAnswer(questionId, answerId);
  }
}
