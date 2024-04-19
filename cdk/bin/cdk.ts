#!/usr/bin/env node
import "source-map-support/register";
import cdk = require("aws-cdk-lib");

import { ClusterStack } from "../lib/cluster-stack";
import { AppStack } from "../lib/app-stack";
import { DevPipelineStack } from "../lib/dev-pipeline-stack";
import { StagingProdPipelineStack } from "../lib/staging-prod-pipeline-stack";

const app = new cdk.App();

// Cluster Stacks - maxAZs of 3 is best practice, but make sure you have no EIP limitations (5 is default)
const devClusterStack = new ClusterStack(app, "DevCluster", {
  cidr: "10.1.0.0/20",
  maxAZs: 2,
});
//cdk.Tag.apply(devClusterStack, "environment", "dev");

/*
const cdkEnv: cdk.Environment = {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT
  }
  
  const xpEnv: cdk.Environment = {
    region: 'ap-southeast-2',
    account: '391970746680'
  }
  
  const chosenEnv = xpEnv
  console.log(`ourEnv.account: ${chosenEnv.account}, ourEnv.region: ${chosenEnv.region}`)
  
*/
//const devDatabaseStack = new DataBaseStack(app,"DevDatabase",env: chosenEnv);
//cdk.Tag.apply(devDatabaseStack, "environment", "dev");

const prodClusterStack = new ClusterStack(app, "ProdCluster", {
  cidr: "10.3.0.0/20",
  maxAZs: 2,
});
//cdk.Tag.apply(prodClusterStack, "environment", "prod");

// CodePipeline stacks
const devPipelineStack = new DevPipelineStack(app, "DevPipelineStack");
//cdk.Tag.apply(devPipelineStack, "environment", "dev");

const stagingProdPipelineStack = new StagingProdPipelineStack(
  app,
  "StagingProdPipelineStack",
  {
    appRepository: devPipelineStack.appRepository,
    nginxRepository: devPipelineStack.nginxRepository,
    imageTag: devPipelineStack.imageTag,
  }
);
//cdk.Tag.apply(stagingProdPipelineStack, "environment", "prod");

// DevAppStack
const devAppStack = new AppStack(app, "DevAppStack", {
  vpc: devClusterStack.vpc,
  cluster: devClusterStack.cluster,
  //autoDeploy: false,
  appImage: devPipelineStack.appBuiltImage,
  nginxImage: devPipelineStack.nginxBuiltImage,
});
//cdk.Tag.apply(devAppStack, "environment", "dev");

// StagingAppStack
const stagingAppStack = new AppStack(app, "StagingAppStack", {
  vpc: prodClusterStack.vpc,
  cluster: prodClusterStack.cluster,
  //autoDeploy: false,
  appImage: stagingProdPipelineStack.appBuiltImageStaging,
  nginxImage: stagingProdPipelineStack.nginxBuiltImageStaging,
});
//cdk.Tag.a(stagingAppStack, "environment", "staging");

// ProdAppStack
const prodAppStack = new AppStack(app, "ProdAppStack", {
  vpc: prodClusterStack.vpc,
  cluster: prodClusterStack.cluster,
  //autoDeploy: false,
  appImage: stagingProdPipelineStack.appBuiltImageProd,
  nginxImage: stagingProdPipelineStack.nginxBuiltImageProd,
});
//cdk.Tag.add(prodAppStack, "environment", "prod");
