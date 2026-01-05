import { Controller, Get } from '@nestjs/common';
import {
  DashboardService,
  DashboardSummary,
  GenderDistributionItem,
} from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(): Promise<DashboardSummary> {
    return this.dashboardService.getSummary();
  }

  @Get('totals/patients')
  async getTotalPatients(): Promise<{ total: number }> {
    const total = await this.dashboardService.getPatientCount();
    return { total };
  }

  @Get('totals/users')
  async getTotalUsers(): Promise<{ total: number }> {
    const total = await this.dashboardService.getUserCount();
    return { total };
  }

  @Get('totals/instruments')
  async getTotalInstruments(): Promise<{ total: number }> {
    const total = await this.dashboardService.getInstrumentCount();
    return { total };
  }

  @Get('patients/gender-distribution')
  async getGenderDistribution(): Promise<{ data: GenderDistributionItem[] }> {
    const data = await this.dashboardService.getPatientGenderDistribution();
    return { data };
  }
}
