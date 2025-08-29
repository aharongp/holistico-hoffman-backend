import { Test, TestingModule } from '@nestjs/testing';
import { VitalsController } from './vitals.controller';
import { VitalsService } from './vitals.service';

describe('VitalsController', () => {
  let controller: VitalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VitalsController],
      providers: [VitalsService],
    }).compile();

    controller = module.get<VitalsController>(VitalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
