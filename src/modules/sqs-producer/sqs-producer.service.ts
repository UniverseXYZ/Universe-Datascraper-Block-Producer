import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Producer } from 'sqs-producer';
import AWS from 'aws-sdk';
import {
  Message,
  QueueMessageBody,
  SqsProducerHandler,
} from './sqs-producer.types';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EthereumService } from '../ethereum/ethereum.service';
import { NFTBlockTaskService } from '../nft-block-task/nft-block-task.service';

@Injectable()
export class SqsProducerService implements OnModuleInit, SqsProducerHandler {
  public sqsProducer: Producer;
  public blockDirection: string;
  private readonly logger = new Logger(SqsProducerService.name);
  nextBlock: number;

  constructor(
    private configService: ConfigService,
    private readonly nftBlockService: NFTBlockTaskService,
    private readonly ethereumService: EthereumService,
  ) {
    AWS.config.update({
      region: this.configService.get('aws.region'),
      accessKeyId: this.configService.get('aws.accessKeyId'),
      secretAccessKey: this.configService.get('aws.secretAccessKey'),
    });
  }

  public onModuleInit() {
    this.sqsProducer = Producer.create({
      queueUrl: this.configService.get('aws.queueUrl'),
      sqs: new AWS.SQS(),
    });
    this.blockDirection = this.configService.get('block_direction');
  }

  /**
   * #1. check latest block number
   * #2. send to queue
   * #3. save tasks to DB
   * #4. mark collection as processed
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  public async checkCollection() {
    // Check if there is any unprocessed collection
    const currentBlock = await this.ethereumService.getBlockNum();
    const lastBlock = await this.nftBlockService.getLatestOne(this.blockDirection);
    
    if (!lastBlock) {
      this.logger.log(
        `[Block Producer] Havent started yet, will be start with the default block number: ${this.configService.get(
          'default_start_block',
        )}`,
      );
      if(this.blockDirection === 'up'){
        this.nextBlock = this.configService.get('default_start_block');
      } else if(this.blockDirection === 'down'){
        this.nextBlock = currentBlock; 
      } else {
        this.logger.log('[Block Producer] BLOCK_DIRECTION NOT CONFGIRURED');
        return
      }
      await this.nftBlockService.insertLatestOne(this.nextBlock, this.blockDirection);
    } else {
      // TODO: check if we should use BigNumber here
      this.nextBlock = this.blockDirection === 'up' 
        ? lastBlock.blockNum + 1
        : lastBlock.blockNum - 1;
    }

    if (this.nextBlock > currentBlock) {
      this.logger.log(
        `[Block Producer] [UP] Skip this round as we are processing block: ${this.nextBlock}, which exceed current block: ${currentBlock}, `,
      );
      return;
    }
    
    if (this.nextBlock < this.configService.get('default_start_block')){
      this.logger.log(
        `[Block Producer] [DOWN] Skip this round as we are processing block: ${this.nextBlock}, which exceed current block: ${currentBlock}, `,
      );
      return;
    }

    // Prepare queue messages
    const message: Message<QueueMessageBody> = {
      id: this.nextBlock.toString(),
      body: {
        blockNum: this.nextBlock,
      },
      groupId: this.nextBlock.toString(),
      deduplicationId: this.nextBlock.toString(),
    };
    await this.sendMessage(message);
    this.logger.log(
      `[Block Producer] Successfully sent block num: ${this.nextBlock}`,
    );

    // Increase the record
    await this.nftBlockService.updateLatestOne(this.nextBlock, this.blockDirection);
  }

  async sendMessage<T = any>(payload: Message<T> | Message<T>[]) {
    const originalMessages = Array.isArray(payload) ? payload : [payload];
    const messages = originalMessages.map((message) => {
      let body = message.body;
      if (typeof body !== 'string') {
        body = JSON.stringify(body) as any;
      }

      return {
        ...message,
        body,
      };
    });

    return await this.sqsProducer.send(messages as any[]);
  }
}
