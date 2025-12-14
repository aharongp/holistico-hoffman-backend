import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, NotFoundException, Put, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdatePatientProgramDto } from './dto/update-patient-program.dto';
import type { UpdateHistoryDto } from '../history/dto/update-history.dto';
import type { Response } from 'express';
import { memoryStorage } from 'multer';

const PATIENT_ATTACHMENT_UPLOAD_INTERCEPTOR = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientService.create(createPatientDto);
  }

  @Get()
  findAll() {
    return this.patientService.findAll();
  }

  @Get('attachments')
  getAllAttachments() {
    return this.patientService.getAllAttachments();
  }

  @Post(':id/attachments')
  @UseInterceptors(PATIENT_ATTACHMENT_UPLOAD_INTERCEPTOR)
  async uploadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: { buffer: Buffer; originalname?: string | null; mimetype?: string | null; size?: number | null },
  ) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('No se recibió un archivo válido para cargar.');
    }

    return this.patientService.uploadAttachment(id, {
      buffer: file.buffer,
      originalname: file.originalname ?? null,
      mimetype: file.mimetype ?? null,
      size: file.size ?? null,
    });
  }

  @Post('user/:userId/attachments')
  @UseInterceptors(PATIENT_ATTACHMENT_UPLOAD_INTERCEPTOR)
  async uploadAttachmentByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file?: { buffer: Buffer; originalname?: string | null; mimetype?: string | null; size?: number | null },
  ) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('No se recibió un archivo válido para cargar.');
    }

    return this.patientService.uploadAttachmentByUserId(userId, {
      buffer: file.buffer,
      originalname: file.originalname ?? null,
      mimetype: file.mimetype ?? null,
      size: file.size ?? null,
    });
  }

  @Get('attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.patientService.getAttachmentFile(attachmentId);
    const safeFilename = file.filename.replace(/"/g, '');
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
    });
    return new StreamableFile(file.stream);
  }

  @Get('user/:userId/history')
  async getMedicalHistoryByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const history = await this.patientService.getMedicalHistoryByUserId(userId);
    if (!history) {
      throw new NotFoundException('Patient medical history not found for the provided user');
    }
    return history;
  }

  @Get('user/:userId/attachments')
  async getAttachmentsByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const attachments = await this.patientService.getAttachmentsByUserId(userId);
    return attachments;
  }

  @Put('user/:userId/history')
  updateMedicalHistoryByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() payload: UpdateHistoryDto,
  ) {
    return this.patientService.updateMedicalHistoryByUserId(userId, payload);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientService.findOne(+id);
  }

  @Get(':id/history')
  getMedicalHistory(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.getMedicalHistory(id);
  }

  @Get(':id/attachments')
  getAttachments(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.getAttachments(id);
  }

  @Put(':id/history')
  updateMedicalHistory(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateHistoryDto,
  ) {
    return this.patientService.updateMedicalHistory(id, payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientService.update(+id, updatePatientDto);
  }

  @Patch(':id/program')
  assignProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePatientProgramDto,
  ) {
    const programPayload = Object.prototype.hasOwnProperty.call(payload, 'programId')
      ? payload.programId
      : payload.id_programa;

    return this.patientService.assignProgram(id, programPayload ?? null);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientService.remove(+id);
  }
}
