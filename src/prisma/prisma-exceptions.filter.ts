import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class PrismaExceptionsFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {}
}
