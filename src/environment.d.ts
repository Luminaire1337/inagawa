declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      PARADISERPG_LOGIN: string;
      PARADISERPG_PASSWORD: string;
      PARADISERPG_GROUPID: number;
      DISCORD_TOKEN: string;
      DISCORD_VEHICLES_INFO_CHANNEL: number;
      DISCORD_LOGS_CHANNEL: number;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
