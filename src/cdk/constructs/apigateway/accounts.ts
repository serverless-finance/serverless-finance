import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaIntegration, Resource, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { ApiLambda } from "../api-lambda";
import { TABLE_NAME } from "../../../common/env";
import { AccountModel } from "./models/accounts";
import { Config } from "../../config";

export interface AccountApiEndpointProps {
  databaseTable: Table;
  apiGateway: RestApi;
}

export class AccountApiEndpoint extends Construct {
  public readonly lambda: NodejsFunction;
  public readonly lambdaIntegration: LambdaIntegration;

  registerCreateRoute(model: AccountModel, apiResource: Resource, lambda: ApiLambda) {
    apiResource.addMethod("POST", lambda.lambdaIntegration, {
      requestValidator: model.createRequestValidator,
      requestModels: {
        "application/json": model.createBodyModel,
      },
    });
  }

  registerGetRoute(apiResource: Resource, lambda: ApiLambda) {
    apiResource.addMethod("GET", lambda.lambdaIntegration);
  }

  registerUpdateRoute(model: AccountModel, apiResource: Resource, lambda: ApiLambda) {
    apiResource.addMethod("PUT", lambda.lambdaIntegration, {
      requestValidator: model.createRequestValidator,
      requestModels: {
        "application/json": model.createBodyModel,
      },
    });
  }

  registerDeleteRoute(apiResource: Resource, lambda: ApiLambda) {
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
    const model = new AccountModel(scope, "AccountModel", {
      restApi: props.apiGateway,
    });

    // register lambda at api gateway
    this.registerCreateRoute(model, accountsRoute, accountLambda);
    this.registerGetRoute(accountsRoute, accountLambda);

    const accountsIdRoute = accountsRoute.addResource("{id}");
    this.registerUpdateRoute(model, accountsIdRoute, accountLambda);
    this.registerDeleteRoute(accountsIdRoute, accountLambda);
  }
}
