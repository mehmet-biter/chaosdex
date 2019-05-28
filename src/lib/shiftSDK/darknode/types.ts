
interface PrivateParam {
    private: true;
    index: number;
    value: string;
}

interface PublicParam {
    private: false;
    value: string;
}

export type Param = PrivateParam | PublicParam;

export interface Payload {
    method: string;
    // tslint:disable-next-line: no-any
    args: any; // Param[];
}

/// Requests ///////////////////////////////////////////////////////////////////

export interface AddressesRequest {
    darknodeIDs: string[];
}

export interface SendMessageRequest {
    nonce: number;
    to: string;
    signature: string;
    payload: Payload;
}

export interface ReceiveMessageRequest {
    messageID: string;
}

/// Responses //////////////////////////////////////////////////////////////////

export type JSONRPCResponse<T> = {
    jsonrpc: string;
    version: string;
    result: T;
    error: undefined;
    id: number;
} | {
    jsonrpc: string;
    version: string;
    result: undefined;
    // tslint:disable-next-line: no-any
    error: any;
    id: number;
};

export type HealthResponse = JSONRPCResponse<{
    version: string;
    address: string;
    cpus: {
        cores: number;
        clockRate: number;
        cacheSize: number;
        modelName: string;
    };
    ram: string;
    disk: string;
    location: string;
}>;

export type PeersResponse = JSONRPCResponse<{
    peers: string[];
}>;

export type NumPeersResponse = JSONRPCResponse<{
    numPeers: number;
}>;

export type EpochResponse = JSONRPCResponse<{
    epochHash: string;
    shardHashes: string[];
}>;

export type AddressesResponse = JSONRPCResponse<{
    addresses: string[];
}>;

export type SendMessageResponse = JSONRPCResponse<{
    messageID: string;
    ok: boolean;
}>;

export type ReceiveMessageResponse = JSONRPCResponse<{
    result: Param[];
}>;

export type RenVMReceiveMessageResponse = JSONRPCResponse<{
    result: [PublicParam];
}>;
