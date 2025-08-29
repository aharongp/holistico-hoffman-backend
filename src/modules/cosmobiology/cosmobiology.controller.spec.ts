import { Test, TestingModule } from '@nestjs/testing';
import { CosmobiologyController } from './cosmobiology.controller';
import { CosmobiologyService } from './cosmobiology.service';

describe('CosmobiologyController', () => {
  let controller: CosmobiologyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CosmobiologyController],
      providers: [CosmobiologyService],
    }).compile();

    controller = module.get<CosmobiologyController>(CosmobiologyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
