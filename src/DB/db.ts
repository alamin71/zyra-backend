import dns from "dns";
import mongoose from "mongoose";
import colors from "colors";
import { errorLogger, logger } from "../shared/logger";
import config from "../config";

const MONGOOSE_CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  maxPoolSize: config.node_env === "production" ? 100 : 10,
  minPoolSize: config.node_env === "production" ? 5 : 2,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4
  retryWrites: true,
  retryReads: true,
} as const;

// Set up MongoDB connection listeners
export function setupMongooseListeners(): void {
  mongoose.connection.on("error", (err) => {
    errorLogger.error(colors.red("MongoDB connection error:"), err);
    if (config.node_env === "production") {
      logger.error(colors.red("Critical database error - restarting worker"));
      process.exit(1);
    }
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn(
      colors.yellow("MongoDB disconnected. Attempting to reconnect...")
    );
  });

  mongoose.connection.on("reconnected", () => {
    logger.info(colors.green("MongoDB reconnected successfully"));
  });

  mongoose.connection.on("reconnectFailed", () => {
    errorLogger.error(
      colors.red("MongoDB reconnection failed after multiple attempts")
    );
    if (config.node_env === "production") {
      process.exit(1);
    }
  });
}

// Connect to MongoDB
export async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.database_url as string, MONGOOSE_CONNECT_OPTIONS);
    logger.info(colors.bgCyan("🚀 Database connected successfully"));
    setupMongooseListeners();
  } catch (error) {
    // Some dev/sandboxed networks have a local resolver that answers plain
    // A/AAAA queries fine but refuses the SRV+TXT lookup a `mongodb+srv://`
    // URI needs, even though the OS's own DNS tooling resolves it correctly.
    // Retrying once against a public resolver only in non-production covers
    // that case without ever overriding DNS on a real deployment.
    const isDnsError =
      error instanceof Error && /querySrv|ENOTFOUND|EAI_AGAIN/.test(error.message);

    if (isDnsError && config.node_env !== "production") {
      logger.warn(
        colors.yellow(
          "Database connection error via the system DNS resolver — retrying with a public DNS resolver (dev only)"
        )
      );
      dns.setServers(["8.8.8.8", "1.1.1.1"]);

      try {
        await mongoose.connect(config.database_url as string, MONGOOSE_CONNECT_OPTIONS);
        logger.info(
          colors.bgCyan("🚀 Database connected successfully (public DNS fallback)")
        );
        setupMongooseListeners();
        return;
      } catch (retryError) {
        errorLogger.error(
          colors.red("Database connection error (after DNS fallback)"),
          retryError
        );
        process.exit(1);
      }
    }

    errorLogger.error(colors.red("Database connection error"), error);
    process.exit(1);
  }
}
