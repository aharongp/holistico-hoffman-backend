import { Test, TestingModule } from '@nestjs/testing';
import { RedimensionController } from './redimension.controller';
import { RedimensionService } from './redimension.service';

describe('RedimensionController', () => {
  let controller: RedimensionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedimensionController],
      providers: [RedimensionService],
    }).compile();

    controller = module.get<RedimensionController>(RedimensionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
