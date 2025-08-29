import { Test, TestingModule } from '@nestjs/testing';
import { OcularController } from './ocular.controller';
import { OcularService } from './ocular.service';

describe('OcularController', () => {
  let controller: OcularController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcularController],
      providers: [OcularService],
    }).compile();

    controller = module.get<OcularController>(OcularController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
