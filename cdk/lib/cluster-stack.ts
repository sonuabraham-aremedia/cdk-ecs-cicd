import cdk = require("aws-cdk-lib/core");
import ec2 = require("aws-cdk-lib/aws-ec2");
import ecs = require("aws-cdk-lib/aws-ecs");
import rds = require("aws-cdk-lib/aws-rds");
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Duration, RemovalPolicy } from "aws-cdk-lib";

import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";

import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
} from "aws-cdk-lib/aws-rds";

export interface ClusterStackProps extends cdk.StackProps {
  cidr: string;
  maxAZs: number;
}

export class ClusterStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly dbInstance: rds.DatabaseInstance;

  constructor(scope: cdk.App, id: string, props: ClusterStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: props.maxAZs,
      cidr: props.cidr,
    });

    this.cluster = new ecs.Cluster(this, "FargateCluster", {
      vpc: this.vpc,
    });

    /*
    const engine = DatabaseInstanceEngine.mysql({
      version: MysqlEngineVersion.VER_8_0,
    });

    const instanceType = InstanceType.of(InstanceClass.T3, InstanceSize.MICRO);
    const port = 3306;
    const dbName = "my_awesome_db";

    // create database master user secret and store it in Secrets Manager
    const masterUserSecret = new Secret(this, "db-master-user-secret", {
      secretName: "db-master-user-secret",
      description: "Database master user credentials",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "postgres" }),
        generateStringKey: "password",
        passwordLength: 16,
        excludePunctuation: true,
      },
    });

    // Create a Security Group
    const dbSg = new SecurityGroup(this, "database-sg", {
      securityGroupName: "Database-SG",
      vpc: this.vpc,
    });

    // Add Inbound rule
    dbSg.addIngressRule(
      Peer.ipv4(this.vpc.vpcCidrBlock),
      Port.tcp(port),
      `Allow port ${port} for database connection from only within the VPC (${this.vpc.vpcId})`
    );

    this.dbInstance = new DatabaseInstance(this, "DB-1", {
      vpc: this.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      instanceType,
      engine,
      port,
      securityGroups: [dbSg],
      databaseName: dbName,
      credentials: Credentials.fromSecret(masterUserSecret),
      backupRetention: Duration.days(0), // disable automatic DB snapshot retention
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
      allocatedStorage: 20,
    });

    */

    //masterUserSecret.attach(this.dbInstance);
  }
}
