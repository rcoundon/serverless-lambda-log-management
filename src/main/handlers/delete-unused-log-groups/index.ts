import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DeleteLogGroupCommand,
  DescribeLogGroupsCommandInput,
} from '@aws-sdk/client-cloudwatch-logs';
import { LambdaClient, ListFunctionsCommand, ListFunctionsCommandInput } from '@aws-sdk/client-lambda';
import { ScheduledHandler } from 'aws-lambda';

import { applyRegex } from '@/utils';

const logs = new CloudWatchLogsClient({});
const lambda = new LambdaClient({});

export const handler: ScheduledHandler = async () => {
  try {
    const functionNames = await getFunctionNames();
    if (functionNames && functionNames.length) {
      const logGroupNames = await getFunctionLogGroupNames();
      const logGroupsToDelete = logGroupNames.filter((lgn) => !functionNames.includes(lgn));
      if (logGroupsToDelete?.length) {
        await deleteUnusedLogGroups(logGroupsToDelete);
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
    const response = await lambda.send(new ListFunctionsCommand(params));
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
  await Promise.all(
    logGroupNames.map(async (logGroupName) => {
      await logs.send(new DeleteLogGroupCommand({ logGroupName }));
    }),
  );
};
