import { Test, TestingModule } from '@nestjs/testing';
import { RibbonService } from './ribbon.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('RibbonService', () => {
  let service: RibbonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RibbonService,
        {
          provide: PrismaService,
          useValue: {
            cinta: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RibbonService>(RibbonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
