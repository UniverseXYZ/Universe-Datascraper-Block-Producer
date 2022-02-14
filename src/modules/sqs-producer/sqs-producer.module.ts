import { Module } from '@nestjs/common';
import { EthereumModule } from '../ethereum/ethereum.module';
import { NFTBlockTaskModule } from '../nft-block-task/nft-block-task.module';
import { SqsProducerService } from './sqs-producer.service';

@Module({
  providers: [SqsProducerService],
  exports: [SqsProducerService],
  imports: [NFTBlockTaskModule, EthereumModule],
})
export class SqsProducerModule {}
