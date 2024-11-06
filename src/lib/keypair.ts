import { Keypair } from "@solana/web3.js";
import base58 from "bs58";

// Default value from Solana CLI
const DEFAULT_FILEPATH = "~/.config/solana/id.json";

export const keypairToSecretKeyJSON = (keypair: Keypair): string => {
  return JSON.stringify(Array.from(keypair.secretKey));
};

export const getKeypairFromFile = async (filepath?: string) => {
  // Node-specific imports
  // @ts-expect-error TODO: fix the warning rather than disabling it when we have time
  const path = await import("node:path");
  // Work out correct file name
  if (!filepath) {
    filepath = DEFAULT_FILEPATH;
  }
  if (filepath[0] === "~") {
    const home = process.env.HOME || null;
    if (home) {
      filepath = path.join(home, filepath.slice(1));
    }
  }

  // Get contents of file
  let fileContents: string;
  try {
    // Node-specific imports
    // @ts-expect-error TODO: fix the warning rather than disabling it when we have time
    const { readFile } = await import("node:fs/promises");
    const fileContentsBuffer = await readFile(filepath);
    fileContents = fileContentsBuffer.toString();
  } catch (error) {
    throw new Error(`Could not read keypair from file at '${filepath}'`);
  }

  // Parse contents of file
  let parsedFileContents: Uint8Array;
  try {
    parsedFileContents = Uint8Array.from(JSON.parse(fileContents));
  } catch (thrownObject) {
    const error = thrownObject as Error;
    if (!error.message.includes("Unexpected token")) {
      throw error;
    }
    throw new Error(`Invalid secret key file at '${filepath}'!`);
  }
  return Keypair.fromSecretKey(parsedFileContents);
};

export const getKeypairFromEnvironment = (variableName: string) => {
  const secretKeyString = process.env[variableName];
  if (!secretKeyString) {
    throw new Error(`Please set '${variableName}' in environment.`);
  }

  // Try the shorter base58 format first
  let decodedSecretKey: Uint8Array;
  try {
    decodedSecretKey = base58.decode(secretKeyString);
    return Keypair.fromSecretKey(decodedSecretKey);
  } catch (throwObject) {
    const error = throwObject as Error;
    if (!error.message.includes("Non-base58 character")) {
      throw new Error(
        `Invalid secret key in environment variable '${variableName}'!`,
      );
    }
  }

  // Try the longer JSON format
  try {
    decodedSecretKey = Uint8Array.from(JSON.parse(secretKeyString));
  } catch (error) {
    throw new Error(
      `Invalid secret key in environment variable '${variableName}'!`,
    );
  }
  return Keypair.fromSecretKey(decodedSecretKey);
};

export const addKeypairToEnvFile = async (
  keypair: Keypair,
  variableName: string,
  envFileName?: string,
) => {
  // Node-specific imports
  // @ts-expect-error TODO: fix the warning rather than disabling it when we have time
  const { appendFile } = await import("node:fs/promises");
  if (!envFileName) {
    envFileName = ".env";
  }
  const existingSecretKey = process.env[variableName];
  if (existingSecretKey) {
    throw new Error(`'${variableName}' already exists in env file.`);
  }
  const secretKeyString = keypairToSecretKeyJSON(keypair);
  await appendFile(
    envFileName,
    `\n# Solana Address: ${keypair.publicKey.toBase58()}\n${variableName}=${secretKeyString}`,
  );
};

// Shout out to Dean from WBA for this technique
export const makeKeypairs = (amount: number): Array<Keypair> => {
  return Array.from({ length: amount }, () => Keypair.generate());
};