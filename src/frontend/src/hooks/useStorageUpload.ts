import { HttpAgent } from "@icp-sdk/core/agent";
import { useEffect, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

let clientPromise: Promise<StorageClient> | null = null;

function getStorageClient(): Promise<StorageClient> {
  if (!clientPromise) {
    clientPromise = loadConfig().then((config) => {
      const agent = new HttpAgent({ host: config.backend_host });
      return new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
    });
  }
  return clientPromise;
}

export function useStorageUpload() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getStorageClient().then(() => setReady(true));
  }, []);

  const uploadFile = async (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<string> => {
    const client = await getStorageClient();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { hash } = await client.putFile(bytes, onProgress);
    return client.getDirectURL(hash);
  };

  return { uploadFile, ready };
}
