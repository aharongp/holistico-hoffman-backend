import { Test, TestingModule } from '@nestjs/testing';
import { OcularService } from './ocular.service';

describe('OcularService', () => {
  let service: OcularService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcularService],
    }).compile();

    service = module.get<OcularService>(OcularService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
