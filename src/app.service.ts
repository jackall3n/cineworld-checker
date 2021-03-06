import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { addDays, differenceInDays, endOfDay, endOfToday, format, parseISO, subHours } from 'date-fns';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class AppService {
  constructor(
    private httpService: HttpService,
    @InjectTwilio() private readonly client: TwilioClient,
  ) {}

  getDates() {
    const today = subHours(endOfToday(), 12);
    const from = subHours(endOfDay(parseISO('2022-07-07T12:00:00.000Z')), 12);

    // console.log({ today, to, days });

    return Array.from(Array(12)).map((_, i) => {
      return format(addDays(from, i), 'yyyy-MM-dd');
    });
  }

  async getShowings() {
    const dates = this.getDates();

    const results = await Promise.all(
      dates.map(async (date) => {
        Logger.log(`Getting times for ${date}`);

        // const url = this.createUrl('ho00007226', date);
        const url = this.createUrl('ho00008428', date);
        const { data } = await this.httpService.get(url).toPromise();

        const events = data?.body?.events ?? [];

        return {
          date,
          showings: events.filter((e) => e.attributeIds?.includes('imax')),
        };
      }),
    );

    return results;
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async check() {
    const days = await this.getShowings();
    const showings = days.map((d) => d.showings).flat();

    if (showings.length) {
      await this.onNotify(showings);
    }
  }

  createUrl(film: string, date: string) {
    return `https://www.cineworld.co.uk/uk/data-api-service/v1/quickbook/10108/cinema-events/in-group/crawley/with-film/${film}/at-date/${date}`;
  }

  async onNotify(showings: any[]) {
    const message = `Quick! There are ${showings.length} showings of your fil! ${process.env.PUBLIC_URL}`;

    Logger.log(message);

    await this.client.messages.create({
      body: message,
      from: '+447488880681',
      to: '+447880880680',
    });
  }
}
