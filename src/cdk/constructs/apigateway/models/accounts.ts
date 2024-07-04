import { Construct } from "constructs";
import {
  JsonSchema,
  JsonSchemaType,
  Model,
  RequestValidator,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";

interface AccountModelProps {
  restApi: RestApi;
}

export class AccountModel extends Construct {
  public readonly createBodyModel: Model;
  public readonly createRequestValidator: RequestValidator;

  constructor(scope: Construct, id: string, props: AccountModelProps) {
    super(scope, id);

    const createBodyName = "AccountCreateBody";
    this.createBodyModel = new Model(this, `${createBodyName}Model`, {
      restApi: props.restApi,
      contentType: "application/json",
      description: "Create account",
      modelName: "AccountCreateBody",
      schema: {
        type: JsonSchemaType.OBJECT,
        required: ["name"],
        properties: {
          name: { type: JsonSchemaType.STRING },
        },
        additionalProperties: false,
      },
    });

    this.createRequestValidator = new RequestValidator(
      scope,
      `${createBodyName}Validator`,
      {
        restApi: props.restApi,
        requestValidatorName: `${createBodyName}Validator`,
        validateRequestBody: true,
      }
    );
  }
}
