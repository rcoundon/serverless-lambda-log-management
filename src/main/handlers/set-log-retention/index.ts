import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogGroupsCommandInput,
  PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import Bottleneck from 'bottleneck';

import { applyRegex } from '@/utils';
import * as process from 'process';

const limiter = new Bottleneck({
  minTime: 200,
  maxConcurrent: 2,
});

const logs = new CloudWatchLogsClient({});

const validRetention = [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653];

export const handler = async () => {
  let success = true;
  if (!process.env.LOG_GROUP_RETENTION_DAYS || !validRetention.includes(parseInt(process.env.LOG_GROUP_RETENTION_DAYS))) {
    console.error(`Valid values LOG_GROUP_RETENTION_DAYS are ${validRetention.toString()}`);
    return {
      success: true,
    }; // no point retrying
  }

  try {
    const logGroupsToUpdate = await getLambdaLogGroupsToUpdate();
    if (logGroupsToUpdate && logGroupsToUpdate?.length) {
      await setLogGroupRetentionPolicy(logGroupsToUpdate);
    }
  } catch (err) {
    console.error(err);
    success = false;
  }

  return { success };
};

const getLambdaLogGroupsToUpdate = async () => {
  let logGroups: string[] = [];
  const params = buildDescribeLogGroupsCommandInput();
  do {
    const response = await limiter.schedule(() => logs.send(new DescribeLogGroupsCommand(params)));
    params.nextToken = response.nextToken;
    if (response.logGroups) {
      const logGroupName = response.logGroups
        .filter((lg) => lg.retentionInDays !== parseInt(process.env.LOG_GROUP_RETENTION_DAYS))
        .map((lg) => lg.logGroupName)
        .filter((lgn) => lgn !== undefined && lgn !== null && lgn !== '')
        .filter(applyRegex);
      if (logGroupName && logGroupName.length) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        logGroups = logGroups.concat(logGroupName);
      }
    }
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

const setLogGroupRetentionPolicy = async (logGroups: string[]) => {
  await Promise.all(
    logGroups.map(async (logGroupName) => {
      const params = buildPutRetentionPolicyCommandInput(logGroupName);
      console.log(`${logGroupName} - Setting retention period ${process.env.LOG_GROUP_RETENTION_DAYS}`);
      await limiter.schedule(() => logs.send(new PutRetentionPolicyCommand(params)));
    }),
  );
};

const buildPutRetentionPolicyCommandInput = (logGroupName: string) => {
  return {
    logGroupName: logGroupName,
    retentionInDays: parseInt(process.env.LOG_GROUP_RETENTION_DAYS),
  };
};
