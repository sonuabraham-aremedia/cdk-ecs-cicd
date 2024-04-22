import cdk = require("aws-cdk-lib/core");
import iam = require("aws-cdk-lib/aws-iam");
import ecr = require("aws-cdk-lib/aws-ecr");
import codebuild = require("aws-cdk-lib/aws-codebuild");
import codepipeline = require("aws-cdk-lib/aws-codepipeline");
import codepipeline_actions = require("aws-cdk-lib/aws-codepipeline-actions");

import { PipelineContainerImage } from "./pipeline-container-image";
import {
  githubOwner,
  repoName,
  awsSecretsGitHubTokenName,
  gitDevBranch,
  ssmImageTagParamName,
} from "../config";

export class DevPipelineStack extends cdk.Stack {
  public readonly appRepository: ecr.Repository;
  public readonly appBuiltImage: PipelineContainerImage;

  public readonly nginxRepository: ecr.Repository;
  public readonly nginxBuiltImage: PipelineContainerImage;

  public readonly dbCheckRepository: ecr.Repository;
  public readonly dbCheckBuiltImage: PipelineContainerImage;

  public readonly imageTag: string;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      //autoDeploy: false,
    });

    this.appRepository = new ecr.Repository(this, "AppEcrRepo");
    this.appBuiltImage = new PipelineContainerImage(this.appRepository);

    this.nginxRepository = new ecr.Repository(this, "NginxEcrRepo");
    this.nginxBuiltImage = new PipelineContainerImage(this.nginxRepository);

    this.dbCheckRepository = new ecr.Repository(this, "DbCheckEcrRepo");
    this.dbCheckBuiltImage = new PipelineContainerImage(this.dbCheckRepository);

    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: "GitHub",
      owner: githubOwner,
      repo: repoName,
      oauthToken: cdk.SecretValue.secretsManager(awsSecretsGitHubTokenName),
      output: sourceOutput,
      trigger: codepipeline_actions.GitHubTrigger.POLL,
      branch: gitDevBranch,
    });

    const dockerBuild = new codebuild.PipelineProject(
      this,
      "DockerCodeBuildProject",
      {
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          privileged: true,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            pre_build: {
              commands:
                "$(aws ecr get-login --no-include-email --region $AWS_DEFAULT_REGION)",
            },
            build: {
              commands: [
                "docker build -t $APP_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION app",
                "docker build -t $NGINX_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION nginx",
                "docker build -t $DBCHECK_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION dbcheck",
              ],
            },
            post_build: {
              commands: [
                "docker push $APP_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION",
                "docker push $NGINX_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION",
                "docker push $DBCHECK_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION",
                `printf '{ "imageTag": "'$CODEBUILD_RESOLVED_SOURCE_VERSION'" }' > imageTag.json`,
                'aws ssm put-parameter --name "' +
                  ssmImageTagParamName +
                  '" --value $CODEBUILD_RESOLVED_SOURCE_VERSION --type String --overwrite',
              ],
            },
          },
          artifacts: {
            files: "imageTag.json",
          },
        }),
        environmentVariables: {
          APP_REPOSITORY_URI: {
            value: this.appRepository.repositoryUri,
          },
          NGINX_REPOSITORY_URI: {
            value: this.nginxRepository.repositoryUri,
          },
          DBCHECK_REPOSITORY_URI: {
            value: this.dbCheckRepository.repositoryUri,
          },
        },
      }
    );
    dockerBuild.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ssm:PutParameter"],
        resources: ["arn:aws:ssm:*:*:parameter/" + ssmImageTagParamName],
      })
    );
    this.appRepository.grantPullPush(dockerBuild);
    this.nginxRepository.grantPullPush(dockerBuild);
    this.dbCheckRepository.grantPullPush(dockerBuild);

    const cdkBuild = new codebuild.PipelineProject(this, "CdkBuildProject", {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            commands: ["cd cdk", "npm install"],
          },
          build: {
            commands: [
              "npm run build",
              "npm run cdk synth DevAppStack -- -o .",
            ],
          },
        },
        artifacts: {
          "base-directory": "cdk",
          files: "DevAppStack.template.json",
        },
      }),
    });
    cdkBuild.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeAvailabilityZones"],
        resources: ["*"],
      })
    );

    const dockerBuildOutput = new codepipeline.Artifact("DockerBuildOutput");
    const cdkBuildOutput = new codepipeline.Artifact();

    new codepipeline.Pipeline(this, "Pipeline", {
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Build",
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: "DockerBuild",
              project: dockerBuild,
              input: sourceOutput,
              outputs: [dockerBuildOutput],
            }),
            new codepipeline_actions.CodeBuildAction({
              actionName: "CdkBuild",
              project: cdkBuild,
              input: sourceOutput,
              outputs: [cdkBuildOutput],
            }),
          ],
        },
        {
          stageName: "Deploy",
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: "CFN_Deploy",
              stackName: "DevAppStack",
              templatePath: cdkBuildOutput.atPath("DevAppStack.template.json"),
              adminPermissions: true,
              parameterOverrides: {
                [this.appBuiltImage.paramName]: dockerBuildOutput.getParam(
                  "imageTag.json",
                  "imageTag"
                ),
                [this.nginxBuiltImage.paramName]: dockerBuildOutput.getParam(
                  "imageTag.json",
                  "imageTag"
                ),
                [this.dbCheckBuiltImage.paramName]: dockerBuildOutput.getParam(
                  "imageTag.json",
                  "imageTag"
                ),
              },
              extraInputs: [dockerBuildOutput],
            }),
          ],
        },
      ],
    });

    this.imageTag = dockerBuildOutput.getParam("imageTag.json", "imageTag");
  }
}
