interface BotConfig {
  name: string;
  version: number;
  active: boolean;
}

const hamaiConfig: BotConfig = {
  name: 'はまい',
  version: 1,
  active: true,
};

console.log('設定完了:', hamaiConfig.name);