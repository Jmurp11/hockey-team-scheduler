import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import 'dotenv/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: [
        'http://localhost:4200', // Development Angular dev server
        'http://localhost', // Docker nginx container
        'http://localhost:80', // Docker nginx container explicit port
        'http://127.0.0.1', // Alternative localhost
        'http://127.0.0.1:80', // Alternative localhost with port
     ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  });

  app.use('/v1/users/webhook', bodyParser.raw({ type: 'application/json' }));

  app.use(bodyParser.json());

  const config = new DocumentBuilder()
    .setTitle('RinkLink.ai API')
    .setDescription(
      'The RinkLink.ai API allows users to access youth hockey data, including leagues, associations, and rankings.',
    )
    .setVersion('1.0')
    .addTag('Youth Hockey Info')
    .build();
  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
