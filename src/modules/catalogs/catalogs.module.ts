import { Module } from '@nestjs/common';
import { CountriesModule } from './countries/countries.module';
import { ProgramsModule } from './programs/programs.module';
import { QuestionsModule } from './questions/questions.module';
import { InstrumentsModule } from './instruments/instruments.module';

@Module({
  imports: [CountriesModule, ProgramsModule, QuestionsModule, InstrumentsModule]
})
export class CatalogsModule {}
