import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('patients/history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get(':patientId/personal')
  getPersonalHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getPersonalHistory(patientId);
  }

  @Get(':patientId/contact')
  getContactHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getContactHistory(patientId);
  }

  @Get(':patientId/treating-doctor')
  getTreatingDoctorHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getTreatingDoctorHistory(patientId);
  }

  @Get(':patientId/family')
  getFamilyHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getFamilyHistory(patientId);
  }

  @Get(':patientId/immunizations')
  getImmunizationHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getImmunizationHistory(patientId);
  }

  @Get(':patientId/gynecological')
  getGynecologicalHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getGynecologicalHistory(patientId);
  }

  @Get(':patientId/lifestyle')
  getLifestyleHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getLifestyleHistory(patientId);
  }

  @Get(':patientId/clinical-background')
  getClinicalBackgroundHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getClinicalBackgroundHistory(patientId);
  }

  @Get(':patientId/attachments')
  getMedicalAttachments(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getMedicalAttachments(patientId);
  }

  @Get(':patientId/consultations')
  getMedicalConsultations(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getMedicalConsultations(patientId);
  }

  @Get(':patientId/coach-consultations')
  getCoachConsultations(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getCoachConsultations(patientId);
  }

  @Get(':patientId/diseases')
  getDiseaseHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getDiseaseHistory(patientId);
  }

  @Get(':patientId/full')
  getFullMedicalHistory(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.getFullMedicalHistory(patientId);
  }
}
