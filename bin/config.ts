export class Config {
  env: "prod" | "stg" | "dev";
  region: string;
  owner: string;
  costCenter: string;

  constructor() {
    // @ts-ignore
    this.env = process.env.SF_ENV || "dev";

    this.region = process.env.SF_REGION || "eu-central-1";
    this.owner = process.env.SF_OWNER || "nobody";
    this.costCenter = process.env.SF_COST_CENTER || "testing";
  }
}
