import { Test, TestingModule } from '@nestjs/testing';
import { CriterionController } from './criterion.controller';
import { CriterionService } from './criterion.service';

describe('CriterionController', () => {
  let controller: CriterionController;

  beforeEach(async () => {
    const criterionServiceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as CriterionService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriterionController],
      providers: [
        { provide: CriterionService, useValue: criterionServiceMock },
      ],
    }).compile();

    controller = module.get<CriterionController>(CriterionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
