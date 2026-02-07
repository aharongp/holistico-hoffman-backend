import { Module } from '@nestjs/common';
import { PatientInstrumentsService } from './patient-instruments.service';
import { PatientInstrumentsController } from './patient-instruments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/modules/mail/mail.module';

@Module({
  controllers: [PatientInstrumentsController],
  imports: [PrismaModule, MailModule],
  providers: [PatientInstrumentsService],
  exports: [PatientInstrumentsService],
})
export class PatientInstrumentsModule {}
