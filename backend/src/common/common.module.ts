import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';

/**
 * CommonModule registers application-wide filters and interceptors.
 * Marked @Global so it only needs to be imported once in AppModule.
 */
@Global()
@Module({
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class CommonModule {}
