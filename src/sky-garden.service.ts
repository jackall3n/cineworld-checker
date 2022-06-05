import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class SkyGardenService {
  constructor(
    private httpService: HttpService,
    @InjectTwilio() private readonly client: TwilioClient,
  ) {}

  async getTickets() {
    const date = '2021-12-12';

    const url = this.createUrl(date, date);
    const { data } = await this.httpService
      .get(url, {
        headers: {
          'App-Id': 'f6b16c23',
          'App-Key': 'f0bc4f65f4fbfe7b4b3b7264b655f5eb',
        },
      })
      .toPromise();

    const events = data?._embedded?.events ?? [];

    const available = events.filter((e) =>
      Object.values(e.ticket_spaces).some(
        (p: any) => p.name !== 'Assistance Required' && p.left !== 0,
      ),
    );

    console.log(available);

    return available;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async check() {
    const tokens = await this.getTickets();
    const showings = tokens.map((d) => d).flat();

    if (showings.length) {
      await this.onNotify(showings);
    }
  }

  createUrl(start: string, end: string) {
    return `https://skygarden.bookingbug.com/api/v1/37002/events?start_date=${start}&end_date=${end}&event_group_id=48320&include_non_bookable=true`;
  }

  async onNotify(showings: any[]) {
    const message = `Quick! There are ${showings.length} showings of Spider-Man! ${process.env.PUBLIC_URL}`;

    Logger.log(message);

    return;

    await this.client.messages.create({
      body: message,
      from: '+447488880681',
      to: '+447880880680',
    });
  }
}
