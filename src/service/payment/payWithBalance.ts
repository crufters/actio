import { DataSource } from "typeorm";
import { error } from "../../util.js";
import {
  PayWithBalanceRequest,
  PayWithBalanceResponse,
  Account,
  AccountType,
  Transaction,
  TransactionEntry,
  accountCompanyStripe,
} from "./models.js";
import { nanoid } from "nanoid";
import { AuthenticationService } from "../authentication/index.js";

export default async (
  connection: DataSource,
  auth: AuthenticationService,
  req: PayWithBalanceRequest
): Promise<PayWithBalanceResponse> => {
  let token = await auth.tokenRead({
    token: req.token,
  });

  if (!req.amount) {
    throw error("amount missing", 400);
  }
  if (!req.token) {
    throw error("token missing", 400);
  }
  if (!req.currency) {
    throw error("currency missing", 400);
  }

  let internalUserAccount = await connection
    .createQueryBuilder(Account, "account")
    .where(`account."userId" = :userId`, { userId: token.token.userId })
    .andWhere(`account.type = :type`, { type: AccountType.Internal })
    .getOne();

  if (!internalUserAccount) {
    throw error("internal user account not found", 500);
  }

  let transaction = new Transaction();
  transaction.id = nanoid();
  transaction.itemId = req.itemId;

  let debitUserEntry = new TransactionEntry();
  debitUserEntry.id = nanoid();
  debitUserEntry.accountId = internalUserAccount.id;
  debitUserEntry.debit = req.amount;
  debitUserEntry.credit = 0;

  let creditCompanyEntry = new TransactionEntry();
  creditCompanyEntry.id = nanoid();
  creditCompanyEntry.accountId = accountCompanyStripe.id;
  creditCompanyEntry.debit = 0;
  creditCompanyEntry.credit = req.amount;

  await connection.transaction(async (tran) => {
    await tran.save(transaction);
    await tran.save(debitUserEntry);
    await tran.save(creditCompanyEntry);
  });

  return {};
};
