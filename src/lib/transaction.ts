import { Commitment, Signature, TransactionMessage } from "@solana/web3.js";
import { getErrorFromRPCResponse } from "./logs";
import { Connection } from "./connect";

export const confirmTransaction = async (
  connection: Connection,
  signature: Signature,
  commitment: Commitment = "finalized",
): Promise<string> => {
  // We don't actually want to abort the confirmation
  const controller = new AbortController();
  const rpcResponse = await connection.getRecentSignatureConfirmation({
    abortSignal: controller.signal,
    signature,
    commitment,
  });

  getErrorFromRPCResponse(rpcResponse);

  return signature;
};

// Was getSimulationUnits
// Credit https://twitter.com/stegabob, originally from
// https://x.com/stegaBOB/status/1766662289392889920
// export const getSimulationComputeUnits = async (
//   rpc: Rpc<any>,
//   instructions: Array<TransactionInstruction>,
//   payer: CryptoKey,
//   lookupTables: Array<AddressLookupTableAccount> | [],
// ): Promise<number | null> => {
//   const testInstructions = [
//     // Set an arbitrarily high number in simulation
//     // so we can be sure the transaction will succeed
//     // and get the real compute units used
//     ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
//     ...instructions,
//   ];

//   const testTransaction = new VersionedTransaction(
//     new TransactionMessage({
//       instructions: testInstructions,
//       payerKey: payer,
//       // RecentBlockhash can by any public key during simulation
//       // since 'replaceRecentBlockhash' is set to 'true' below
//       recentBlockhash: CryptoKey.default.toString(),
//     }).compileToV0Message(lookupTables),
//   );

//   const rpcResponse = await rpc.simulateTransaction(testTransaction, {
//     replaceRecentBlockhash: true,
//     sigVerify: false,
//   });

//   getErrorFromRPCResponse(rpcResponse);
//   return rpcResponse.value.unitsConsumed || null;
// };
