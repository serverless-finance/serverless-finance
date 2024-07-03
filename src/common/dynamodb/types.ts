enum DatabaseObject {
  Account = "account",
  Transaction = "transaction",
}

enum DatabaseField {
  PK = "PK",
  SK = "SK",
  CreatedAt = "CreatedAt",
  Type = "Type",
  AccountName = "AccountName",
  AccountBalance = "AccountBalance",
  TransactionTimestamp = "TransactionTimestamp",
  TransactionVolume = "TransactionVolume",
}

export { DatabaseField, DatabaseObject };
