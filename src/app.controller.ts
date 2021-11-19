import { Controller, Get, ParseIntPipe, Query, Render } from '@nestjs/common';
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
  showings() {
    return this.appService.getShowings();
  }
}
