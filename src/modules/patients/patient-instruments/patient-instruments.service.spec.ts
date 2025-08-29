import { Test, TestingModule } from '@nestjs/testing';
import { PatientInstrumentsService } from './patient-instruments.service';

describe('PatientInstrumentsService', () => {
  let service: PatientInstrumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientInstrumentsService],
    }).compile();

    service = module.get<PatientInstrumentsService>(PatientInstrumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
