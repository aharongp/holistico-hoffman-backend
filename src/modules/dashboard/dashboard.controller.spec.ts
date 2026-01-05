import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

const mockDashboardService = () => ({
  getSummary: jest.fn(),
  getPatientCount: jest.fn(),
  getUserCount: jest.fn(),
  getInstrumentCount: jest.fn(),
  getPatientGenderDistribution: jest.fn(),
});

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: ReturnType<typeof mockDashboardService>;

  beforeEach(async () => {
    service = mockDashboardService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should proxy summary data from service', async () => {
    const expected = {
      totals: { patients: 5, users: 2, instruments: 1 },
      patientGenderDistribution: [],
      patientsByProgram: [],
    };
    service.getSummary.mockResolvedValueOnce(expected);

    await expect(controller.getSummary()).resolves.toEqual(expected);
  });

  it('should return total patients', async () => {
    service.getPatientCount.mockResolvedValueOnce(8);

    await expect(controller.getTotalPatients()).resolves.toEqual({ total: 8 });
  });

  it('should return total users', async () => {
    service.getUserCount.mockResolvedValueOnce(3);

    await expect(controller.getTotalUsers()).resolves.toEqual({ total: 3 });
  });

  it('should return total instruments', async () => {
    service.getInstrumentCount.mockResolvedValueOnce(12);

    await expect(controller.getTotalInstruments()).resolves.toEqual({
      total: 12,
    });
  });

  it('should return gender distribution payload', async () => {
    const items = [{ gender: 'Femenino', count: 4, percentage: 50 }];
    service.getPatientGenderDistribution.mockResolvedValueOnce(items as any);

    await expect(controller.getGenderDistribution()).resolves.toEqual({
      data: items,
    });
  });
});
