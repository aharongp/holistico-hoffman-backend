import { Test, TestingModule } from '@nestjs/testing';
import { DentalService } from './dental.service';

describe('DentalService', () => {
  let service: DentalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DentalService],
    }).compile();

    service = module.get<DentalService>(DentalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
