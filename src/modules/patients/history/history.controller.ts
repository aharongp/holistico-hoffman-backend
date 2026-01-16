import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { MulterField } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { HistoryService } from './history.service';
import type { UpdateHistoryDto } from './dto/update-history.dto';
import type {
  UpsertPatientDentalExamDto,
  UpsertPatientDentalPresenceDto,
  UpsertPatientOcularExamDto,
} from './dto/manage-dental-exams.dto';
import { memoryStorage } from 'multer';
import type { Express } from 'express';

const OCULAR_EXAM_UPLOAD_FIELDS: MulterField[] = [
  { name: 'rightEyeImage', maxCount: 1 },
  { name: 'leftEyeImage', maxCount: 1 },
];

const OCULAR_EXAM_UPLOAD_INTERCEPTOR = FileFieldsInterceptor(
  OCULAR_EXAM_UPLOAD_FIELDS,
  {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  },
);

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
  getTreatingDoctorHistory(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
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
  getClinicalBackgroundHistory(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.historyService.getClinicalBackgroundHistory(patientId);
  }

  @Get(':patientId/dental-exams/presence')
  listDentalPresenceRecords(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.historyService.listDentalPresenceRecords(patientId);
  }

  @Post(':patientId/dental-exams/presence')
  createDentalPresenceRecord(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() payload: UpsertPatientDentalPresenceDto,
  ) {
    return this.historyService.createDentalPresenceRecord(patientId, payload);
  }

  @Get(':patientId/dental-exams/presence/:recordId')
  getDentalPresenceRecord(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.historyService.getDentalPresenceRecord(patientId, recordId);
  }

  @Put(':patientId/dental-exams/presence/:recordId')
  updateDentalPresenceRecord(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() payload: UpsertPatientDentalPresenceDto,
  ) {
    return this.historyService.updateDentalPresenceRecord(
      patientId,
      recordId,
      payload,
    );
  }

  @Delete(':patientId/dental-exams/presence/:recordId')
  deleteDentalPresenceRecord(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.historyService.deleteDentalPresenceRecord(patientId, recordId);
  }

  @Get(':patientId/dental-exams')
  listDentalExams(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.listDentalExams(patientId);
  }

  @Post(':patientId/dental-exams')
  createDentalExam(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() payload: UpsertPatientDentalExamDto,
  ) {
    return this.historyService.createDentalExam(patientId, payload);
  }

  @Get(':patientId/dental-exams/:examId')
  getDentalExam(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('examId', ParseIntPipe) examId: number,
  ) {
    return this.historyService.getDentalExam(patientId, examId);
  }

  @Put(':patientId/dental-exams/:examId')
  updateDentalExam(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('examId', ParseIntPipe) examId: number,
    @Body() payload: UpsertPatientDentalExamDto,
  ) {
    return this.historyService.updateDentalExam(patientId, examId, payload);
  }

  @Delete(':patientId/dental-exams/:examId')
  deleteDentalExam(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('examId', ParseIntPipe) examId: number,
  ) {
    return this.historyService.deleteDentalExam(patientId, examId);
  }

  @Get(':patientId/ocular-exams')
  listOcularExams(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.historyService.listOcularExams(patientId);
  }

  @Post(':patientId/ocular-exams')
  @UseInterceptors(OCULAR_EXAM_UPLOAD_INTERCEPTOR)
  createOcularExam(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() payload: UpsertPatientOcularExamDto,
    @UploadedFiles()
    files?: {
      rightEyeImage?: Express.Multer.File[];
      leftEyeImage?: Express.Multer.File[];
    },
  ) {
    return this.historyService.createOcularExam(patientId, payload, {
      right: files?.rightEyeImage?.[0] ?? null,
      left: files?.leftEyeImage?.[0] ?? null,
    });
  }

  @Get(':patientId/ocular-exams/:examId')
  getOcularExam(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('examId', ParseIntPipe) examId: number,
  ) {
    return this.historyService.getOcularExam(patientId, examId);
  }

  @Put(':patientId/ocular-exams/:examId')
  @UseInterceptors(OCULAR_EXAM_UPLOAD_INTERCEPTOR)
  updateOcularExam(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('examId', ParseIntPipe) examId: number,
    @Body() payload: UpsertPatientOcularExamDto,
    @UploadedFiles()
    files?: {
      rightEyeImage?: Express.Multer.File[];
      leftEyeImage?: Express.Multer.File[];
    },
  ) {
    return this.historyService.updateOcularExam(patientId, examId, payload, {
      right: files?.rightEyeImage?.[0] ?? null,
      left: files?.leftEyeImage?.[0] ?? null,
    });
  }

  @Delete(':patientId/ocular-exams/:examId')
  deleteOcularExam(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('examId', ParseIntPipe) examId: number,
  ) {
    return this.historyService.deleteOcularExam(patientId, examId);
  }

  @Get('attachments')
  getAllMedicalAttachments() {
    return this.historyService.getAllMedicalAttachments();
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

  @Put(':patientId/full')
  updateFullMedicalHistory(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() payload: UpdateHistoryDto,
  ) {
    return this.historyService.updateFullMedicalHistory(patientId, payload);
  }
}
