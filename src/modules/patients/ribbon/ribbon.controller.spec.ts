import { Test, TestingModule } from '@nestjs/testing';
import { RibbonController } from './ribbon.controller';
import { RibbonService } from './ribbon.service';

describe('RibbonController', () => {
  let controller: RibbonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RibbonController],
      providers: [
        {
          provide: RibbonService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RibbonController>(RibbonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
