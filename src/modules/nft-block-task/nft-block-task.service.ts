import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNFTBlockTaskDto } from './dto/create-nft-block-task.dto';
import {
  NFTBlockTask,
  NFTBlockTaskDocument,
} from './schemas/nft-block-task.schema';

@Injectable()
export class NFTBlockTaskService {
  private readonly logger = new Logger(NFTBlockTaskService.name);
  private readonly CURRENT_SCRAPING_BLOCK = 'CURRENT_SCRAPING_BLOCK';

  constructor(
    @InjectModel(NFTBlockTask.name)
    private readonly nftBlockTaskModel: Model<NFTBlockTaskDocument>,
  ) {}

  async updateNFTBlockTask(task: CreateNFTBlockTaskDto): Promise<void> {
    this.logger.log(`update task ${task.messageId} status (${task.status})`);
    await this.nftBlockTaskModel.updateOne(
      { messageId: task.messageId },
      { status: task.status },
    );
  }

  async removeNTFBlockTask(messageId: string) {
    this.logger.log(`remove task ${messageId}`);
    await this.nftBlockTaskModel.deleteOne({
      messageId,
    });
  }

  async insertLatestOne(blockNum: number) {
    await this.nftBlockTaskModel.insertMany({
      messageId: this.CURRENT_SCRAPING_BLOCK,
      blockNum,
      status: 'sent',
    });
  }

  async updateLatestOne(blockNum: number) {
    await this.nftBlockTaskModel.updateOne(
      { messageId: this.CURRENT_SCRAPING_BLOCK },
      { blockNum },
    );
  }

  async getLatestOne() {
    return await this.nftBlockTaskModel.findOne({
      messageId: this.CURRENT_SCRAPING_BLOCK,
    });
  }
}
