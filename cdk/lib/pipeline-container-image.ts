import { IRepository } from "aws-cdk-lib/aws-ecr";
import {
  CfnTaskDefinition,
  ContainerDefinition,
  ContainerImage,
  ContainerImageConfig,
} from "aws-cdk-lib/aws-ecs";
import { CfnParameter, Lazy } from "aws-cdk-lib/core";
import cdk = require("aws-cdk-lib/core");

export class PipelineContainerImage extends ContainerImage {
  public readonly imageName: string;
  private readonly repository: IRepository;
  private parameter?: CfnParameter;

  constructor(repository: IRepository) {
    super();
    this.imageName = repository.repositoryUriForTag(
      Lazy.string({ produce: () => this.parameter!.valueAsString })
    );
    this.repository = repository;
  }

  public bind(containerDefinition: ContainerDefinition): ContainerImageConfig {
    this.repository.grantPull(
      containerDefinition.taskDefinition.obtainExecutionRole()
    );
    this.parameter = new CfnParameter(containerDefinition, "PipelineParam", {
      type: "String",
    });
    return {
      imageName: this.imageName,
    };
  }

  public get paramName(): string {
    //return cdk.Token.asString(this.parameter!.logicalId).toString();
    return Lazy.string({ produce: () => this.parameter!.logicalId });
    //return "Test";
  }

  public toRepositoryCredentialsJson():
    | CfnTaskDefinition.RepositoryCredentialsProperty
    | undefined {
    return undefined;
  }
}
