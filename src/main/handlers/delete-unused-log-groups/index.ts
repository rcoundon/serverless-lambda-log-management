import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DeleteLogGroupCommand,
  DescribeLogGroupsCommandInput,
} from '@aws-sdk/client-cloudwatch-logs';
import { LambdaClient, ListFunctionsCommand, ListFunctionsCommandInput } from '@aws-sdk/client-lambda';
import { ScheduledHandler } from 'aws-lambda';
import Bottleneck from 'bottleneck';

import { applyRegex } from '@/utils';

const limiter = new Bottleneck({
  minTime: 200,
  maxConcurrent: 2,
});

const logs = new CloudWatchLogsClient({});
const lambda = new LambdaClient({});

export const handler: ScheduledHandler = async () => {
  try {
    const functionNames = await getFunctionNames();
    if (functionNames && functionNames.length) {
      const logGroupNames = await getFunctionLogGroupNames();
      const logGroupsToDelete = logGroupNames.filter((lgn) => !functionNames.includes(lgn));
      if (logGroupsToDelete?.length) {
        await limiter.schedule(() => deleteUnusedLogGroups(logGroupsToDelete));
      }
      console.info(`Deleted ${logGroupsToDelete.length} unused log groups`);
    }
  } catch (err) {
    console.error(err);
  }
};

const getFunctionNames = async () => {
  let functionNames: string[] = [];
  const params: ListFunctionsCommandInput = {};
  do {
    const response = await limiter.schedule(() => lambda.send(new ListFunctionsCommand(params)));
    params.Marker = response.NextMarker;
    if (response?.Functions) {
      functionNames = functionNames.concat(response?.Functions?.map((func) => `/aws/lambda/${String(func.FunctionName)}`));
    }
  } while (params.Marker);

  return functionNames;
};

const getFunctionLogGroupNames = async () => {
  let logGroups: string[] = [];
  const params = buildDescribeLogGroupsCommandInput();
  do {
    const response = await logs.send(new DescribeLogGroupsCommand(params));
    params.nextToken = response.nextToken;
    const filteredLgs = response.logGroups
      ?.filter((lg) => lg.logGroupName !== undefined && lg.logGroupName !== null && lg.logGroupName !== '')
      .map((lg) => lg.logGroupName)
      .filter(applyRegex);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    logGroups = logGroups.concat(filteredLgs);
  } while (params.nextToken);

  return logGroups;
};

const buildDescribeLogGroupsCommandInput = () => {
  const params: DescribeLogGroupsCommandInput = {
    limit: 50,
    logGroupNamePrefix: '/aws/lambda/',
  };

  return params;
};

const deleteUnusedLogGroups = async (logGroupNames: string[]) => {
  // Delete one at a time to avoid throttling
  for (const logGroupName of logGroupNames) {
    await logs.send(new DeleteLogGroupCommand({ logGroupName })).catch((err) => console.error(err));
    await sleep(200);
  }
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
