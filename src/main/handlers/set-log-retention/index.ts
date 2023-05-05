import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogGroupsCommandInput,
  PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const logs = new CloudWatchLogsClient({});

export const handler = async () => {
  let success = true;
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
    const response = await logs.send(new DescribeLogGroupsCommand(params));
    params.nextToken = response.nextToken;
    if (response.logGroups) {
      const logGroupName = response.logGroups
        .filter((lg) => lg.retentionInDays !== parseInt(process.env.RETENTION_DAYS))
        .map((lg) => lg.logGroupName)
        .filter((lgn) => lgn !== undefined && lgn !== null && lgn !== '');
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
      await logs.send(new PutRetentionPolicyCommand(params));
    }),
  );
};

const buildPutRetentionPolicyCommandInput = (logGroupName: string) => {
  return {
    logGroupName: logGroupName,
    retentionInDays: parseInt(process.env.RETENTION_DAYS),
  };
};
