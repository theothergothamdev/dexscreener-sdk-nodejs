import WebSocket from "ws";
import EventEmitter from "events";
import { writeFileSync } from "fs";
import { join } from "path";

type ChainId = string;
type PairId = string;

interface PairIdentifier {
  id: PairId;
  chainId: ChainId;
}

interface SubscribePayload {
  ids: PairIdentifier[];
  timeframe: "h24";
  page: number;
}

interface SubscribeMessage {
  type: "subscribe";
  payload: SubscribePayload;
}

interface DexScreenerMessage {
  type: string;
  payload: any;
}

interface ConnectionOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

// Events that can be emitted by the client
type DexScreenerEvents = {
  connected: () => void;
  disconnected: (code?: number, reason?: string) => void;
  message: (data: DexScreenerMessage) => void;
  error: (error: Error) => void;
  reconnecting: (attempt: number) => void;
  subscribed: (pairs: PairIdentifier[]) => void;
};

export class DexScreenerWebSocket extends EventEmitter {
  private static readonly DEFAULT_URL = "wss://io.dexscreener.com/dex/screener/v6/pairs-search";
  private static readonly DEFAULT_OPTIONS: Required<ConnectionOptions> = {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
  };

  private ws: WebSocket | null = null;
  private options: Required<ConnectionOptions>;
  private reconnectAttempts = 0;
  private subscriptions = new Set<string>();

  constructor(private readonly url: string = DexScreenerWebSocket.DEFAULT_URL, options: ConnectionOptions = {}) {
    super();
    this.options = { ...DexScreenerWebSocket.DEFAULT_OPTIONS, ...options };
    this.connect();
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.CONNECTING) return;

    this.ws = new WebSocket(this.url, {
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Origin: "https://dexscreener.com",
        dnt: "1",
        "sec-gpc": "1",
      },
    });

    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit("connected");
      this.resubscribeAll();
    };

    this.ws.onclose = (event) => {
      this.emit("disconnected", event.code, event.reason);
      this.handleReconnect();
    };

    this.ws.onerror = () => {
      this.emit("error", new Error("WebSocket error occurred"));
    };

    this.ws.onmessage = (event) => {
      try {
        if (Buffer.isBuffer(event.data)) {
          console.log("Received buffer");
          // Generate a unique filename based on timestamp
          const timestamp = Date.now();
          const filePath = join(__dirname, `../data/data_${timestamp}.bin`);

          // Write buffer to file
          writeFileSync(filePath, event.data);
          console.log(`Buffer saved to: ${filePath}`);
        } else {
          const data = event.data.toString().trim();

          const parsedData = JSON.parse(data);
          if (typeof parsedData === "string" && parsedData === "ping") {
            console.log("Sending pong");
            this.ws?.send(JSON.stringify("pong"));
          }

          this.emit("message", parsedData);
        }
      } catch (error) {
        this.emit("error", new Error(`Failed to parse message: ${error}`));
      }
    };
  }

  private handleReconnect(): void {
    if (!this.options.autoReconnect || this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      return;
    }

    console.log("Reconnecting...");
    this.reconnectAttempts++;
    this.emit("reconnecting", this.reconnectAttempts);

    setTimeout(() => {
      this.connect();
    }, this.options.reconnectDelay * this.reconnectAttempts);
  }

  private resubscribeAll(): void {
    if (this.subscriptions.size === 0) return;

    const pairs = Array.from(this.subscriptions).map((sub) => {
      const [chainId, pairId] = sub.split(":");
      return { chainId, id: pairId };
    });

    this.sendSubscribeMessage(pairs);
  }

  private sendSubscribeMessage(pairs: PairIdentifier[]): void {
    const message: SubscribeMessage = {
      type: "subscribe",
      payload: {
        ids: pairs,
        timeframe: "h24",
        page: 1,
      },
    };

    this.sendMessage(message);
  }

  private sendMessage(message: any): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    try {
      const messageString = JSON.stringify(message);
      this.ws.send(messageString);

      // Emit subscribed event immediately after sending subscribe message
      if (message.type === "subscribe") {
        this.emit("subscribed", message.payload.ids);
      }
    } catch (error) {
      this.emit("error", new Error(`Failed to send message: ${error}`));
    }
  }

  public subscribe(pairs: PairIdentifier[]): void {
    pairs.forEach((pair) => {
      this.subscriptions.add(`${pair.chainId}:${pair.id}`);
    });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribeMessage(pairs);
    }
  }

  public unsubscribe(pairs: PairIdentifier[]): void {
    pairs.forEach((pair) => {
      this.subscriptions.delete(`${pair.chainId}:${pair.id}`);
    });
  }

  public close(code?: number, reason?: string): void {
    this.options.autoReconnect = false;
    this.ws?.close(code, reason);
  }

  public get state(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  public on<K extends keyof DexScreenerEvents>(event: K, listener: DexScreenerEvents[K]): this {
    return super.on(event, listener);
  }

  public emit<K extends keyof DexScreenerEvents>(event: K, ...args: Parameters<DexScreenerEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}
