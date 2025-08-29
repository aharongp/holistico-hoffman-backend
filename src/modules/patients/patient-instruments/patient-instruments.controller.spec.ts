import { Test, TestingModule } from '@nestjs/testing';
import { PatientInstrumentsController } from './patient-instruments.controller';
import { PatientInstrumentsService } from './patient-instruments.service';

describe('PatientInstrumentsController', () => {
  let controller: PatientInstrumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientInstrumentsController],
      providers: [PatientInstrumentsService],
    }).compile();

    controller = module.get<PatientInstrumentsController>(PatientInstrumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
