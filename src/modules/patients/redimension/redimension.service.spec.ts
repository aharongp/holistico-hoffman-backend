import { Test, TestingModule } from '@nestjs/testing';
import { RedimensionService } from './redimension.service';

describe('RedimensionService', () => {
  let service: RedimensionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedimensionService],
    }).compile();

    service = module.get<RedimensionService>(RedimensionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
