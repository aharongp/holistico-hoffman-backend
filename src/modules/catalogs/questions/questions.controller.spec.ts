import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    findAnswers: jest.Mock;
    createAnswer: jest.Mock;
    updateAnswer: jest.Mock;
    removeAnswer: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findAnswers: jest.fn(),
      createAnswer: jest.fn(),
      updateAnswer: jest.fn(),
      removeAnswer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: QuestionsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to service when listing answers', async () => {
    service.findAnswers.mockResolvedValue([]);

    await controller.findAnswers(12);

    expect(service.findAnswers).toHaveBeenCalledWith(12);
  });

  it('should delegate to service when creating an answer', async () => {
    const payload = { nombre: 'Opción' };
    service.createAnswer.mockResolvedValue({ id: 1 });

    await controller.createAnswer(5, payload);

    expect(service.createAnswer).toHaveBeenCalledWith(5, payload);
  });

  it('should delegate to service when updating an answer', async () => {
    const payload = { nombre: 'Actualizada' };
    service.updateAnswer.mockResolvedValue({ id: 2 });

    await controller.updateAnswer(7, 3, payload);

    expect(service.updateAnswer).toHaveBeenCalledWith(7, 3, payload);
  });

  it('should delegate to service when deleting an answer', async () => {
    service.removeAnswer.mockResolvedValue({ deleted: true });

    await controller.removeAnswer(9, 4);

    expect(service.removeAnswer).toHaveBeenCalledWith(9, 4);
  });
});
