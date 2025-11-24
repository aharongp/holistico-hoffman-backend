import { Test, TestingModule } from '@nestjs/testing';
import { PatientInstrumentsController } from './patient-instruments.controller';
import { PatientInstrumentsService } from './patient-instruments.service';

describe('PatientInstrumentsController', () => {
  let controller: PatientInstrumentsController;

  beforeEach(async () => {
    const serviceMock = {
      findAll: jest.fn(),
      findByPatient: jest.fn(),
      findByUser: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as PatientInstrumentsService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientInstrumentsController],
      providers: [
        {
          provide: PatientInstrumentsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<PatientInstrumentsController>(PatientInstrumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
