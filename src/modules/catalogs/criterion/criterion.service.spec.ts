import { Test, TestingModule } from '@nestjs/testing';
import { CriterionService } from './criterion.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('CriterionService', () => {
  let service: CriterionService;

  beforeEach(async () => {
    const prismaServiceMock = {
      criterio: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CriterionService, { provide: PrismaService, useValue: prismaServiceMock }],
    }).compile();

    service = module.get<CriterionService>(CriterionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
