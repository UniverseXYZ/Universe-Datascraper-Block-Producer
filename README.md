# Universe Datascraper Block Producer

## Description

This producer is responsible for setting the current block that whole workflow is working on. It reads the current block and controls the pace of sending block to downstream microservices.

## Requirements:

- NodeJS version 14+
- NPM

## Required External Service

- AWS SQS
- Infura
- MongoDB

## Primary Third Party Libraries

- NestJS
- Mongoose (MongoDB)
- bbc/sqs-producer (Only applicable for producers)
- bbc/sqs-consumer (Only applicable for consumers)

## DataFlow

### Input Data

The default start block is set up for this producer. Then the current progess is stored in database as Block Task.  

### Data Analysis and Storage

This producer reads the start block configuration and keeps tracking the progress that downstream services hanle the workflow. Then it sends the new block to the queue.  

### Output

It sends the new block that never read before to the queue.

## MongoDB Collection Usage

This consumer leverage the following data collection in [schema](https://github.com/plugblockchain/Universe-Datascraper-Schema)
- Block Tasks
