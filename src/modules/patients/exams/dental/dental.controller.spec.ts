import { Test, TestingModule } from '@nestjs/testing';
import { DentalController } from './dental.controller';
import { DentalService } from './dental.service';

describe('DentalController', () => {
  let controller: DentalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DentalController],
      providers: [DentalService],
    }).compile();

    controller = module.get<DentalController>(DentalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
