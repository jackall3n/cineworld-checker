import { Controller, Get, Query, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  ping() {
    return { message: 'Hello world!' };
  }

  @Get('showings')
  showings(@Query('days') days: number = 14) {
    return this.appService.getShowings(days);
  }
}
