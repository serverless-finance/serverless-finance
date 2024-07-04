import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  LambdaIntegration,
  Resource,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { ApiLambda } from "../api-lambda";
import { TABLE_NAME } from "../../../common/env";
import { AccountModel } from "./models/accounts";

export interface AccountApiEndpointProps {
  databaseTable: Table;
  apiGateway: RestApi;
}

export class AccountApiEndpoint extends Construct {
  public readonly lambda: NodejsFunction;
  public readonly lambdaIntegration: LambdaIntegration;

  registerCreateRoute(
    scope: Construct,
    apiResource: Resource,
    apiGateway: RestApi,
    lambda: ApiLambda
  ) {
    const model = new AccountModel(scope, "AccountModel", {
      restApi: apiGateway,
    });

    apiResource.addMethod("POST", lambda.lambdaIntegration, {
      requestValidator: model.createRequestValidator,
      requestModels: {
        "application/json": model.createBodyModel,
      },
    });
  }

  registerGetRoute(
    scope: Construct,
    apiResource: Resource,
    apiGateway: RestApi,
    lambda: ApiLambda
  ) {
    apiResource.addMethod("GET", lambda.lambdaIntegration);
  }

  registerDeleteRoute(
    scope: Construct,
    apiResource: Resource,
    apiGateway: RestApi,
    lambda: ApiLambda
  ) {
    apiResource.addMethod("DELETE", lambda.lambdaIntegration);
  }

  constructor(scope: Construct, id: string, props: AccountApiEndpointProps) {
    super(scope, id);

    const accountLambda = new ApiLambda(this, "AccountCRUD", {
      lambda: "crud-accounts",
      name: "crud-accounts",
      memory: 256,
      env: {
        [TABLE_NAME]: props?.databaseTable.tableName,
      },
    });

    // set permissions for lambda
    props.databaseTable.grantReadWriteData(accountLambda.lambda);

    const accountsRoute = props.apiGateway.root.addResource("accounts");

    // register lambda at api gateway
    this.registerCreateRoute(
      scope,
      accountsRoute,
      props.apiGateway,
      accountLambda
    );
    this.registerGetRoute(
      scope,
      accountsRoute,
      props.apiGateway,
      accountLambda
    );

    const accountsIdRoute = accountsRoute.addResource("{id}");
    this.registerDeleteRoute(
      scope,
      accountsIdRoute,
      props.apiGateway,
      accountLambda
    );
  }
}
