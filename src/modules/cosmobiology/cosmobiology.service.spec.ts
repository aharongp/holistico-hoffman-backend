import { Test, TestingModule } from '@nestjs/testing';
import { CosmobiologyService } from './cosmobiology.service';

describe('CosmobiologyService', () => {
  let service: CosmobiologyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CosmobiologyService],
    }).compile();

    service = module.get<CosmobiologyService>(CosmobiologyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
