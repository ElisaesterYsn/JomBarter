import { Module } from '@nestjs/common';
import { TradeOffersController } from './trade-offers.controller';
import { TradeOffersService } from './trade-offers.service';

@Module({
  controllers: [TradeOffersController],
  providers: [TradeOffersService],
  exports: [TradeOffersService],
})
export class TradeOffersModule {}
