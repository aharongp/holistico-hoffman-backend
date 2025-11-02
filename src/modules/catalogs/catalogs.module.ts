import { Module } from '@nestjs/common';
import { CountriesModule } from './countries/countries.module';
import { ProgramsModule } from './programs/programs.module';
import { QuestionsModule } from './questions/questions.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { TopicsModule } from './topics/topics.module';
import { SubjectsModule } from './subjects/subjects.module';
import { CriterionModule } from './criterion/criterion.module';

@Module({
  imports: [CountriesModule, ProgramsModule, QuestionsModule, InstrumentsModule, TopicsModule, SubjectsModule, CriterionModule]
})
export class CatalogsModule {}
