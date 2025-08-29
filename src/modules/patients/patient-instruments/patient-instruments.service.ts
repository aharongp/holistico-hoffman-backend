import { Injectable } from '@nestjs/common';
import { CreatePatientInstrumentDto } from './dto/create-patient-instrument.dto';
import { UpdatePatientInstrumentDto } from './dto/update-patient-instrument.dto';

@Injectable()
export class PatientInstrumentsService {
  create(createPatientInstrumentDto: CreatePatientInstrumentDto) {
    return 'This action adds a new patientInstrument';
  }

  findAll() {
    return `This action returns all patientInstruments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} patientInstrument`;
  }

  update(id: number, updatePatientInstrumentDto: UpdatePatientInstrumentDto) {
    return `This action updates a #${id} patientInstrument`;
  }

  remove(id: number) {
    return `This action removes a #${id} patientInstrument`;
  }
}
