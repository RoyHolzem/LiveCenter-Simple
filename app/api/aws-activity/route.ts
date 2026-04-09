import { CloudTrailClient, LookupEventsCommand } from '@aws-sdk/client-cloudtrail';
import { NextResponse } from 'next/server';

const client = new CloudTrailClient({ region: process.env.AWS_REGION || 'eu-central-1' });

type AwsAction = {
  id: string;
  timestamp: string;
  verb: string;
  category: string;
  label: string;
  resource: string;
  region: string;
  user: string;
  detail: string;
};

const SERVICE_MAP: Record<string, string> = {
  'lambda.amazonaws.com': 'lambda',
  'cloudformation.amazonaws.com': 'cloudformation',
  'amplify.amazonaws.com': 'amplify',
  's3.amazonaws.com': 's3',
  'iam.amazonaws.com': 'iam',
  'apigateway.amazonaws.com': 'apigateway',
  'dynamodb.amazonaws.com': 'dynamodb',
  'ec2.amazonaws.com': 'ec2',
  'ecs.amazonaws.com': 'ecs',
  'sns.amazonaws.com': 'sns',
  'sqs.amazonaws.com': 'sqs',
  'lightsail.amazonaws.com': 'lightsail',
  'cloudfront.amazonaws.com': 'cloudfront',
  'route53.amazonaws.com': 'route53',
  'acm.amazonaws.com': 'acm',
  'cloudtrail.amazonaws.com': 'cloudtrail',
  'cloudwatch.amazonaws.com': 'cloudwatch',
  'logs.amazonaws.com': 'logs',
  'ssm.amazonaws.com': 'ssm',
  'secretsmanager.amazonaws.com': 'secretsmanager',
  'kms.amazonaws.com': 'kms',
  'elasticloadbalancing.amazonaws.com': 'elb',
  'autoscaling.amazonaws.com': 'autoscaling',
  'cognito-idp.amazonaws.com': 'cognito',
  'appsync.amazonaws.com': 'appsync',
  'bedrock.amazonaws.com': 'bedrock',
  'sagemaker.amazonaws.com': 'sagemaker',
};

function categorize(source: string): string {
  return SERVICE_MAP[source] || source.replace('.amazonaws.com', '');
}

function extractVerb(eventName: string): string {
  const lower = eventName.toLowerCase();
  const verbs = ['create', 'update', 'delete', 'deploy', 'invoke', 'list', 'describe', 'get', 'put', 'configur', 'scale', 'start', 'stop', 'modify', 'attach', 'detach', 'enable', 'disable', 'publish', 'subscribe', 'send'];
  for (const v of verbs) {
    if (lower.startsWith(v)) return v.replace(/e$/, '') + 'ed';
  }
  if (lower.includes('deploy')) return 'deployed';
  return lower;
}

function extractResource(event: any): string {
  if (event.ResourceName) return event.ResourceName;
  try {
    const resources = JSON.parse(event.Resources || '[]');
    if (resources.length > 0) return resources[0].resourceName || resources[0].ARN || '—';
  } catch {}
  return '—';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minutes = parseInt(searchParams.get('minutes') || '30', 10);
  const startTime = new Date(Date.now() - minutes * 60 * 1000);

  try {
    const command = new LookupEventsCommand({
      StartTime: startTime,
      MaxResults: 50,
    });

    const response = await client.send(command);

    const actions: AwsAction[] = (response.Events || [])
      .filter((e) => {
        const cat = categorize(e.EventSource || '');
        // Filter out noisy read-only/lookup events
        const name = (e.EventName || '').toLowerCase();
        const noisy = ['lookup', 'getloginprofile', 'getuser', 'getrole', 'getpolicy',
          'listattached', 'listrole', 'listuser', 'listbucket', 'getbucket', 'headbucket',
          'getfunction', 'listfunction', 'describeaccount', 'describeinstances',
          'getoperation', 'getoperations', 'getinstanceregion', 'isauthenticated',
          'getinstanceaccessdetails', 'getinstanceportstates', 'getinstancemetricdata',
          'getrelationaldatabase', 'getrelationaldatabases', 'getdisk', 'getdisks',
          'getstaticip', 'getstaticips', 'getdistribution', 'getdistributions',
          'getdistributionlatestcachereset', 'getbucketobjects', 'getbuckets',
          'getcontainerimages', 'getcontainerservicemetricdata', 'getcontainerservices'];
        return !noisy.some((n) => name.includes(n));
      })
      .map((event, i) => ({
        id: `ct-${Date.now()}-${i}`,
        timestamp: event.EventTime?.toISOString() || new Date().toISOString(),
        verb: extractVerb(event.EventName || ''),
        category: categorize(event.EventSource || ''),
        label: event.EventName || 'Unknown',
        resource: extractResource(event),
        region: event.EventSource?.includes('lightsail') ? 'lightsail' : process.env.AWS_REGION || 'eu-central-1',
        user: event.Username || '—',
        detail: event.EventName || '',
      }));

    return NextResponse.json({ actions, count: actions.length, since: startTime.toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'CloudTrail lookup failed', actions: [] },
      { status: 500 }
    );
  }
}
